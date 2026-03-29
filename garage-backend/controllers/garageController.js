import { getAllGarages, addGarage, fetchGarageById, modifyGarage, removeGarage } from "../services/garageService.js";
import { getGarageManagerStats } from "../services/dashboardService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getGarages = asyncHandler(async (req, res) => {
  const { location } = req.query;
  const garages = await getAllGarages(location);
  res.json(garages);
});

export const createGarage = asyncHandler(async (req, res) => {
  const { name, location, contact } = req.body;
  await addGarage(name, location, contact);
  res.json({ message: "Garage created" });
});

export const getGarage = asyncHandler(async (req, res) => {
  const garage = await fetchGarageById(req.params.id);
  res.json(garage);
});

export const updateGarageDetails = asyncHandler(async (req, res) => {
  await modifyGarage(req.params.id, req.body);
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