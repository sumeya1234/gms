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
  role: Joi.string().valid('Customer', 'Mechanic', 'GarageManager', 'SuperAdmin').required()
});

export const validateGarageAssignment = Joi.object({
  garageId: Joi.number().integer().positive().required()
});

export const validatePushToken = Joi.object({
  token: Joi.string().required(),
  deviceType: Joi.string().valid('Android').optional().default('Android')
});
