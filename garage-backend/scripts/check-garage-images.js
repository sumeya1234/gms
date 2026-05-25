import 'dotenv/config';
import db from "../config/db.js";

async function check() {
    try {
        const [rows] = await db.query("SELECT GarageID, Name, Images, LogoUrl FROM garages LIMIT 10");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

check();
