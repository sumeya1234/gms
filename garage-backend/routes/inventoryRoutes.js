import express from "express";
import { addItem, getInventory, getItem, updateItem, deleteItem } from "../controllers/inventoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateInventoryItem, validateInventoryUpdate, validateInventoryId } from "../validations/inventoryValidation.js";

const router = express.Router();

router.post("/", protect, authorize("GarageManager"), validate(validateInventoryItem), addItem);
router.get("/:garageId", protect, getInventory);
router.get("/item/:itemId", protect, validate(validateInventoryId, "params"), getItem);
router.put("/:itemId", protect, authorize("GarageManager"), validate(validateInventoryId, "params"), validate(validateInventoryUpdate, "body"), updateItem);
router.delete("/:itemId", protect, authorize("GarageManager"), validate(validateInventoryId, "params"), deleteItem);

export default router;