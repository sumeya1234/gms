import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.test') });

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        await connection.query(`USE \`${process.env.DB_NAME}\``);

        const schemaPath = path.join(__dirname, '../database/schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        
        const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (let statement of statements) {
            try {
                await connection.query(statement);
                
            } catch (err) {
                console.error('FAILED STATEMENT:', statement);
                console.error('ERROR:', err.message);
                return;
            }
        }
        console.log('Schema applied successfully');
    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await connection.end();
    }
}

run();
