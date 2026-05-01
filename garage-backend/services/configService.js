import db from "../config/db.js";

const configCache = new Map();
const CACHE_TTL = 300000; 


export const getConfig = async (key) => {
    const now = Date.now();
    const cached = configCache.get(key);

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.value;
    }

    try {
        const [rows] = await db.query("SELECT ConfigValue FROM systemconfigs WHERE ConfigKey = ?", [key]);
        if (rows.length === 0) {
            console.warn(`Configuration key "${key}" not found in database.`);
            return null;
        }

        const value = typeof rows[0].ConfigValue === 'string'
            ? JSON.parse(rows[0].ConfigValue)
            : rows[0].ConfigValue;

        configCache.set(key, { value, timestamp: now });
        return value;
    } catch (error) {
        console.error(`Failed to fetch config "${key}":`, error.message);
        
        if (cached) return cached.value;
        throw error;
    }
};


export const invalidateConfigCache = (key) => {
    if (key) {
        configCache.delete(key);
    } else {
        configCache.clear();
    }
};
