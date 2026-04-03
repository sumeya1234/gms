import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('Health & Basics', () => {
    it('Should return 404 for unknown routes', async () => {
        const response = await request(app).get('/api/unknown-route');
        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
    });

    // Add more basic app tests here (e.g. rate limit, cors headers)
});
