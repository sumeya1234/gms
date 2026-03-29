import { registerUser, loginUser } from "../services/authService.js";
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