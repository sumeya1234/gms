import { createPayment, verifyChapaPayment, cancelChapaPayment, handleWebhook, getChapaBanks, confirmCashPayment, confirmOnlinePayment } from "../services/paymentService.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";

export const fetchBanks = asyncHandler(async (req, res) => {
  const banks = await getChapaBanks();
  res.status(200).json(banks);
});

export const makePayment = asyncHandler(async (req, res) => {
  const { requestId, amount, method, category } = req.body;
  const result = await createPayment(requestId, amount, method, category);

  
  res.status(200).json({
    message: "Payment initialized successfully",
    data: result
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { tx_ref } = req.params;
  const result = await verifyChapaPayment(tx_ref);
  res.status(200).json(result);
});

export const cancelPayment = asyncHandler(async (req, res) => {
  const { tx_ref } = req.params;
  const result = await cancelChapaPayment(tx_ref);
  res.status(200).json(result);
});

export const webhookPayment = asyncHandler(async (req, res) => {
  const hash = crypto.createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET || "")
    .update(JSON.stringify(req.body))
    .digest("hex");

  const chapaSignature = req.headers["chapa-signature"] || req.headers["x-chapa-signature"];

  if (hash !== chapaSignature) {
    console.warn("Invalid Chapa webhook signature detected!");
    return res.status(400).send("Invalid Signature");
  }

  await handleWebhook(req.body);
  res.status(200).send("Webhook received");
});

export const confirmCash = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const category = req.query.category || 'Final';
  const result = await confirmCashPayment(requestId, req.user.id, category);
  res.status(200).json(result);
});

export const confirmOnline = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const category = req.query.category || 'Final';
  const result = await confirmOnlinePayment(requestId, req.user.id, category);
  res.status(200).json(result);
});