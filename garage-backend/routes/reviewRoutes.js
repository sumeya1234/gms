import express from "express";
import { addReview, getGarageReviews, getMyReviews, deleteMyReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateReview, validateGarageId, validateReviewId } from "../validations/reviewValidation.js";

const router = express.Router();

router.post("/", protect, authorize("Customer"), validate(validateReview), addReview);
router.get("/garage/:garageId", protect, validate(validateGarageId, "params"), getGarageReviews);
router.get("/my-reviews", protect, authorize("Customer"), getMyReviews);
router.delete("/:reviewId", protect, authorize("Customer"), validate(validateReviewId, "params"), deleteMyReview);

export default router;