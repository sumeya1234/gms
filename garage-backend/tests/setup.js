import { beforeEach, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env.test is loaded
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Clean tables before each test (customize this list based on where you need isolated states)
beforeEach(async () => {
    // You could put table truncates here if you want tests perfectly isolated
});

afterAll(async () => {
   // Close the DB connection pool when tests are complete to allow Vitest to exit naturally
   await db.end();
});
