import { getAllGarages, addGarage, fetchGarageById, modifyGarage, removeGarage } from "../services/garageService.js";
import { getGarageManagerStats, getGarageOwnerOverview, getGarageRevenueByPeriod, generateGarageOperationalReport } from "../services/dashboardService.js";
import { assignUserToGarage } from "../services/userService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getGarages = asyncHandler(async (req, res) => {
  const { location } = req.query;
  const garages = await getAllGarages(location);
  res.json(garages);
});

export const createGarage = asyncHandler(async (req, res) => {
  const { name, location, contact, managerId, ownerId, bankCode, bankAccountNumber, bankAccountName, timezone, workingHours } = req.body;
  console.log(`[createGarage] Payload:`, req.body);

  try {
    const garageId = await addGarage(name, location, contact, bankCode, bankAccountNumber, bankAccountName, timezone, workingHours);
    console.log(`[createGarage] Garage created with ID: ${garageId}`);

    if (managerId && req.user) {
      console.log(`[createGarage] Assigning manager ${managerId} to garage ${garageId}`);
      await assignUserToGarage(managerId, garageId, req.user);
    }
    if (ownerId && req.user) {
      console.log(`[createGarage] Assigning owner ${ownerId} to garage ${garageId}`);
      await assignUserToGarage(ownerId, garageId, req.user);
    }

    res.status(201).json({ message: "Garage created", garageId });
  } catch (error) {
    console.error(`[createGarage] Error:`, error);
    res.status(error.status || 500).json({ message: error.message || "Failed to create garage" });
  }
});

export const getGarage = asyncHandler(async (req, res) => {
  const garage = await fetchGarageById(req.params.id);
  res.json(garage);
});

export const updateGarageDetails = asyncHandler(async (req, res) => {
  const { managerId, ownerId } = req.body;
  console.log(`[updateGarageDetails] ID: ${req.params.id}, Payload:`, req.body);

  try {
    await modifyGarage(req.params.id, req.body, req.user);
    console.log(`[updateGarageDetails] modifyGarage success for ID ${req.params.id}`);

    if (managerId && req.user) {
      console.log(`[updateGarageDetails] Assigning/Updating manager ${managerId} for garage ${req.params.id}`);
      await assignUserToGarage(managerId, req.params.id, req.user);
    } else if (managerId === null && req.user && req.user.role === 'SuperAdmin') {
      // Unassign manager if null is explicitly passed
      const { unassignManagerFromGarage } = await import('../services/userService.js');
      console.log(`[updateGarageDetails] Unassigning manager from garage ${req.params.id}`);
      await unassignManagerFromGarage(req.params.id);
    }

    if (ownerId && req.user) {
      console.log(`[updateGarageDetails] Assigning owner ${ownerId} to garage ${req.params.id}`);
      await assignUserToGarage(ownerId, req.params.id, req.user);
    }

    res.json({ message: "Garage updated successfully" });
  } catch (error) {
    console.error(`[updateGarageDetails] Error:`, error);
    res.status(error.status || 500).json({ message: error.message || "Failed to update garage" });
  }
});

export const archiveGarage = asyncHandler(async (req, res) => {
  await removeGarage(req.params.id);
  res.json({ message: "Garage deleted successfully" });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getGarageManagerStats(req.params.id, req.user);
  res.json(stats);
});

export const getOwnerOverview = asyncHandler(async (req, res) => {
  const overview = await getGarageOwnerOverview(req.params.id);
  res.json(overview);
});

export const getRevenueTrend = asyncHandler(async (req, res) => {
  const { period = "daily" } = req.query;
  const data = await getGarageRevenueByPeriod(req.params.id, period);
  res.json({ period, data });
});

export const getOperationalReport = asyncHandler(async (req, res) => {
  const { period = "monthly" } = req.query;
  const report = await generateGarageOperationalReport(req.params.id, period);
  res.json(report);
});