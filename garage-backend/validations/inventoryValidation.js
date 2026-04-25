import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateInventoryItem = Joi.object({
  itemName: Joi.string().min(2).required(),
  quantity: Joi.number().integer().min(0).required(),
  unitPrice: Joi.number().min(0).required(),
  supplierName: Joi.string().min(2).max(100).optional().allow("", null),
  supplierEmail: Joi.string().email().optional().allow("", null),
  supplierPhone: Joi.string().min(7).max(20).optional().allow("", null),
  garageId: idSchema.required()
});

export const validateInventoryUpdate = Joi.object({
  itemName: Joi.string().min(2).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  unitPrice: Joi.number().min(0).optional(),
  supplierName: Joi.string().min(2).max(100).optional().allow("", null),
  supplierEmail: Joi.string().email().optional().allow("", null),
  supplierPhone: Joi.string().min(7).max(20).optional().allow("", null)
}).min(1);

export const validateInventoryId = Joi.object({
  itemId: idSchema.required()
});
