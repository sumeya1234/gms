import Joi from "joi";

export const validateProfileUpdate = Joi.object({
  fullName: Joi.string().min(3).optional(),
  phone: Joi.string().min(10).max(20).optional()
}).min(1);

export const validatePasswordChange = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

export const validateRoleUpdate = Joi.object({
  role: Joi.string().valid('Customer', 'Mechanic', 'GarageManager', 'GarageOwner', 'Accountant', 'SuperAdmin').required()
});

export const validateGarageAssignment = Joi.object({
  garageId: Joi.number().integer().positive().required()
});

export const validatePushToken = Joi.object({
  token: Joi.string().required(),
  deviceType: Joi.string().valid('Android').optional().default('Android')
});

export const validateMechanicCreation = Joi.object({
  fullName: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).required(),
  password: Joi.string().min(6).allow('', null).optional(),
  skills: Joi.array().items(Joi.string()).optional()
});

export const validateMechanicStatusUpdate = Joi.object({
  status: Joi.string().valid('Active', 'Suspended', 'Archived').required()
});
