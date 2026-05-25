import Joi from "joi";

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer'
  }),
  Joi.string().uuid().messages({
    'string.guid': 'ID must be a valid number or unique identifier'
  })
).messages({
  'alternatives.match': 'ID must be a valid number or unique identifier.',
  'any.required': 'ID is required.'
});

export const validateInventoryItem = Joi.object({
  itemName: Joi.string().min(2).regex(/^[a-zA-Z0-9\s\-\.]+$/).required().messages({
    "string.pattern.base": "Item name should only contain letters, numbers, and basic symbols.",
    "string.empty": "Item name is required."
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "Quantity must be a number.",
    "number.min": "Quantity cannot be negative."
  }),
  unitPrice: Joi.number().min(0).required().messages({
    "number.base": "Buy Price must be a number.",
    "number.min": "Buy Price cannot be negative."
  }),
  sellingPrice: Joi.number().greater(0).required().messages({
    "number.base": "Sale Price must be a number.",
    "number.greater": "Sale Price must be greater than zero."
  }),
  supplierName: Joi.string().min(2).max(100).optional().allow("", null).messages({
    "string.min": "Supplier name should be at least 2 characters."
  }),
  supplierEmail: Joi.string().email().optional().allow("", null).messages({
    "string.email": "Please enter a valid supplier email."
  }),
  supplierPhone: Joi.string().min(7).max(20).optional().allow("", null).regex(/^\+?[0-9\s\-]+$/).messages({
    "string.pattern.base": "Invalid supplier phone number format."
  }),
  garageId: idSchema.required()
});

export const validateInventoryUpdate = Joi.object({
  itemName: Joi.string().min(2).regex(/^[a-zA-Z0-9\s\-\.]+$/).optional().messages({
    "string.pattern.base": "Item name should only contain letters, numbers, and basic symbols."
  }),
  quantity: Joi.number().integer().min(0).optional().messages({
    "number.base": "Quantity must be a number."
  }),
  unitPrice: Joi.number().min(0).optional().messages({
    "number.base": "Buy Price must be a number."
  }),
  sellingPrice: Joi.number().greater(0).optional().messages({
    "number.base": "Sale Price must be a number.",
    "number.greater": "Sale Price must be greater than zero."
  }),
  supplierName: Joi.string().min(2).max(100).optional().allow("", null),
  supplierEmail: Joi.string().email().optional().allow("", null),
  supplierPhone: Joi.string().min(7).max(20).optional().allow("", null).regex(/^\+?[0-9\s\-]+$/).messages({
    "string.pattern.base": "Invalid supplier phone number format."
  })
}).min(1);

export const validateInventoryId = Joi.object({
  itemId: idSchema.required()
});
