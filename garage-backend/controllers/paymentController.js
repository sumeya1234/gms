import { createPayment } from "../services/paymentService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const makePayment = asyncHandler(async (req, res) => {
  const { requestId, amount, method } = req.body;
  await createPayment(requestId, amount, method);
  res.json({ message: "Payment successful" });
});