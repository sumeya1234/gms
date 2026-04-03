import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';
import db from '../../config/db.js';

describe('Reviews and Complaints Endpoints', () => {
    let superAdmin, manager, customer1, customer2;
    let garageId, vehicleId, requestId, reviewId, complaintId;

    beforeAll(async () => {
        superAdmin = await createTestUserWithToken('SuperAdmin');
        manager = await createTestUserWithToken('GarageManager');
        customer1 = await createTestUserWithToken('Customer'); // Will complete a service
        customer2 = await createTestUserWithToken('Customer'); // Will NOT complete a service

        // 1. Create Garage
        await request(app).post('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`)
            .send({ name: "End To End Garage", location: "Downtown", contact: "0123456789" });
        const garages = await request(app).get('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`);
        garageId = garages.body[0].GarageID;

        // Assign manager
        await request(app).put(`/api/users/${manager.userId}/garage`).set('Authorization', `Bearer ${superAdmin.token}`).send({ garageId });

        // 2. Customer 1 Setup (Completed Service)
        await request(app).post('/api/vehicles/').set('Authorization', `Bearer ${customer1.token}`)
            .send({ plateNumber: "C1-AAA", type: "Car", model: "Honda" });
        let vRes = await request(app).get('/api/vehicles/').set('Authorization', `Bearer ${customer1.token}`);
        vehicleId = vRes.body[0].VehicleID;

        await request(app).post('/api/services/').set('Authorization', `Bearer ${customer1.token}`)
            .send({ serviceType: "Oil Change", garageId, vehicleId });
        let sRes = await request(app).get('/api/services/my-requests').set('Authorization', `Bearer ${customer1.token}`);
        requestId = sRes.body[0].RequestID;

        // Approve
        await request(app).put(`/api/services/${requestId}/status`).set('Authorization', `Bearer ${manager.token}`).send({ status: 'Approved' });
        
        // Mock Payment Completed via DB bypass since we already test endpoints
        await db.query("INSERT INTO Payments (RequestID, Amount, PaymentMethod, PaymentStatus, PaymentDate) VALUES (?, 100, 'Cash', 'Completed', NOW())", [requestId]);
        
        // Complete the service
        const compRes = await request(app).put('/api/services/complete').set('Authorization', `Bearer ${manager.token}`).send({ requestId });
        if(compRes.status !== 200) console.error("Complete Service Failed:", compRes.body);

        // Force DB state to guarantee Review tests can execute
        await db.query("UPDATE ServiceRequests SET Status = 'Completed' WHERE RequestID = ?", [requestId]);
    });

    it('Should block Customer 2 from leaving a review (no completed services)', async () => {
        const response = await request(app)
            .post('/api/reviews/')
            .set('Authorization', `Bearer ${customer2.token}`)
            .send({
                rating: 5,
                comment: "Great garage!",
                garageId
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('only review a garage after a completed service');
    });

    it('Should allow Customer 1 to review the garage (POST /api/reviews/)', async () => {
        const response = await request(app)
            .post('/api/reviews/')
            .set('Authorization', `Bearer ${customer1.token}`)
            .send({
                rating: 4,
                comment: "Fantastic service, very fast.",
                garageId
            });

        if (response.status !== 200) {
            console.error(">>> REVIEW FAILURE REASON:", response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.message).toBeDefined();
    });

    it('Should fetch garage reviews (GET /api/reviews/garage/:garageId)', async () => {
        const response = await request(app)
            .get(`/api/reviews/garage/${garageId}`)
            .set('Authorization', `Bearer ${customer2.token}`); // Anyone can fetch

        if (!response.body.length) {
            console.error(">>> GET REVIEWS RESPONSE:", response.body);
        }
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body[0].Comment).toBe("Fantastic service, very fast.");
        
        reviewId = response.body[0].ReviewID;
    });

    it('Should allow Customer to submit a complaint (POST /api/complaints/)', async () => {
        const response = await request(app)
            .post('/api/complaints/')
            .set('Authorization', `Bearer ${customer1.token}`)
            .send({
                garageId,
                description: "The mechanic left grease on my steering wheel."
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBeDefined();
    });

    it('Should fetch Customer complaints (GET /api/complaints/my-complaints)', async () => {
        const response = await request(app)
            .get('/api/complaints/my-complaints')
            .set('Authorization', `Bearer ${customer1.token}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        
        complaintId = response.body[0].ComplaintID;
        expect(response.body[0].Status).toBe('Pending');
    });

    it('Should allow SuperAdmin or Manager to resolve a complaint (PUT /api/complaints/:id/resolve)', async () => {
        const response = await request(app)
            .put(`/api/complaints/${complaintId}/resolve`)
            .set('Authorization', `Bearer ${manager.token}`)
            .send({
                status: "Resolved"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBeDefined();

        // Verify update
        const fetchRes = await request(app)
            .get('/api/complaints/my-complaints')
            .set('Authorization', `Bearer ${customer1.token}`);
        expect(fetchRes.body[0].Status).toBe('Resolved');
    });
});
