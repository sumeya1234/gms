import { createServiceItem, updateServiceItem, deleteServiceItem, fetchGarageServices } from "../services/catalogService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getCatalog = asyncHandler(async (req, res) => {
  const items = await fetchGarageServices(req.params.garageId);
  res.json(items);
});

export const addCatalogItem = asyncHandler(async (req, res) => {
  const { serviceName, price, garageId } = req.body;
  await createServiceItem(serviceName, price, garageId);
  res.status(201).json({ message: "Service added successfully" });
});

export const editCatalogItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { serviceName, price } = req.body;
  await updateServiceItem(id, serviceName, price);
  res.json({ message: "Service updated successfully" });
});

export const removeCatalogItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteServiceItem(id);
  res.json({ message: "Service deleted successfully" });
});
