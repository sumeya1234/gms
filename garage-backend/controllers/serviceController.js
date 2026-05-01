import { createServiceRequest, fetchCustomerRequests, fetchGarageRequests, fetchFilteredBookings, fetchRequestById, fetchGarageAvailability, hideCustomerRequest, cancelServiceRequest } from "../services/bookingService.js";
import { assignServiceMechanic, updateServiceStatus, completeServiceRequest, updateAssignmentStatus, documentAssignmentItems, fetchRequestItems } from "../services/jobService.js";
import { fetchMechanicAssignments } from "../services/mechanicService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createService = asyncHandler(async (req, res) => {
  const { serviceType, vehicleId, garageId, description, isEmergency, bookingDate, dropOffTime, customerStatus } = req.body;
  await createServiceRequest(serviceType, vehicleId, garageId, description, isEmergency, bookingDate, dropOffTime, customerStatus);
  res.json({ message: "Service request created" });
});

export const assignMechanic = asyncHandler(async (req, res) => {
  const { requestId, mechanicId } = req.body;
  await assignServiceMechanic(requestId, mechanicId);
  res.json({ message: "Mechanic assigned successfully" });
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId, status, rejectionReason, estimatedPrice, depositPercentage } = req.body;
  await updateServiceStatus(requestId, status, req.user, rejectionReason, estimatedPrice, depositPercentage);
  res.json({ message: `Request updated to ${status}` });
});

export const updateStatusById = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, rejectionReason, estimatedPrice, depositPercentage } = req.body;
  await updateServiceStatus(requestId, status, req.user, rejectionReason, estimatedPrice, depositPercentage);
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

export const addAssignmentItems = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { itemsUsed } = req.body;
  await documentAssignmentItems(assignmentId, itemsUsed, req.user.id);
  res.json({ message: "Items documented successfully" });
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await fetchCustomerRequests(req.user.id);
  res.json(requests);
});

export const getGarageRequests = asyncHandler(async (req, res) => {
  const { garageId } = req.params;
  const result = await fetchGarageRequests(garageId, req.query, req.user);
  res.json(result);
});

export const getFilteredBookings = asyncHandler(async (req, res) => {
  const result = await fetchFilteredBookings(req.query, req.user);
  res.json(result);
});

export const getRequest = asyncHandler(async (req, res) => {
  const request = await fetchRequestById(req.params.requestId);
  res.json(request);
});

export const getAvailability = asyncHandler(async (req, res) => {
  const garageId = req.params.garageId ?? req.params.id;
  const { date } = req.query; 

  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  const availability = await fetchGarageAvailability(garageId, date);
  res.json(availability);
});

export const getMyAssignments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const assignments = await fetchMechanicAssignments(req.user.id, status);
  res.json(assignments);
});

export const getRequestItems = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const items = await fetchRequestItems(requestId);
  res.json(items);
});

export const hideRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  await hideCustomerRequest(requestId, req.user.id);
  res.json({ message: "Request hidden from history" });
});
export const cancelRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  await cancelServiceRequest(requestId, req.user.id);
  res.json({ message: "Service request cancelled successfully" });
});
