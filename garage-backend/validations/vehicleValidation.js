import Joi from "joi";

export const validateVehicle = Joi.object({
  plateNumber: Joi.string().min(2).required(),
  type: Joi.string().min(2).required(),
  model: Joi.string().min(2).required()
});

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateVehicleUpdate = Joi.object({
  plateNumber: Joi.string().min(2).optional(),
  type: Joi.string().min(2).optional(),
  model: Joi.string().min(2).optional()
}).min(1);

export const validateVehicleId = Joi.object({
  id: idSchema.required()
});
