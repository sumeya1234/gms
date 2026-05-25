import { createServiceItem, updateServiceItem, deleteServiceItem, fetchGarageServices } from "../services/catalogService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getCatalog = asyncHandler(async (req, res) => {
  const items = await fetchGarageServices(req.params.garageId);
  res.json(items);
});

export const addCatalogItem = asyncHandler(async (req, res) => {
  const { serviceName, price, garageId, isEmergency } = req.body;
  await createServiceItem(serviceName, price, garageId, isEmergency);
  res.status(201).json({ message: "Service added successfully" });
});

export const editCatalogItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { serviceName, price, isEmergency } = req.body;
  await updateServiceItem(id, serviceName, price, isEmergency);
  res.json({ message: "Service updated successfully" });
});

export const removeCatalogItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteServiceItem(id);
  res.json({ message: "Service deleted successfully" });
});
