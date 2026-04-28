import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validatePayment = Joi.object({
  requestId: idSchema.required(),
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid("Cash", "Chapa").required(),
  category: Joi.string().valid("Deposit", "Final").optional().default("Final")
});
