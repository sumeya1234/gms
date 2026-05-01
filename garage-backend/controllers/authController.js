import { registerUser, loginUser, generatePasswordResetOTP, verifyAndResetPassword } from "../services/authService.js";
import { sendPasswordResetOTP } from "../services/emailService.js";
import asyncHandler from "../utils/asyncHandler.js";



export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  
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
  
  const emailSent = await sendPasswordResetOTP(email, otp);
  
  if (!emailSent) {
    const error = new Error("Failed to send OTP email. Please try again.");
    error.status = 500;
    throw error;
  }
  
  res.json({ message: "OTP sent to your email successfully" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await verifyAndResetPassword(email, otp, newPassword);

  res.json({ message: "Password reset successfully" });
});