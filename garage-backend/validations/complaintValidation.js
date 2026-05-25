import Joi from "joi";

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().uuid()
).messages({
  'alternatives.match': 'ID must be a valid number or unique identifier.',
  'any.required': 'ID is required.'
});

export const validateComplaint = Joi.object({
  garageId: idSchema.required(),
  description: Joi.string().min(10).required(),
  isEscalated: Joi.boolean().optional().default(false)
});

export const validateComplaintStatus = Joi.object({
  status: Joi.string().valid('Reviewed', 'Resolved').required()
});

export const validateComplaintId = Joi.object({
  complaintId: idSchema.required()
});
