import "../config/env.js";
import db from "../config/db.js";
import bcrypt from "bcryptjs";

const seedSuperAdmin = async () => {
  const fullName = "Super Admin";
  const email = "admin@gms.com";
  const phone = "0914567689";
  const password = "adminpassword123";
  const role = "SuperAdmin";

  try {
    // Check if user already exists
    const [existing] = await db.query("SELECT UserID FROM Users WHERE Email = ?", [email]);
    if (existing.length > 0) {
      console.log("Super Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Role)
         VALUES (?, ?, ?, ?, ?)`,
        [fullName, email, phone, hashedPassword, role]
      );

      const userId = result.insertId;

      await connection.query("INSERT INTO SuperAdmins (UserID) VALUES (?)", [userId]);

      await connection.commit();
      console.log(`Super Admin created successfully with Email: ${email} and Password: ${password}`);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error.message);
  } finally {
    process.exit(0);
  }
};

seedSuperAdmin();
