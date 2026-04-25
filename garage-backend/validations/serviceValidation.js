import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateServiceRequest = Joi.object({
  serviceType: Joi.string().min(2).required(),
  vehicleId: idSchema.required(),
  garageId: idSchema.required(),
  description: Joi.string().optional().allow(""),
  isEmergency: Joi.boolean().optional(),
  customerStatus: Joi.string().optional().allow(""),
  bookingDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null, ""),
  dropOffTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional().allow(null, "")
});

export const validateAssignMechanic = Joi.object({
  requestId: idSchema.required(),
  mechanicId: idSchema.required()
});

export const validateUpdateStatus = Joi.object({
  requestId: idSchema.optional(), // Optional if in params
  status: Joi.string().valid("Pending", "Approved", "Rejected", "InProgress", "Completed").required(),
  rejectionReason: Joi.string().optional().allow(""),
  estimatedPrice: Joi.number().optional().allow(null),
  depositPercentage: Joi.number().integer().min(0).max(100).optional().allow(null)
});

export const validateCompleteService = Joi.object({
  requestId: idSchema.required(),
  itemsUsed: Joi.array().items(Joi.object({
    itemId: idSchema.required(),
    quantity: Joi.number().integer().positive().required()
  })).optional()
});

export const validateAssignmentStatus = Joi.object({
  status: Joi.string().valid('InProgress', 'Completed').required()
});

export const validateAssignmentId = Joi.object({
  assignmentId: idSchema.required()
});

export const validateRequestId = Joi.object({
  requestId: idSchema.required()
});

export const validateGarageId = Joi.object({
  garageId: idSchema.required()
});

export const validateDocumentItems = Joi.object({
  itemsUsed: Joi.array().items(Joi.object({
    itemId: idSchema.required(),
    quantity: Joi.number().integer().positive().required()
  })).min(1).required()
});
