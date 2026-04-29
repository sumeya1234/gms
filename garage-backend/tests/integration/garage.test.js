import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';

describe('garages Endpoints', () => {
    let superAdmin, customer, manager;
    let garageId;

    beforeAll(async () => {
        superAdmin = await createTestUserWithToken('SuperAdmin');
        customer = await createTestUserWithToken('Customer');
        manager = await createTestUserWithToken('GarageManager');
    });

    it('Should block regular customers from creating a garage (POST /api/garages/)', async () => {
        const response = await request(app)
            .post('/api/garages/')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                name: "Customer Fake Garage",
                location: "123 Nowhere St",
                contact: "1234567890"
            });

        expect(response.status).toBe(403);
    });

    it('Should allow SuperAdmin to create a garage (POST /api/garages/)', async () => {
        const response = await request(app)
            .post('/api/garages/')
            .set('Authorization', `Bearer ${superAdmin.token}`)
            .send({
                name: "Auto Fix Central",
                location: "Downtown Plaza",
                contact: "+18005551234",
                bankCode: "CBE",
                bankAccountNumber: "1000123456789",
                bankAccountName: "Auto Fix Central"
            });
        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('message', 'Garage created');
    });

    it('Should fetch all garages (GET /api/garages/)', async () => {
        const response = await request(app)
            .get('/api/garages/')
            .set('Authorization', `Bearer ${customer.token}`); // Anyone can list garages

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);

        const myGarage = response.body.find(g => g.Name === 'Auto Fix Central');
        expect(myGarage).toBeDefined();
        garageId = myGarage.GarageID;
        expect(myGarage).toHaveProperty('Name', 'Auto Fix Central');
    });

    it('Should fetch a specific garage (GET /api/garages/:id)', async () => {
        const response = await request(app)
            .get(`/api/garages/${garageId}`)
            .set('Authorization', `Bearer ${customer.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('GarageID', garageId);
    });

    it('Should fetch garage stats if authorized (GET /api/garages/:id/stats)', async () => {
        const response = await request(app)
            .get(`/api/garages/${garageId}/stats`)
            .set('Authorization', `Bearer ${superAdmin.token}`);

        expect(response.status).toBe(200);
        // Dashboard Service expects an object with activeJobs, totalRevenue, lowStockItems
        expect(response.body).toHaveProperty('activeJobs');
        expect(response.body).toHaveProperty('lowStockItems');
    });

    it('Should block unauthorized users from fetching garage stats', async () => {
        const response = await request(app)
            .get(`/api/garages/${garageId}/stats`)
            .set('Authorization', `Bearer ${customer.token}`);

        expect(response.status).toBe(403);
    });

    it('Should allow SuperAdmin to update a garage (PUT /api/garages/:id)', async () => {
        const response = await request(app)
            .put(`/api/garages/${garageId}`)
            .set('Authorization', `Bearer ${superAdmin.token}`)
            .send({
                location: "Uptown Road"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Garage updated successfully');

        // Verify update
        const fetchRes = await request(app)
            .get(`/api/garages/${garageId}`)
            .set('Authorization', `Bearer ${customer.token}`);
        expect(fetchRes.body.Location).toBe("Uptown Road");
    });

    it('Should allow SuperAdmin to delete a garage (DELETE /api/garages/:id)', async () => {
        const response = await request(app)
            .delete(`/api/garages/${garageId}`)
            .set('Authorization', `Bearer ${superAdmin.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Garage deleted successfully');

        // Verify it is gone
        const fetchRes = await request(app)
            .get(`/api/garages/${garageId}`)
            .set('Authorization', `Bearer ${customer.token}`);
        expect(fetchRes.status).toBe(404);
    });
});
