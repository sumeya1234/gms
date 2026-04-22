import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'garageadmin',
        password: 'P_cCfaTDW!2z!o-*',
        database: 'gms'
    });

    try {
        await connection.query("ALTER TABLE Garages ADD COLUMN WorkingHours JSON;");
        console.log("Column added successfully!");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(err);
        }
    } finally {
        await connection.end();
        process.exit();
    }
}
run();
