import express from "express";
import { makePayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validatePayment } from "../validations/paymentValidation.js";

const router = express.Router();

router.post("/pay", protect, authorize("Customer"), validate(validatePayment), makePayment);

export default router;