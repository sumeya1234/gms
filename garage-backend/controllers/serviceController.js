import { createServiceRequest, createWalkInRequest, updateServiceRequest, findVehicleByPlate, fetchCustomerRequests, fetchGarageRequests, fetchFilteredBookings, fetchRequestById, fetchGarageAvailability, hideCustomerRequest, cancelServiceRequest, skipReviewRequest, skipAllReviews, fetchVehicleHistory } from "../services/bookingService.js";
import { assignServiceMechanic, updateServiceStatus, completeServiceRequest, updateAssignmentStatus, documentAssignmentItems, fetchRequestItems, setEstimatedCompletionTime } from "../services/jobService.js";
import { fetchMechanicAssignments } from "../services/mechanicService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createService = asyncHandler(async (req, res) => {
  await createServiceRequest(req.body);
  res.json({ message: "Service request created" });
});

export const createWalkIn = asyncHandler(async (req, res) => {
  const { garageId, phone, plateNumber, model, type, serviceType, description, isEmergency, latitude, longitude, address, fullName } = req.body;
  const requestId = await createWalkInRequest(garageId, { phone, plateNumber, model, type, serviceType, description, isEmergency, latitude, longitude, address, fullName });
  res.status(201).json({ message: "Walk-in service request created", requestId });
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
export const dismissReview = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  await skipReviewRequest(requestId);
  res.json({ message: "Review request dismissed" });
});
export const dismissAllReviews = asyncHandler(async (req, res) => {
  await skipAllReviews(req.user.id);
  res.json({ message: "All reviews dismissed" });
});
export const updateBooking = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { serviceType, description, plateNumber, model, type } = req.body;
  await updateServiceRequest(requestId, { serviceType, description, plateNumber, model, type, garageId: req.user.GarageID, user: req.user });
  res.json({ message: "Booking updated successfully" });
});

export const checkPlate = asyncHandler(async (req, res) => {
  const vehicle = await findVehicleByPlate(req.params.plateNumber);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }
  res.json(vehicle);
});

export const setAssignmentEta = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { estimatedMinutes } = req.body;
  const result = await setEstimatedCompletionTime(assignmentId, estimatedMinutes, req.user.id);
  res.json({ message: `ETA set to ${result.timeStr} (~${estimatedMinutes} min)`, ...result });
});

export const getVehicleHistory = asyncHandler(async (req, res) => {
  const { vehicleId, id } = req.params;
  // If 'id' is present in params (from /garages/:id/vehicles/...), use it as the garageId filter
  const garageIdFilter = id || req.query.garageId;
  const history = await fetchVehicleHistory(vehicleId, garageIdFilter);
  res.json(history);
});
