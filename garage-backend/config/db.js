import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
try {
  await db.query("SELECT 1");
  console.log("Database connected successfully.");
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exit(1);
}

export default db;