import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cancelServiceRequest, createWalkInRequest } from '../../services/bookingService.js';
import db from '../../config/db.js';
import { calculateDuration } from '../../utils/serviceUtils.js';

vi.mock('../../config/db.js', () => ({
  default: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

vi.mock('../../services/notificationService.js', () => ({
  createNotification: vi.fn(),
  deleteNotificationByType: vi.fn()
}));

vi.mock('../../utils/serviceUtils.js', () => ({
  calculateDuration: vi.fn()
}));

vi.mock('../../services/configService.js', () => ({
  getConfig: vi.fn()
}));

describe('Booking Service Unit Tests - Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cancelServiceRequest', () => {
    it('should throw error if request not found', async () => {
      db.query.mockResolvedValue([[]]);
      await expect(cancelServiceRequest(1, 101)).rejects.toThrow('Service request not found');
    });

    it('should throw error if user is not the owner', async () => {
      db.query.mockResolvedValue([[{ RequestID: 1, CustomerID: 200 }]]);
      await expect(cancelServiceRequest(1, 101)).rejects.toThrow('Unauthorized');
    });

    it('should throw error if status is not Pending or Approved', async () => {
      db.query.mockResolvedValue([[{ RequestID: 1, CustomerID: 101, Status: 'InProgress' }]]);
      await expect(cancelServiceRequest(1, 101)).rejects.toThrow('Cannot cancel');
    });

    it('should successfully cancel a pending request', async () => {
      db.query.mockResolvedValueOnce([[{ RequestID: 1, CustomerID: 101, Status: 'Pending', GarageID: 50, ServiceType: 'Oil' }]]);
      db.query.mockResolvedValueOnce([[]]); // assignments check
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update status
      db.query.mockResolvedValueOnce([[{ ManagerID: 99, Name: 'Garage A' }]]); // garage info

      await cancelServiceRequest(1, 101);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE servicerequests SET Status = 'Cancelled'"),
        [1]
      );
    });
  });

  describe('createWalkInRequest', () => {
    it('should create a new user and vehicle if they dont exist', async () => {
      const garageId = 1;
      const walkInData = {
        phone: '0900112233',
        plateNumber: 'AA123',
        serviceType: 'Oil Change',
        fullName: 'New Customer'
      };

      db.query.mockResolvedValueOnce([[]]); // user check
      db.query.mockResolvedValueOnce([{ insertId: 500 }]); // user insert
      db.query.mockResolvedValueOnce([[]]); // vehicle check
      db.query.mockResolvedValueOnce([{ insertId: 600 }]); // vehicle insert
      calculateDuration.mockReturnValue(1.0);
      db.query.mockResolvedValueOnce([{ insertId: 700 }]); // request insert

      const result = await createWalkInRequest(garageId, walkInData);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['0900112233', 'New Customer'])
      );
      expect(result).toBe(700);
    });
  });
});
