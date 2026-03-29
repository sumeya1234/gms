import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateComplaint = Joi.object({
  garageId: idSchema.required(),
  description: Joi.string().min(10).required()
});

export const validateComplaintStatus = Joi.object({
  status: Joi.string().valid('Reviewed', 'Resolved').required()
});

export const validateComplaintId = Joi.object({
  complaintId: idSchema.required()
});
