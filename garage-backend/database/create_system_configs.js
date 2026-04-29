import dotenv from "dotenv";
dotenv.config();
import db from "./config/db.js";

async function migrate() {
    try {
        console.log("Starting migration: Creating systemconfigs table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS systemconfigs (
                ConfigKey VARCHAR(100) PRIMARY KEY,
                ConfigValue JSON NOT NULL,
                Description TEXT,
                UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Seed data
        const configs = [
            {
                key: 'service_duration_baselines',
                value: JSON.stringify({
                    "oil change": 0.5,
                    "diagnostics": 1.5,
                    "tires": 1.0,
                    "battery": 0.5,
                    "electrical": 2.0,
                    "repair": 3.0,
                    "towing": 2.0,
                    "default": 1.0
                }),
                description: 'Calculated duration in hours for various service types'
            },
            {
                key: 'garage_capacity_settings',
                value: JSON.stringify({
                    "daily_labor_hours_per_mechanic": 8.0,
                    "max_dropoff_per_hour": 2
                }),
                description: 'Global settings for garage availability and capacity'
            }
        ];

        for (const config of configs) {
            await db.query(
                "INSERT INTO systemconfigs (ConfigKey, ConfigValue, Description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ConfigValue = VALUES(ConfigValue), Description = VALUES(Description)",
                [config.key, config.value, config.description]
            );
        }

        console.log("Migration complete: systemconfigs table created and seeded.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrate();
