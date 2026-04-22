import express from "express";
import { getProfile, editProfile, editPassword, setUserRole, assignToGarage, getNotifications, registerToken, getAdminDashboard, getAdminAnalytics, getUsers, getManagers, createManager, createOwner, getGarageMechanics, createMechanic, updateMechanicStatus, readNotification, removeNotification, removeAllNotifications, getMechanicSkillsHandler, updateMechanicSkillsHandler, assignOwnerToGarageHandler } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateProfileUpdate, validatePasswordChange, validateRoleUpdate, validateGarageAssignment, validatePushToken, validateMechanicCreation, validateUserCreation, validateMechanicStatusUpdate } from "../validations/userValidation.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(validateProfileUpdate), editProfile);
router.put("/password", protect, validate(validatePasswordChange), editPassword);

router.get("/notifications", protect, getNotifications);
router.put("/notifications/:id/read", protect, readNotification);
router.delete("/notifications/:id", protect, removeNotification);
router.delete("/notifications", protect, removeAllNotifications);
router.post("/push-token", protect, validate(validatePushToken), registerToken);

router.get("/admin/dashboard", protect, authorize("SuperAdmin"), getAdminDashboard);
router.get("/admin/analytics", protect, authorize("SuperAdmin"), getAdminAnalytics);
router.get("/", protect, authorize("SuperAdmin"), getUsers);
router.get("/admin/managers", protect, authorize("SuperAdmin"), getManagers);
router.post("/admin/managers", protect, authorize("SuperAdmin"), validate(validateUserCreation), createManager);
router.post("/admin/owners", protect, authorize("SuperAdmin"), validate(validateUserCreation), createOwner);
router.put("/:userId/role", protect, authorize("SuperAdmin"), validate(validateRoleUpdate), setUserRole);
router.put("/:userId/garage", protect, authorize("SuperAdmin", "GarageManager"), validate(validateGarageAssignment), assignToGarage);

router.get("/garage/:garageId/mechanics", protect, authorize("GarageManager", "GarageOwner"), getGarageMechanics);
router.post("/garage/:garageId/mechanics", protect, authorize("GarageManager"), validate(validateMechanicCreation), createMechanic);
router.put("/garage/:garageId/mechanics/:mechanicId/status", protect, authorize("GarageManager"), validate(validateMechanicStatusUpdate), updateMechanicStatus);
router.get("/garage/:garageId/mechanics/:mechanicId/skills", protect, authorize("GarageManager", "GarageOwner"), getMechanicSkillsHandler);
router.put("/garage/:garageId/mechanics/:mechanicId/skills", protect, authorize("GarageManager"), updateMechanicSkillsHandler);

router.put("/admin/garages/:garageId/owner", protect, authorize("SuperAdmin"), assignOwnerToGarageHandler);

export default router;
