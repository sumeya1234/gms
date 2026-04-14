import express from "express";
import { getCatalog, addCatalogItem, editCatalogItem, removeCatalogItem } from "../controllers/catalogController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateCatalogItem, validateCatalogUpdate } from "../validations/catalogValidation.js";

const router = express.Router();

router.get("/:garageId", protect, getCatalog);
router.post("/", protect, authorize("GarageManager", "SuperAdmin"), validate(validateCatalogItem), addCatalogItem);
router.put("/:id", protect, authorize("GarageManager", "SuperAdmin"), validate(validateCatalogUpdate), editCatalogItem);
router.delete("/:id", protect, authorize("GarageManager", "SuperAdmin"), removeCatalogItem);

export default router;
