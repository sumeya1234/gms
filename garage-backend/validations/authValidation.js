import Joi from "joi";

export const registerSchema = Joi.object({
  fullName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("Customer", "Mechanic", "GarageManager", "SuperAdmin").optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
