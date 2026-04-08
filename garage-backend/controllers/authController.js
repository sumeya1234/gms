import { registerUser, loginUser, generatePasswordResetOTP, verifyAndResetPassword } from "../services/authService.js";
import asyncHandler from "../utils/asyncHandler.js";

// Note: db, bcrypt, and jwt are no longer imported here. Business logic is separated.

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  // Security Fix: Only allow Customer role through public registration by default. 
  const assignedRole = "Customer"; 

  const result = await registerUser({
    fullName,
    email,
    phone,
    password,
    role: assignedRole
  });

  res.status(201).json({ message: "User registered successfully", role: result.role });
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  res.json({ token: result.token, role: result.role });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const otp = await generatePasswordResetOTP(email);
  
  // In a real application, send this OTP via email here.
  // For development/testing, we return it in the response.
  res.json({ message: "OTP generated successfully", otp });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await verifyAndResetPassword(email, otp, newPassword);

  res.json({ message: "Password reset successfully" });
});