import fs from "fs";
import path from "path";
import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

/**
 * Dumps the MySQL database to a .sql file
 * @returns {Promise<string>} Path to the created dump file
 */
export const dumpDatabase = async () => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup-${process.env.DB_NAME}-${timestamp}.sql`;
        const backupPath = path.resolve("backups", filename);

        // Ensure backups directory exists
        if (!fs.existsSync(path.resolve("backups"))) {
            fs.mkdirSync(path.resolve("backups"));
        }

        const mysqldumpPath = process.env.MYSQLDUMP_PATH ? `"${process.env.MYSQLDUMP_PATH}"` : "mysqldump";

        // Build mysqldump command
        const command = `${mysqldumpPath} -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} --result-file="${backupPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error during mysqldump:", stderr);
                return reject(error);
            }
            console.log(`Database dumped successfully to ${backupPath}`);
            resolve(backupPath);
        });
    });
};

/**
 * Deletes backup files older than a certain number of days
 * @param {number} daysToKeep Number of days to keep backups (default: 7)
 */
export const cleanupOldBackups = async (daysToKeep = 7) => {
    try {
        const backupDir = path.resolve("backups");
        if (!fs.existsSync(backupDir)) return;

        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;

        files.forEach((file) => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const ageInDays = (now - stats.mtimeMs) / msPerDay;

            if (ageInDays > daysToKeep && file.endsWith(".sql")) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${file}`);
            }
        });
    } catch (error) {
        console.error("Error during backup cleanup:", error);
    }
};

/**
 * Orchestrates the full backup process
 * @param {number} daysToKeep
 */
export const runFullBackup = async (daysToKeep = 7) => {
    try {
        console.log(`[${new Date().toLocaleString()}] Starting automated backup...`);
        await dumpDatabase();
        await cleanupOldBackups(daysToKeep);
        console.log(`[${new Date().toLocaleString()}] Backup process completed successfully.`);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Backup process failed:`, error);
    }
};
