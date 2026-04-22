import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateInventoryItem = Joi.object({
  itemName: Joi.string().min(2).required(),
  quantity: Joi.number().integer().min(0).required(),
  unitPrice: Joi.number().min(0).required(),
  garageId: idSchema.required(),
  supplierName: Joi.string().allow('', null).optional(),
  supplierContact: Joi.string().allow('', null).optional(),
  supplierEmail: Joi.string().email().allow('', null).optional()
});

export const validateInventoryUpdate = Joi.object({
  itemName: Joi.string().min(2).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  unitPrice: Joi.number().min(0).optional(),
  supplierName: Joi.string().allow('', null).optional(),
  supplierContact: Joi.string().allow('', null).optional(),
  supplierEmail: Joi.string().email().allow('', null).optional()
}).min(1);

export const validateInventoryId = Joi.object({
  itemId: idSchema.required()
});
