import { createInventoryItem, fetchInventory, fetchInventoryItemById, modifyInventoryItem, removeInventoryItem } from "../services/inventoryService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addItem = asyncHandler(async (req, res) => {
  const { itemName, quantity, unitPrice, garageId, supplierName, supplierContact, supplierEmail } = req.body;
  await createInventoryItem(itemName, quantity, unitPrice, garageId, req.user, supplierName, supplierContact, supplierEmail);
  res.json({ message: "Item added" });
});

export const getInventory = asyncHandler(async (req, res) => {
  const inventory = await fetchInventory(req.params.garageId);
  res.json(inventory);
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await fetchInventoryItemById(req.params.itemId);
  res.json(item);
});

export const updateItem = asyncHandler(async (req, res) => {
  await modifyInventoryItem(req.params.itemId, req.body, req.user);
  res.json({ message: "Item updated successfully" });
});

export const deleteItem = asyncHandler(async (req, res) => {
  await removeInventoryItem(req.params.itemId, req.user);
  res.json({ message: "Item deleted successfully" });
});