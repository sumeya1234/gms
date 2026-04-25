import 'dotenv/config';
import db from "./config/db.js";

async function migrate() {
    const columnsToTrack = [
        { name: 'EstimatedPrice', type: 'DECIMAL(10,2) DEFAULT NULL' },
        { name: 'DepositPercentage', type: 'INT DEFAULT NULL' },
        { name: 'CustomerStatus', type: 'TEXT DEFAULT NULL' }
    ];

    try {
        const [rows] = await db.query("DESCRIBE ServiceRequests");
        const existingColumns = rows.map(r => r.Field);

        for (const col of columnsToTrack) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                await db.query(`ALTER TABLE ServiceRequests ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
