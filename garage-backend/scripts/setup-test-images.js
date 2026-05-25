import 'dotenv/config';
import db from "../config/db.js";

async function setup() {
    try {
        const images = [
            "https://images.unsplash.com/photo-1598555239556-91d179eb9555?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=600&auto=format&fit=crop"
        ];
        const logoUrl = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=200&q=80";

        await db.query(
            "UPDATE garages SET Images = ?, LogoUrl = ? WHERE GarageID = 1",
            [JSON.stringify(images), logoUrl]
        );

        console.log("Updated GarageID 1 with test images.");
        process.exit(0);
    } catch (error) {
        console.error("Setup failed:", error);
        process.exit(1);
    }
}

setup();
