import 'dotenv/config';
import db from '../config/db.js';

async function migrate() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS PasswordResets (
                ResetID INT AUTO_INCREMENT PRIMARY KEY,
                Email VARCHAR(100) NOT NULL,
                OTP VARCHAR(10) NOT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ExpiresAt DATETIME NOT NULL
            )
        `);
        console.log("Migration successful: PasswordResets table created.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

migrate();
