import 'dotenv/config';
import db from "./config/db.js";

async function diagnose() {
    try {
        console.log("--- Users ---");
        const [users] = await db.query("SELECT UserID, FullName, Email, Role FROM Users WHERE Role = 'GarageManager'");
        console.table(users);

        console.log("\n--- GarageManagers Table ---");
        const [managers] = await db.query("SELECT * FROM GarageManagers");
        console.table(managers);

        console.log("\n--- Garages Table (ManagerID column) ---");
        const [garages] = await db.query("SELECT GarageID, Name, ManagerID FROM Garages");
        console.table(garages);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnose();
