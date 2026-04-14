import { createReview, fetchGarageReviews, fetchCustomerReviews, removeReview } from "../services/reviewService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment, garageId, requestId } = req.body;
  await createReview(rating, comment, req.user.id, garageId, requestId || null);
  res.json({ message: "Review submitted" });
});

export const getGarageReviews = asyncHandler(async (req, res) => {
  const reviews = await fetchGarageReviews(req.params.garageId);
  res.json(reviews);
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await fetchCustomerReviews(req.user.id);
  res.json(reviews);
});

export const deleteMyReview = asyncHandler(async (req, res) => {
  await removeReview(req.params.reviewId, req.user.id);
  res.json({ message: "Review deleted successfully" });
});