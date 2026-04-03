import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { createTestUserWithToken } from '../utils/testUtils.js';

describe('Inventory Endpoints', () => {
    let superAdmin, managerA, managerB, mechanic;
    let garageAId, garageBId, itemAId;

    beforeAll(async () => {
        superAdmin = await createTestUserWithToken('SuperAdmin');
        managerA = await createTestUserWithToken('GarageManager');
        managerB = await createTestUserWithToken('GarageManager');
        mechanic = await createTestUserWithToken('Mechanic');

        // Setup 2 Garages to test tenant isolation
        await request(app).post('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`)
            .send({ name: "Garage A", location: "Downtown", contact: "1234567890" });
        await request(app).post('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`)
            .send({ name: "Garage B", location: "Uptown", contact: "0987654321" });

        const garages = await request(app).get('/api/garages/').set('Authorization', `Bearer ${superAdmin.token}`);
        garageAId = garages.body.find(g => g.Name === "Garage A").GarageID;
        garageBId = garages.body.find(g => g.Name === "Garage B").GarageID;

        // Assign managers
        await request(app).put(`/api/users/${managerA.userId}/garage`).set('Authorization', `Bearer ${superAdmin.token}`).send({ garageId: garageAId });
        await request(app).put(`/api/users/${managerB.userId}/garage`).set('Authorization', `Bearer ${superAdmin.token}`).send({ garageId: garageBId });
    });

    it('Should allow Manager A to add an item to their garage (POST /api/inventory/)', async () => {
        const response = await request(app)
            .post('/api/inventory/')
            .set('Authorization', `Bearer ${managerA.token}`)
            .send({
                itemName: "Brake Pads",
                quantity: 50,
                unitPrice: 25.50,
                garageId: garageAId
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Item added');
    });

    it('Should block Manager B from adding items to Garage A (POST /api/inventory/)', async () => {
        const response = await request(app)
            .post('/api/inventory/')
            .set('Authorization', `Bearer ${managerB.token}`)
            .send({
                itemName: "Stolen Wipers",
                quantity: 10,
                unitPrice: 5.00,
                garageId: garageAId // Attempting to inject into Garage A
            });

        expect(response.status).toBe(403);
    });

    it('Should fetch all items for a garage (GET /api/inventory/:garageId)', async () => {
        const response = await request(app)
            .get(`/api/inventory/${garageAId}`)
            .set('Authorization', `Bearer ${mechanic.token}`); // Anyone authenticated can view

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);

        itemAId = response.body[0].ItemID;
        expect(response.body[0]).toHaveProperty('ItemName', 'Brake Pads');
    });

    it('Should fetch a specific item (GET /api/inventory/item/:itemId)', async () => {
        const response = await request(app)
            .get(`/api/inventory/item/${itemAId}`)
            .set('Authorization', `Bearer ${mechanic.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('ItemID', itemAId);
        expect(response.body.Quantity).toBe(50);
    });

    it('Should block Manager B from updating Manager A\'s items (PUT /api/inventory/:itemId)', async () => {
        const response = await request(app)
            .put(`/api/inventory/${itemAId}`)
            .set('Authorization', `Bearer ${managerB.token}`)
            .send({ quantity: 100 });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Unauthorized: You do not manage the garage for this item');
    });

    it('Should allow Manager A to update their item quantity (PUT /api/inventory/:itemId)', async () => {
        const response = await request(app)
            .put(`/api/inventory/${itemAId}`)
            .set('Authorization', `Bearer ${managerA.token}`)
            .send({ quantity: 45 }); // Used 5 pads

        expect(response.status).toBe(200);

        // Verify it changed
        const fetchRes = await request(app)
            .get(`/api/inventory/item/${itemAId}`)
            .set('Authorization', `Bearer ${mechanic.token}`);
        expect(fetchRes.body.Quantity).toBe(45);
    });

    it('Should allow Manager A to delete their item (DELETE /api/inventory/:itemId)', async () => {
        const response = await request(app)
            .delete(`/api/inventory/${itemAId}`)
            .set('Authorization', `Bearer ${managerA.token}`);

        expect(response.status).toBe(200);

        // Verify it was deleted
        const fetchRes = await request(app)
            .get(`/api/inventory/item/${itemAId}`)
            .set('Authorization', `Bearer ${mechanic.token}`);
        expect(fetchRes.status).toBe(404);
    });
});
