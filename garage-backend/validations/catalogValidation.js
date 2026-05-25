import Joi from "joi";

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().uuid()
).messages({
  'alternatives.match': 'ID must be a valid number or unique identifier.',
  'any.required': 'ID is required.'
});

export const validateCatalogItem = Joi.object({
  serviceName: Joi.string().min(2).required(),
  price: Joi.number().min(0).precision(2).required(),
  garageId: idSchema.required(),
  isEmergency: Joi.boolean().optional()
});

export const validateCatalogUpdate = Joi.object({
  serviceName: Joi.string().min(2).required(),
  price: Joi.number().min(0).precision(2).required(),
  isEmergency: Joi.boolean().optional()
});
