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
  name: Joi.string().min(3).required(),
  location: Joi.string().min(3).required(),
  contact: Joi.string().min(10).max(20).optional().allow('', null),
  managerId: Joi.number().integer().positive().allow(null).optional(),
  ownerId: Joi.number().integer().positive().allow(null).optional(),
  bankCode: Joi.string().required(),
  bankAccountNumber: Joi.string().required(),
  bankAccountName: Joi.string().required(),
  timezone: Joi.string().optional(),
  workingHours: workingHoursSchema.optional()
});

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateGarageUpdate = Joi.object({
  name: Joi.string().min(3).optional(),
  location: Joi.string().min(3).optional(),
  contact: Joi.string().min(10).max(20).optional().allow('', null),
  status: Joi.string().valid('Active', 'Inactive').optional(),
  managerId: Joi.number().integer().positive().allow(null).optional(),
  ownerId: Joi.number().integer().positive().allow(null).optional(),
  bankCode: Joi.string().optional(),
  bankAccountNumber: Joi.string().optional(),
  bankAccountName: Joi.string().optional(),
  timezone: Joi.string().optional(),
  workingHours: workingHoursSchema.optional()
}).min(1);

export const validateGarageId = Joi.object({
  id: idSchema.required()
});
