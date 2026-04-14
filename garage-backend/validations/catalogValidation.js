import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateCatalogItem = Joi.object({
  serviceName: Joi.string().min(2).required(),
  price: Joi.number().min(0).precision(2).required(),
  garageId: idSchema.required()
});

export const validateCatalogUpdate = Joi.object({
  serviceName: Joi.string().min(2).required(),
  price: Joi.number().min(0).precision(2).required()
});
