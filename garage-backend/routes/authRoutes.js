import express from "express";
import { register, login, forgotPassword, resetPassword, requestRegistrationOTP } from "../controllers/authController.js";
import validate from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, requestRegistrationOTPSchema } from "../validations/authValidation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/request-registration-otp", validate(requestRegistrationOTPSchema), requestRegistrationOTP);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;