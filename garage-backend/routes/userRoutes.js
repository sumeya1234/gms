import express from "express";
import { getProfile, editProfile, editPassword, setUserRole, assignToGarage, getNotifications, registerToken, getAdminDashboard, getUsers, getGarageMechanics, createMechanic, updateMechanicStatus, readNotification } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateProfileUpdate, validatePasswordChange, validateRoleUpdate, validateGarageAssignment, validatePushToken, validateMechanicCreation, validateMechanicStatusUpdate } from "../validations/userValidation.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(validateProfileUpdate), editProfile);
router.put("/password", protect, validate(validatePasswordChange), editPassword);

router.get("/notifications", protect, getNotifications);
router.put("/notifications/:id/read", protect, readNotification);
router.post("/push-token", protect, validate(validatePushToken), registerToken);

router.get("/admin/dashboard", protect, authorize("SuperAdmin"), getAdminDashboard);
router.get("/", protect, authorize("SuperAdmin"), getUsers);
router.put("/:userId/role", protect, authorize("SuperAdmin"), validate(validateRoleUpdate), setUserRole);
router.put("/:userId/garage", protect, authorize("SuperAdmin", "GarageManager"), validate(validateGarageAssignment), assignToGarage);

router.get("/garage/:garageId/mechanics", protect, authorize("GarageManager"), getGarageMechanics);
router.post("/garage/:garageId/mechanics", protect, authorize("GarageManager"), validate(validateMechanicCreation), createMechanic);
router.put("/garage/:garageId/mechanics/:mechanicId/status", protect, authorize("GarageManager"), validate(validateMechanicStatusUpdate), updateMechanicStatus);

export default router;
