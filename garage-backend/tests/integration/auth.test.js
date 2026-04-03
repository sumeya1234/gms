import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('Auth Endpoints', () => {
    // Generate a payload for every test run to avoid 'unique constraint' failures
    const testUser = {
        fullName: 'Test User',
        email: `testuser-${Date.now()}@example.com`,
        phone: `+123456${Date.now().toString().slice(-4)}`, // Fake random phone
        password: 'strongPassword123!',
        role: 'Customer'
    };

    let userToken = '';

    it('Should register a new user successfully', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        // Typical express register returns 201 Created
        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('message');
        if (response.body.token) {
             userToken = response.body.token; // Save token if returned on register
        }
    });

    it('Should login an existing user successfully', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        userToken = response.body.token;
    });

    it('Should prevent login with an incorrect password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongPassword!'
            });

        expect(response.status).toBe(401);
    });
});
