import Joi from "joi";

const workingDaySchema = Joi.object({
  isOpen: Joi.boolean().required(),
  open: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
  close: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null)
});

const workingHoursSchema = Joi.object({
  monday: workingDaySchema.required(),
  tuesday: workingDaySchema.required(),
  wednesday: workingDaySchema.required(),
  thursday: workingDaySchema.required(),
  friday: workingDaySchema.required(),
  saturday: workingDaySchema.required(),
  sunday: workingDaySchema.required()
});

export const validateGarage = Joi.object({
  name: Joi.string().min(3).regex(/^[a-zA-Z\s\-\.]+$/).required().messages({
    "string.pattern.base": "Garage name should only contain letters, spaces, hyphens and dots.",
    "string.empty": "Garage name is required."
  }),
  location: Joi.string().min(3).required().messages({
    "string.empty": "Location is required."
  }),
  contact: Joi.string().regex(/^\+?[0-9]{10,20}$/).optional().allow('', null).messages({
    "string.pattern.base": "Please enter a valid contact phone number."
  }),
  managerId: Joi.number().integer().positive().allow(null).optional(),
  ownerId: Joi.number().integer().positive().allow(null).optional(),
  bankCode: Joi.string().required().messages({
    "string.empty": "Bank code is required."
  }),
  bankAccountNumber: Joi.string().regex(/^[0-9]{10,20}$/).required().messages({
    "string.pattern.base": "Bank account number should only contain 10-20 digits.",
    "string.empty": "Bank account number is required."
  }),
  bankAccountName: Joi.string().regex(/^[a-zA-Z\s\-]+$/).required().messages({
    "string.pattern.base": "Bank account name should only contain letters and spaces.",
    "string.empty": "Bank account name is required."
  }),
  timezone: Joi.string().optional(),
  workingHours: workingHoursSchema.optional(),
  emergencyDepositPercentage: Joi.number().min(0).max(100).optional(),
  emergencyMechanicSlots: Joi.number().integer().min(1).max(50).optional().messages({
    "number.min": "Emergency slots must be at least 1.",
    "number.max": "Emergency slots cannot exceed 50.",
    "number.base": "Please enter a valid number for emergency slots."
  }),
  images: Joi.array().items(Joi.string().uri()).optional(),
  logoUrl: Joi.string().uri().allow('', null).optional(),
  latitude: Joi.number().min(-90).max(90).optional().allow(null),
  longitude: Joi.number().min(-180).max(180).optional().allow(null)
});

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().uuid()
).messages({
  'alternatives.match': 'ID must be a valid number or unique identifier.',
  'any.required': 'ID is required.'
});

export const validateGarageUpdate = Joi.object({
  name: Joi.string().min(3).regex(/^[a-zA-Z\s\-\.]+$/).optional().messages({
    "string.pattern.base": "Garage name should only contain letters, spaces, hyphens and dots."
  }),
  location: Joi.string().min(3).optional(),
  contact: Joi.string().regex(/^\+?[0-9]{10,20}$/).optional().allow('', null).messages({
    "string.pattern.base": "Please enter a valid contact phone number."
  }),
  status: Joi.string().valid('Active', 'Inactive').optional(), // Status for onboarding

  managerId: Joi.number().integer().positive().allow(null).optional(),
  ownerId: Joi.number().integer().positive().allow(null).optional(),
  bankCode: Joi.string().optional(),
  bankAccountNumber: Joi.string().regex(/^[0-9]{10,20}$/).optional().messages({
    "string.pattern.base": "Bank account number should only contain 10-20 digits."
  }),
  bankAccountName: Joi.string().regex(/^[a-zA-Z\s\-]+$/).optional().messages({
    "string.pattern.base": "Bank account name should only contain letters and spaces."
  }),
  timezone: Joi.string().optional(),
  workingHours: workingHoursSchema.optional(),
  emergencyDepositPercentage: Joi.number().min(0).max(100).optional(),
  emergencyMechanicSlots: Joi.number().integer().min(1).max(50).optional().messages({
    "number.min": "Emergency slots must be at least 1.",
    "number.max": "Emergency slots cannot exceed 50.",
    "number.base": "Please enter a valid number for emergency slots."
  }),
  images: Joi.array().items(Joi.string().uri()).optional(),
  logoUrl: Joi.string().uri().allow('', null).optional(),
  latitude: Joi.number().min(-90).max(90).optional().allow(null),
  longitude: Joi.number().min(-180).max(180).optional().allow(null)
}).min(1);

export const validateGarageId = Joi.object({
  id: idSchema.required()
});

export const validateVehicleHistoryParams = Joi.object({
  id: idSchema.required(),
  vehicleId: idSchema.required()
});
