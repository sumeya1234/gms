import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';

describe('Payment Endpoints', () => {
    let superAdmin, customer;
    let garageId, vehicleId, requestId;

    beforeAll(async () => {
        superAdmin = await createTestUserWithToken('SuperAdmin');
        customer = await createTestUserWithToken('Customer');

        // Create Garage
        await request(app).post('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`)
            .send({ name: "Payment Garage", location: "Downtown", contact: "0999999999" });
        const garages = await request(app).get('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`);
        garageId = garages.body[0].GarageID;

        // Create Vehicle
        await request(app).post('/api/vehicles/').set('Authorization', `Bearer ${customer.token}`)
            .send({ plateNumber: "PAY-111", type: "Car", model: "Toyota" });
        const vehicles = await request(app).get('/api/vehicles/').set('Authorization', `Bearer ${customer.token}`);
        vehicleId = vehicles.body[0].VehicleID;

        // Create Service Request
        await request(app).post('/api/services/').set('Authorization', `Bearer ${customer.token}`)
            .send({ serviceType: "Inspection", garageId, vehicleId });
        
        const requests = await request(app).get('/api/services/my-requests').set('Authorization', `Bearer ${customer.token}`);
        requestId = requests.body[0].RequestID;
    });

    it('Should allow a Customer to pay for their service (POST /api/payments/pay)', async () => {
        const response = await request(app)
            .post('/api/payments/pay')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                requestId,
                amount: 150.00,
                method: "Cash"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Payment successful');
    });

    it('Should block payment if Service Request does not exist (POST /api/payments/pay)', async () => {
        const response = await request(app)
            .post('/api/payments/pay')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                requestId: 999999, // Fake request
                amount: 150.00,
                method: "Chapa"
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Service request not found');
    });
});
