import express from "express";
import { getGarages, createGarage, getGarage, updateGarageDetails, archiveGarage, getStats } from "../controllers/garageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateGarage, validateGarageUpdate, validateGarageId } from "../validations/garageValidation.js";

const router = express.Router();

router.get("/", protect, getGarages);
router.get("/:id", protect, validate(validateGarageId, "params"), getGarage);
router.get("/:id/stats", protect, authorize("GarageManager", "SuperAdmin"), validate(validateGarageId, "params"), getStats);
router.post("/", protect, authorize("SuperAdmin"), validate(validateGarage), createGarage);
router.put("/:id", protect, authorize("SuperAdmin", "GarageManager"), validate(validateGarageId, "params"), validate(validateGarageUpdate, "body"), updateGarageDetails);
router.delete("/:id", protect, authorize("SuperAdmin"), validate(validateGarageId, "params"), archiveGarage);

export default router;