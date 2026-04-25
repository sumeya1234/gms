import express from "express";
import { getGarages, createGarage, getGarage, updateGarageDetails, archiveGarage, getStats, getOwnerOverview, getRevenueTrend, getOperationalReport } from "../controllers/garageController.js";
import { getAvailability } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateGarage, validateGarageUpdate, validateGarageId } from "../validations/garageValidation.js";

const router = express.Router();

router.get("/", protect, getGarages);
router.get("/:id", protect, validate(validateGarageId, "params"), getGarage);
router.get("/:id/availability", protect, validate(validateGarageId, "params"), getAvailability);
router.get("/:id/stats", protect, authorize("GarageManager", "Accountant", "SuperAdmin"), validate(validateGarageId, "params"), getStats);
router.get("/:id/owner-overview", protect, authorize("GarageOwner", "SuperAdmin"), validate(validateGarageId, "params"), getOwnerOverview);
router.get("/:id/revenue-trend", protect, authorize("GarageOwner", "SuperAdmin"), validate(validateGarageId, "params"), getRevenueTrend);
router.get("/:id/reports", protect, authorize("GarageOwner", "SuperAdmin"), validate(validateGarageId, "params"), getOperationalReport);
router.post("/", protect, authorize("SuperAdmin"), validate(validateGarage), createGarage);
router.put("/:id", protect, authorize("SuperAdmin", "GarageManager"), validate(validateGarageId, "params"), validate(validateGarageUpdate, "body"), updateGarageDetails);
router.delete("/:id", protect, authorize("SuperAdmin"), validate(validateGarageId, "params"), archiveGarage);

export default router;