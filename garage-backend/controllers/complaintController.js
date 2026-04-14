import { addComplaint, updateComplaintStatus, fetchCustomerComplaints, fetchGarageComplaints, addComplaintMessage, fetchComplaintMessages, fetchAllComplaints } from "../services/complaintService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createComplaint = asyncHandler(async (req, res) => {
  const { garageId, description, isEscalated } = req.body;
  await addComplaint(req.user.id, garageId, description, isEscalated);
  res.json({ message: "Complaint submitted" });
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await fetchCustomerComplaints(req.user.id);
  res.json(complaints);
});

export const getAllComplaints = asyncHandler(async (req, res) => {
  const complaints = await fetchAllComplaints();
  res.json(complaints);
});

export const getGarageComplaints = asyncHandler(async (req, res) => {
  const { garageId } = req.params;
  const complaints = await fetchGarageComplaints(garageId);
  res.json(complaints);
});

export const resolveComplaint = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { status } = req.body;
  await updateComplaintStatus(complaintId, status, req.user.id);
  res.json({ message: `Complaint status updated to ${status}` });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const { message } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  await addComplaintMessage(complaintId, req.user.id, message.trim());
  res.json({ message: "Message sent successfully" });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;
  const messages = await fetchComplaintMessages(complaintId);
  res.json(messages);
});