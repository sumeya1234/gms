import Joi from "joi";

export const validateGarage = Joi.object({
  name: Joi.string().min(3).required(),
  location: Joi.string().min(3).required(),
  contact: Joi.string().min(10).max(20).optional().allow('', null),
  managerId: Joi.number().integer().positive().allow(null).optional(),
  bankCode: Joi.string().required(),
  bankAccountNumber: Joi.string().required(),
  bankAccountName: Joi.string().required(),
  preserviceDepositPercentage: Joi.number().valid(0, 5, 10, 15).optional()
});

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateGarageUpdate = Joi.object({
  name: Joi.string().min(3).optional(),
  location: Joi.string().min(3).optional(),
  contact: Joi.string().min(10).max(20).optional().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  managerId: Joi.number().integer().positive().allow(null).optional(),
  bankCode: Joi.string().optional(),
  bankAccountNumber: Joi.string().optional(),
  bankAccountName: Joi.string().optional(),
  workingHours: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
  preserviceDepositPercentage: Joi.number().valid(0, 5, 10, 15).optional()
}).min(1);

export const validateGarageId = Joi.object({
  id: idSchema.required()
});
