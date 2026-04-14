import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.query(`
            ALTER TABLE ServiceRequests 
            ADD COLUMN BookingDate DATE,
            ADD COLUMN DropOffTime TIME,
            ADD COLUMN EstimatedDuration DECIMAL(5,2);
        `);

        console.log('Successfully altered ServiceRequests', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error altering table:', error.message);
        process.exit(1);
    }
}

run();
