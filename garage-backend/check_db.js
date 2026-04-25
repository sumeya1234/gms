import 'dotenv/config';
import db from "./config/db.js";

async function check() {
    try {
        const [rows] = await db.query("DESCRIBE ServiceRequests");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
