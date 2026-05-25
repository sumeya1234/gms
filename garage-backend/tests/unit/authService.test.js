import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser, loginUser } from '../../services/authService.js';
import db from '../../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../../config/db.js', () => ({
  default: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}));

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('registerUser', () => {
    it('should hash password and insert user into db', async () => {
      const userData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0911223344',
        password: 'password123',
        role: 'Customer',
      };

      bcrypt.hash.mockResolvedValue('hashed_password');
      db.query.mockResolvedValueOnce([{ insertId: 123 }]); // user insert
      db.query.mockResolvedValueOnce([{}]); // customer insert

      const result = await registerUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['John Doe', 'john@example.com', '0911223344', 'hashed_password', 'Customer']
      );
      expect(result).toEqual({ userId: 123, role: 'Customer' });
    });

    it('should throw 409 if email already exists', async () => {
      const userData = { email: 'john@example.com', password: 'p' };
      const dupError = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      dupError.message = 'Duplicate entry for key users.Email';
      
      db.query.mockRejectedValue(dupError);

      await expect(registerUser(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('loginUser', () => {
    it('should throw error if user not found', async () => {
      db.query.mockResolvedValue([[]]);

      await expect(loginUser('none@ex.com', 'p')).rejects.toThrow('User not found');
    });

    it('should throw error if account is suspended', async () => {
      db.query.mockResolvedValue([[{ UserID: 1, Status: 'Suspended' }]]);

      await expect(loginUser('john@ex.com', 'p')).rejects.toThrow('Account suspended');
    });

    it('should return token if credentials are valid', async () => {
      const mockUser = { UserID: 1, Email: 'j@e.com', PasswordHash: 'hash', Role: 'Customer', Status: 'Active' };
      db.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_token');

      const result = await loginUser('j@e.com', 'p');

      expect(bcrypt.compare).toHaveBeenCalledWith('p', 'hash');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1, role: 'Customer' }, 'test-secret', { expiresIn: '1d' });
      expect(result.token).toBe('mock_token');
    });

    it('should throw 401 for invalid credentials', async () => {
      db.query.mockResolvedValue([[{ UserID: 1, PasswordHash: 'hash', Status: 'Active' }]]);
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginUser('j@e.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });
});
