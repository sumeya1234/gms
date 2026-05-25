import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  try {
    const [rows] = await db.query("SELECT * FROM pushtokens");
    console.log("Registered Push Tokens:", rows);
    const [users] = await db.query("SELECT UserID, FullName, Role FROM users");
    console.log("Users:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}
run();
