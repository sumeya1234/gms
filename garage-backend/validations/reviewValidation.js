import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().uuid());

export const validateReview = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().optional().allow(""),
  garageId: idSchema.required(),
  requestId: Joi.number().integer().positive().optional().allow(null)
});

export const validateGarageId = Joi.object({
  garageId: idSchema.required()
});

export const validateReviewId = Joi.object({
  reviewId: idSchema.required()
});
