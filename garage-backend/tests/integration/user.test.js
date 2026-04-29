import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';

describe('User Profiles & Admin Tools', () => {
    let customer;
    let superAdmin;
    let newUserId;

    // Seed realistic users before all tests
    beforeAll(async () => {
        customer = await createTestUserWithToken('Customer');
        superAdmin = await createTestUserWithToken('SuperAdmin');
        
        // Let's create an extra user whose role the SuperAdmin will change
        const extraUser = await createTestUserWithToken('Customer');
        newUserId = extraUser.userId;
    });

    describe('Profile Management', () => {
        it('Should fetch the current user profile (GET /api/users/profile)', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${customer.token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', customer.email);
            expect(response.body.user).toHaveProperty('role', 'Customer');
        });

        it('Should update user profile (PUT /api/users/profile)', async () => {
            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${customer.token}`)
                .send({
                    fullName: "Updated Customer Name",
                    phone: "+19999999999"
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Profile updated successfully');
        });

        it('Should change password successfully (PUT /api/users/password)', async () => {
            const response = await request(app)
                .put('/api/users/password')
                .set('Authorization', `Bearer ${customer.token}`)
                .send({
                    oldPassword: customer.password,
                    newPassword: "NewPassword123!"
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Password updated successfully');
        });

        it('Should fail to change password if old password is wrong', async () => {
            const response = await request(app)
                .put('/api/users/password')
                .set('Authorization', `Bearer ${superAdmin.token}`)
                .send({
                    oldPassword: "WrongOldPassword",
                    newPassword: "NewPassword123!"
                });

            expect(response.status).toBe(400); // Standard convention or 401
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('notifications and Tokens', () => {
        it('Should register push token for a user (POST /api/users/push-token)', async () => {
            const response = await request(app)
                .post('/api/users/push-token')
                .set('Authorization', `Bearer ${customer.token}`)
                .send({
                    token: "xyz123abcTestDeviceToken"
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Registration token saved');
        });

        it('Should fetch user notifications (GET /api/users/notifications)', async () => {
            const response = await request(app)
                .get('/api/users/notifications')
                .set('Authorization', `Bearer ${customer.token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    describe('SuperAdmin Actions', () => {
        it('Should fetch admin dashboard stats (GET /api/users/admin/dashboard)', async () => {
            const response = await request(app)
                .get('/api/users/admin/dashboard')
                .set('Authorization', `Bearer ${superAdmin.token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalUsers');
            expect(response.body).toHaveProperty('totalGarages');
        });

        it('Should deny admin dashboard access to regular Customer', async () => {
            const response = await request(app)
                .get('/api/users/admin/dashboard')
                .set('Authorization', `Bearer ${customer.token}`); // Not an admin!

            expect(response.status).toBe(403); // Forbidden
        });

        it('Should allow SuperAdmin to update a user role (PUT /api/users/:id/role)', async () => {
            // Changing newUserId from Customer to Mechanic
            const response = await request(app)
                .put(`/api/users/${newUserId}/role`)
                .set('Authorization', `Bearer ${superAdmin.token}`)
                .send({
                    role: 'Mechanic'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'User role updated to Mechanic');
        });
    });
});
