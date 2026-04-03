import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env.test is loaded before any other modules (like config/db.js) are evaluated
dotenv.config({ path: path.join(__dirname, '../.env.test') });
