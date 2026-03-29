import Joi from "joi";

export const validateGarage = Joi.object({
  name: Joi.string().min(3).required(),
  location: Joi.string().min(5).required(),
  contact: Joi.string().min(10).max(20).required()
});

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateGarageUpdate = Joi.object({
  name: Joi.string().min(3).optional(),
  location: Joi.string().min(5).optional(),
  contact: Joi.string().min(10).max(20).optional(),
  status: Joi.string().valid('Active', 'Inactive').optional()
}).min(1);

export const validateGarageId = Joi.object({
  id: idSchema.required()
});
