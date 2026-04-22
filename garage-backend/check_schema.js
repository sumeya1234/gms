import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

async function findManager() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.query("SELECT Email, Role FROM Users WHERE Role = 'GarageManager' LIMIT 1;");
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Error fetching manager:', error);
    } finally {
        await connection.end();
    }
}

findManager();
