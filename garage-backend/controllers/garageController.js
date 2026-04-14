import { getAllGarages, addGarage, fetchGarageById, modifyGarage, removeGarage } from "../services/garageService.js";
import { getGarageManagerStats } from "../services/dashboardService.js";
import { assignUserToGarage } from "../services/userService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getGarages = asyncHandler(async (req, res) => {
  const { location } = req.query;
  const garages = await getAllGarages(location);
  res.json(garages);
});

export const createGarage = asyncHandler(async (req, res) => {
  const { name, location, contact, managerId, bankCode, bankAccountNumber, bankAccountName } = req.body;
  const garageId = await addGarage(name, location, contact, bankCode, bankAccountNumber, bankAccountName);
  
  if (managerId && req.user) {
    await assignUserToGarage(managerId, garageId, req.user);
  }
  
  res.json({ message: "Garage created", garageId });
});

export const getGarage = asyncHandler(async (req, res) => {
  const garage = await fetchGarageById(req.params.id);
  res.json(garage);
});

export const updateGarageDetails = asyncHandler(async (req, res) => {
  const { managerId } = req.body;
  await modifyGarage(req.params.id, req.body, req.user);
  
  if (managerId && req.user) {
    await assignUserToGarage(managerId, req.params.id, req.user);
  } else if (managerId === null && req.user && req.user.role === 'SuperAdmin') {
    // Unassign manager if null is explicitly passed
    const { unassignManagerFromGarage } = await import('../services/userService.js');
    await unassignManagerFromGarage(req.params.id);
  }
  
  res.json({ message: "Garage updated successfully" });
});

export const archiveGarage = asyncHandler(async (req, res) => {
  await removeGarage(req.params.id);
  res.json({ message: "Garage deleted successfully" });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getGarageManagerStats(req.params.id);
  res.json(stats);
});