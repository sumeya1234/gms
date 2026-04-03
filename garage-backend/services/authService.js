import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (userData) => {
  const { fullName, email, phone, password, role } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    `INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Role)
     VALUES (?, ?, ?, ?, ?)`,
    [fullName, email, phone, hashedPassword, role]
  );

  const userId = result.insertId;

  // Insert into role table based on constrained explicit logic
  if (role === "Customer") {
    await db.query("INSERT INTO Customers (UserID) VALUES (?)", [userId]);
  } else if (role === "SuperAdmin") {
    await db.query("INSERT INTO SuperAdmins (UserID) VALUES (?)", [userId]);
  } else if (role === "GarageManager") {
    // Note: GarageID must be assigned separately via updateRole/assignToGarage
    await db.query("INSERT INTO GarageManagers (UserID) VALUES (?)", [userId]);
  }

  return { userId, role };
};

export const loginUser = async (email, password) => {
  const [rows] = await db.query("SELECT * FROM Users WHERE Email = ?", [email]);

  if (rows.length === 0) {
    const error = new Error("User not found");
    error.status = 400;
    throw error;
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.PasswordHash);

  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.status = 401; // Should be 401 Unauthorized
    throw error;
  }

  const token = jwt.sign(
    { id: user.UserID, role: user.Role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token, role: user.Role };
};
