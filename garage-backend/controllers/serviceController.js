import { createServiceRequest, assignServiceMechanic, updateServiceStatus, completeServiceRequest, fetchCustomerRequests, fetchGarageRequests, fetchRequestById, updateAssignmentStatus } from "../services/serviceService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createService = asyncHandler(async (req, res) => {
  const { serviceType, vehicleId, garageId, description, isEmergency } = req.body;
  await createServiceRequest(serviceType, vehicleId, garageId, description, isEmergency);
  res.json({ message: "Service request created" });
});

export const assignMechanic = asyncHandler(async (req, res) => {
  const { requestId, mechanicId } = req.body;
  await assignServiceMechanic(requestId, mechanicId);
  res.json({ message: "Mechanic assigned successfully" });
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId, status, rejectionReason } = req.body;
  await updateServiceStatus(requestId, status, req.user, rejectionReason);
  res.json({ message: `Request updated to ${status}` });
});

export const updateStatusById = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, rejectionReason } = req.body;
  await updateServiceStatus(requestId, status, req.user, rejectionReason);
  res.json({ message: `Request status updated to ${status}` });
});

export const completeService = asyncHandler(async (req, res) => {
  const { requestId, itemsUsed } = req.body;
  await completeServiceRequest(requestId, itemsUsed);
  res.json({ message: "Service marked as completed" });
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { status } = req.body;
  await updateAssignmentStatus(assignmentId, status, req.user.id);
  res.json({ message: `Assignment status updated to ${status}` });
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await fetchCustomerRequests(req.user.id);
  res.json(requests);
});

export const getGarageRequests = asyncHandler(async (req, res) => {
  const { garageId } = req.params;
  const { status } = req.query;
  const requests = await fetchGarageRequests(garageId, status, req.user);
  res.json(requests);
});

export const getRequest = asyncHandler(async (req, res) => {
  const request = await fetchRequestById(req.params.requestId);
  res.json(request);
});
