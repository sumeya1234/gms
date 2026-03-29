import express from "express";
import { addVehicle, getMyVehicles, getVehicle, updateVehicleDetails, deleteMyVehicle } from "../controllers/vehicleController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateVehicle, validateVehicleUpdate, validateVehicleId } from "../validations/vehicleValidation.js";

const router = express.Router();

router.post("/", protect, authorize("Customer"), validate(validateVehicle), addVehicle);
router.get("/", protect, authorize("Customer"), getMyVehicles);
router.get("/:id", protect, authorize("Customer"), validate(validateVehicleId, "params"), getVehicle);
router.put("/:id", protect, authorize("Customer"), validate(validateVehicleId, "params"), validate(validateVehicleUpdate, "body"), updateVehicleDetails);
router.delete("/:id", protect, authorize("Customer"), validate(validateVehicleId, "params"), deleteMyVehicle);

export default router;