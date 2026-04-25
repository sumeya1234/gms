import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (userData) => {
  const { fullName, email, phone, password, role } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  let result;
  try {
    [result] = await db.query(
      `INSERT INTO Users (FullName, Email, PhoneNumber, PasswordHash, Role)
       VALUES (?, ?, ?, ?, ?)`,
      [fullName, email, phone, hashedPassword, role]
    );
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      const field = err.message.includes("Email") ? "Email" : (err.message.includes("PhoneNumber") ? "Phone number" : "Account details");
      const duplicateError = new Error(`${field} already exists`);
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw err;
  }

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

  if (user.Status === 'Suspended' || user.Status === 'Archived') {
    const error = new Error("Account suspended by Garage Manager");
    error.status = 403;
    throw error;
  }

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

export const generatePasswordResetOTP = async (email) => {
  const [rows] = await db.query("SELECT UserID FROM Users WHERE Email = ?", [email]);
  if (rows.length === 0) {
    const error = new Error("User with that email not found");
    error.status = 404;
    throw error;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiry to 15 minutes from now
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.query(
    "INSERT INTO PasswordResets (Email, OTP, ExpiresAt) VALUES (?, ?, ?)",
    [email, otp, expiresAt]
  );

  return otp;
};

export const verifyAndResetPassword = async (email, otp, newPassword) => {
  // Check if OTP is valid and not expired
  const [resetRows] = await db.query(
    "SELECT * FROM PasswordResets WHERE Email = ? AND OTP = ? AND ExpiresAt > NOW()",
    [email, otp]
  );

  if (resetRows.length === 0) {
    const error = new Error("Invalid or expired OTP");
    error.status = 400;
    throw error;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user's password
  const [updateResult] = await db.query(
    "UPDATE Users SET PasswordHash = ? WHERE Email = ?",
    [hashedPassword, email]
  );

  if (updateResult.affectedRows === 0) {
    const error = new Error("User not found to update password");
    error.status = 404;
    throw error;
  }

  // Delete all password resets for this email to prevent reuse
  await db.query("DELETE FROM PasswordResets WHERE Email = ?", [email]);

  return true;
};
