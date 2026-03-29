import { createVehicle, fetchMyVehicles, fetchVehicleById, modifyVehicle, removeVehicle } from "../services/vehicleService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addVehicle = asyncHandler(async (req, res) => {
  const { plateNumber, type, model } = req.body;
  await createVehicle(plateNumber, type, model, req.user.id);
  res.json({ message: "Vehicle added" });
});

export const getMyVehicles = asyncHandler(async (req, res) => {
  const vehicles = await fetchMyVehicles(req.user.id);
  res.json(vehicles);
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await fetchVehicleById(req.params.id, req.user.id);
  res.json(vehicle);
});

export const updateVehicleDetails = asyncHandler(async (req, res) => {
  await modifyVehicle(req.params.id, req.user.id, req.body);
  res.json({ message: "Vehicle updated successfully" });
});

export const deleteMyVehicle = asyncHandler(async (req, res) => {
  await removeVehicle(req.params.id, req.user.id);
  res.json({ message: "Vehicle deleted successfully" });
});
