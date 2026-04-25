import 'dotenv/config';
import db from "./config/db.js";

async function migrate() {
    try {
        console.log("Running migration...");
        await db.query(`
            ALTER TABLE ServiceRequests 
            ADD COLUMN EstimatedPrice DECIMAL(10,2) DEFAULT NULL,
            ADD COLUMN DepositPercentage INT DEFAULT NULL,
            ADD COLUMN CustomerStatus TEXT DEFAULT NULL;
        `);
        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Columns already exist, skipping.");
            process.exit(0);
        }
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
