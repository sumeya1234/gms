import Joi from "joi";

export const registerSchema = Joi.object({
  fullName: Joi.string().min(3).max(50).regex(/^[a-zA-Z\s\-]+$/).required().messages({
    "string.pattern.base": "Please use only letters for your name.",
    "string.empty": "Full name is required.",
    "string.min": "Name should be at least 3 characters long."
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address.",
    "string.empty": "Email is required."
  }),
  phone: Joi.string().regex(/^\+?[0-9]{10,15}$/).required().messages({
    "string.pattern.base": "Please enter a valid phone number (10-15 digits).",
    "string.empty": "Phone number is required."
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long.",
    "string.empty": "Password is required."
  }),
  otp: Joi.string().length(6).required().messages({
    "string.length": "Verification code must be 6 digits.",
    "string.empty": "Verification code is required."
  }),
  role: Joi.string().valid("Customer", "Mechanic", "GarageManager", "GarageOwner", "Accountant", "SuperAdmin").optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required()
});
export const requestRegistrationOTPSchema = Joi.object({
  email: Joi.string().email().required()
});
