import Joi from "joi";

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().uuid()
).messages({
  'alternatives.match': 'ID must be a valid number or unique identifier.',
  'any.required': 'ID is required.'
});

export const validateServiceRequest = Joi.object({
  serviceType: Joi.string().min(2).required().messages({
    "string.empty": "Please specify the service type."
  }),
  vehicleId: idSchema.required(),
  garageId: idSchema.required(),
  description: Joi.string().optional().allow(""),
  isEmergency: Joi.boolean().optional(),
  customerStatus: Joi.string().optional().allow(""),
  bookingDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null, "").messages({
    "string.pattern.base": "Invalid date format. Please use YYYY-MM-DD."
  }),
  dropOffTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional().allow(null, "").messages({
    "string.pattern.base": "Invalid time format. Please use HH:MM."
  }),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
  address: Joi.string().optional().allow(null, ""),
  issueImage: Joi.alternatives().try(
    Joi.array().items(Joi.string()).optional().allow(null),
    Joi.string().optional().allow(null, "")
  ).optional().allow(null)

});

export const validateAssignMechanic = Joi.object({
  requestId: idSchema.required(),
  mechanicId: idSchema.required()
});

export const validateUpdateStatus = Joi.object({
  requestId: idSchema.optional(), // Optional if in params
  status: Joi.string().valid("Pending", "Approved", "Rejected", "InProgress", "Arrived", "Working", "Completed").required().messages({
    "any.only": "Invalid status selected."
  }),
  rejectionReason: Joi.string().optional().allow(""),
  estimatedPrice: Joi.number().optional().allow(null).messages({
    "number.base": "Estimate price must be a number."
  }),
  depositPercentage: Joi.number().integer().min(0).max(100).optional().allow(null).messages({
    "number.base": "Deposit percentage must be a number.",
    "number.max": "Deposit cannot exceed 100%."
  })
});

export const validateCompleteService = Joi.object({
  requestId: idSchema.required(),
  itemsUsed: Joi.array().items(Joi.object({
    itemId: idSchema.required(),
    quantity: Joi.number().integer().positive().required()
  })).optional()
});

export const validateAssignmentStatus = Joi.object({
  status: Joi.string().valid('InProgress', 'Arrived', 'Working', 'Completed').required()
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

export const validateWalkInRequest = Joi.object({
  phone: Joi.string().pattern(/^(09|07)\d{8}$/).required().messages({
    'string.pattern.base': 'Phone number must be 10 digits starting with 09 or 07'
  }),
  plateNumber: Joi.string().pattern(/^[A-Z0-9\-\s]{3,15}$/i).required().messages({
    'string.pattern.base': 'Invalid plate number format'
  }),
  model: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Car Name (Model) is required for walk-in bookings'
  }),
  type: Joi.string().valid('Car', 'Truck', 'Motorcycle', 'Bus').default('Car'),
  serviceType: Joi.string().required(),
  fullName: Joi.string().optional().allow('', null),
  description: Joi.string().allow('', null),
  isEmergency: Joi.boolean().default(false),
  garageId: Joi.number().integer().required(),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
  address: Joi.string().optional().allow(null, ""),
  issueImage: Joi.string().optional().allow(null, "")
});

export const validateUpdateBooking = Joi.object({
  serviceType: Joi.string().optional(),
  description: Joi.string().allow('', null).optional(),
  plateNumber: Joi.string().pattern(/^[A-Z0-9\-\s]{3,15}$/i).optional(),
  model: Joi.string().min(1).max(50).optional(),
  type: Joi.string().valid('Car', 'Truck', 'Motorcycle', 'Bus').optional()
});

export const validateEta = Joi.object({
  estimatedMinutes: Joi.number().integer().min(1).max(20160).required().messages({
    'number.base': 'Estimated minutes must be a number.',
    'number.integer': 'Estimated minutes must be a whole number.',
    'number.min': 'Estimated time must be at least 1 minute.',
    'number.max': 'Estimated time cannot exceed 14 days (20160 minutes).',
    'any.required': 'Estimated minutes is required.'
  })
});
