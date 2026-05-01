import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';

describe('vehicles Endpoints', () => {
    let customer1, customer2;
    let vehicleId; 

    beforeAll(async () => {
        customer1 = await createTestUserWithToken('Customer');
        customer2 = await createTestUserWithToken('Customer');
    });

    it('Should allow a Customer to add a new vehicle (POST /api/vehicles/)', async () => {
        const response = await request(app)
            .post('/api/vehicles/')
            .set('Authorization', `Bearer ${customer1.token}`)
            .send({
                plateNumber: "ABC-1234",
                type: "Car",
                model: "Toyota Corolla"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Vehicle added');
    });

    it('Should fetch my own vehicles (GET /api/vehicles/)', async () => {
        const response = await request(app)
            .get('/api/vehicles/')
            .set('Authorization', `Bearer ${customer1.token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        
        
        vehicleId = response.body[0].VehicleID;
        expect(response.body[0]).toHaveProperty('PlateNumber', 'ABC-1234');
    });

    it('Should fetch a specific vehicle by ID (GET /api/vehicles/:id)', async () => {
        const response = await request(app)
            .get(`/api/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${customer1.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('VehicleID', vehicleId);
    });

    it('Should prevent another user from fetching my vehicle', async () => {
        const response = await request(app)
            .get(`/api/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${customer2.token}`);

        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Vehicle not found or unauthorized');
    });

    it('Should update my vehicle details (PUT /api/vehicles/:id)', async () => {
        const response = await request(app)
            .put(`/api/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${customer1.token}`)
            .send({
                model: "Honda Civic"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Vehicle updated successfully');

        
        const fetchRes = await request(app)
            .get(`/api/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${customer1.token}`);
        expect(fetchRes.body.Model).toBe("Honda Civic");
    });

    it('Should delete my vehicle (DELETE /api/vehicles/:id)', async () => {
        const response = await request(app)
            .delete(`/api/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${customer1.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Vehicle deleted successfully');

        
        const fetchRes = await request(app)
            .get(`/api/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${customer1.token}`);
        expect(fetchRes.status).toBe(404);
    });
});
