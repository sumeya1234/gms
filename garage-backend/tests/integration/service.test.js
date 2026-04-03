import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';
import db from '../../config/db.js';

describe('Service Requests Endpoints', () => {
    let superAdmin, manager, mechanic, customer;
    let garageId, vehicleId, requestId, mechanicAssignmentId;

    // --- SETUP HEAVY DATA ---
    beforeAll(async () => {
        superAdmin = await createTestUserWithToken('SuperAdmin');
        manager = await createTestUserWithToken('GarageManager');
        mechanic = await createTestUserWithToken('Mechanic');
        customer = await createTestUserWithToken('Customer');

        // 1. SuperAdmin creates a Garage
        const gRes = await request(app)
            .post('/api/garages/')
            .set('Authorization', `Bearer ${superAdmin.token}`)
            .send({ name: "Service Test Garage", location: "Downtown", contact: "1234765432" });
        
        // Fetch it back to get ID 
        // We know it's there, but let's query DB to be safe or use GET Garages
        const allGarages = await request(app).get('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`);
        garageId = allGarages.body.find(g => g.Name === "Service Test Garage").GarageID;

        // 2. SuperAdmin assigns Manager to Garage
        await request(app)
            .put(`/api/users/${manager.userId}/garage`)
            .set('Authorization', `Bearer ${superAdmin.token}`)
            .send({ garageId });

        // 3. Manager assigns Mechanic to Garage
        await request(app)
            .put(`/api/users/${mechanic.userId}/garage`)
            .set('Authorization', `Bearer ${manager.token}`)
            .send({ garageId });

        // 4. Customer adds a Vehicle
        await request(app)
            .post('/api/vehicles/')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ plateNumber: "SRV-999", type: "Car", model: "Ford Focus" });

        const allVehicles = await request(app).get('/api/vehicles/').set('Authorization', `Bearer ${customer.token}`);
        vehicleId = allVehicles.body[0].VehicleID;
    });

    // --- TESTS ---
    it('Should allow a Customer to request a service (POST /api/services/)', async () => {
        const response = await request(app)
            .post('/api/services/')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                serviceType: "Oil Change",
                vehicleId,
                garageId,
                description: "Standard synthetic oil change."
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Service request created');
    });

    it('Should fetch customer requests (GET /api/services/my-requests)', async () => {
        const response = await request(app)
            .get('/api/services/my-requests')
            .set('Authorization', `Bearer ${customer.token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        
        requestId = response.body[0].RequestID;
        expect(response.body[0].Status).toBe('Pending'); // Default status
    });

    it('Should fetch garage requests for manager (GET /api/services/garage/:garageId)', async () => {
        const response = await request(app)
            .get(`/api/services/garage/${garageId}`)
            .set('Authorization', `Bearer ${manager.token}`);

        expect(response.status).toBe(200);
        expect(response.body.some(req => req.RequestID === requestId)).toBe(true);
    });

    it('Should block unauthorized managers from viewing requests (GET /api/services/garage/:garageId)', async () => {
        const fakeManager = await createTestUserWithToken('GarageManager');
        const response = await request(app)
            .get(`/api/services/garage/${garageId}`)
            .set('Authorization', `Bearer ${fakeManager.token}`);

        expect(response.status).toBe(403);
    });

    it('Should allow Manager to approve the request (PUT /api/services/:requestId/status)', async () => {
        const response = await request(app)
            .put(`/api/services/${requestId}/status`)
            .set('Authorization', `Bearer ${manager.token}`)
            .send({ status: 'Approved' });

        expect(response.status).toBe(200);

        // Verify it changed
        const fetchRes = await request(app)
            .get(`/api/services/${requestId}`)
            .set('Authorization', `Bearer ${customer.token}`);
        expect(fetchRes.body.Status).toBe('Approved');
    });

    it('Should allow Manager to assign a Mechanic (POST /api/services/assign)', async () => {
        const response = await request(app)
            .post('/api/services/assign')
            .set('Authorization', `Bearer ${manager.token}`)
            .send({ requestId, mechanicId: mechanic.userId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Mechanic assigned successfully');

        // Fetch mechanicAssignmentId from DB to test Mechanic endpoints
        const [assignment] = await db.query(
            "SELECT AssignmentID FROM MechanicAssignments WHERE RequestID = ? AND MechanicID = ?",
            [requestId, mechanic.userId]
        );
        mechanicAssignmentId = assignment[0].AssignmentID;
    });

    it('Should allow Mechanic to update job status (PUT /api/services/assignments/:id/status)', async () => {
        const response = await request(app)
            .put(`/api/services/assignments/${mechanicAssignmentId}/status`)
            .set('Authorization', `Bearer ${mechanic.token}`)
            .send({ status: 'InProgress' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Assignment status updated to InProgress');
    });

    it('Should fail to complete service without payment (PUT /api/services/complete)', async () => {
        const response = await request(app)
            .put('/api/services/complete')
            .set('Authorization', `Bearer ${manager.token}`)
            .send({ requestId });

        // Logic enforces payment completed check
        expect(response.status).toBe(400); 
        expect(response.body.error).toContain('payment');
    });
});
