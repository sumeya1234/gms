import { addComplaint, updateComplaintStatus, fetchCustomerComplaints, fetchGarageComplaints } from "../services/complaintService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createComplaint = asyncHandler(async (req, res) => {
  const { garageId, description } = req.body;
  await addComplaint(req.user.id, garageId, description);
  res.json({ message: "Complaint submitted" });
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await fetchCustomerComplaints(req.user.id);
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