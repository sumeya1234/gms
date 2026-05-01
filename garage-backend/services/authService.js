import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (userData) => {
  const { fullName, email, phone, password, role } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  let result;
  try {
    [result] = await db.query(
      `INSERT INTO users (FullName, Email, PhoneNumber, PasswordHash, Role)
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

  
  if (role === "Customer") {
    await db.query("INSERT INTO customers (UserID) VALUES (?)", [userId]);
  } else if (role === "SuperAdmin") {
    await db.query("INSERT INTO superadmins (UserID) VALUES (?)", [userId]);
  } else if (role === "GarageManager") {
    
    await db.query("INSERT INTO garagemanagers (UserID) VALUES (?)", [userId]);
  }

  return { userId, role };
};

export const loginUser = async (email, password) => {
  const [rows] = await db.query("SELECT * FROM users WHERE Email = ?", [email]);

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
    error.status = 401; 
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
  const [rows] = await db.query("SELECT UserID FROM users WHERE Email = ?", [email]);
  if (rows.length === 0) {
    const error = new Error("User with that email not found");
    error.status = 404;
    throw error;
  }

  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.query(
    "INSERT INTO passwordresets (Email, OTP, ExpiresAt) VALUES (?, ?, ?)",
    [email, otp, expiresAt]
  );

  return otp;
};

export const verifyAndResetPassword = async (email, otp, newPassword) => {
  
  const [resetRows] = await db.query(
    "SELECT * FROM passwordresets WHERE Email = ? AND OTP = ? AND ExpiresAt > NOW()",
    [email, otp]
  );

  if (resetRows.length === 0) {
    const error = new Error("Invalid or expired OTP");
    error.status = 400;
    throw error;
  }

  
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  
  const [updateResult] = await db.query(
    "UPDATE users SET PasswordHash = ? WHERE Email = ?",
    [hashedPassword, email]
  );

  if (updateResult.affectedRows === 0) {
    const error = new Error("User not found to update password");
    error.status = 404;
    throw error;
  }

  
  await db.query("DELETE FROM passwordresets WHERE Email = ?", [email]);

  return true;
};
