import express from "express";
import { makePayment, verifyPayment, webhookPayment, cancelPayment, fetchBanks, confirmCash, confirmOnline } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validatePayment } from "../validations/paymentValidation.js";

const router = express.Router();

router.get("/banks", protect, fetchBanks);
router.post("/pay", protect, authorize("Customer"), validate(validatePayment), makePayment);
router.get("/verify/:tx_ref", protect, verifyPayment);
router.put("/cancel/:tx_ref", protect, cancelPayment);
router.post("/webhook", webhookPayment); // Webhook is unprotected, handles its own security/verification
router.put("/confirm-cash/:requestId", protect, authorize("Accountant"), confirmCash);
router.put("/confirm-online/:requestId", protect, authorize("Accountant"), confirmOnline);

export default router;