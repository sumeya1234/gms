import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from the root .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const sqlPath = path.resolve(process.cwd(), "database", "updateSchema_v2.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing migration v2...");
    await connection.query(sql);
    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

runMigration();
