import "../config/env.js";
import db from "../config/db.js";
import { updateRole } from "../services/userService.js";

const verifyRoleUpdate = async () => {
  try {
    // 1. Create a test user
    const [userResult] = await db.query(
      "INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Role) VALUES (?, ?, ?, ?, ?)",
      ["Test User", "test_role@gms.com", "0900000001", "hash", "Customer"]
    );
    const userId = userResult.insertId;
    console.log("Test user created with ID:", userId);

    // 2. Initial check - should be in Customers table
    const [customers] = await db.query("SELECT * FROM Customers WHERE UserID = ?", [userId]);
    console.log("In Customers table before update:", customers.length > 0);

    // 3. Promote to SuperAdmin
    await updateRole(userId, "SuperAdmin");
    console.log("Promoted to SuperAdmin");

    // 4. Verify sub-tables
    const [custAfter] = await db.query("SELECT * FROM Customers WHERE UserID = ?", [userId]);
    const [admins] = await db.query("SELECT * FROM SuperAdmins WHERE UserID = ?", [userId]);
    console.log("Removed from Customers table:", custAfter.length === 0);
    console.log("Added to SuperAdmins table:", admins.length > 0);

    // 5. Cleanup
    await db.query("DELETE FROM SuperAdmins WHERE UserID = ?", [userId]);
    await db.query("DELETE FROM Users WHERE UserID = ?", [userId]);
    console.log("Cleanup complete.");

  } catch (err) {
    console.error("Verification failed:", err.message);
  } finally {
    process.exit(0);
  }
};

verifyRoleUpdate();
