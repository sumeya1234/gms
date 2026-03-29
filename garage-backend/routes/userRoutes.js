import express from "express";
import { getProfile, editProfile, editPassword, setUserRole, assignToGarage, getNotifications, registerToken, getAdminDashboard } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateProfileUpdate, validatePasswordChange, validateRoleUpdate, validateGarageAssignment, validatePushToken } from "../validations/userValidation.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(validateProfileUpdate), editProfile);
router.put("/password", protect, validate(validatePasswordChange), editPassword);

router.get("/notifications", protect, getNotifications);
router.post("/push-token", protect, validate(validatePushToken), registerToken);

router.get("/admin/dashboard", protect, authorize("SuperAdmin"), getAdminDashboard);
router.put("/:userId/role", protect, authorize("SuperAdmin"), validate(validateRoleUpdate), setUserRole);
router.put("/:userId/garage", protect, authorize("SuperAdmin", "GarageManager"), validate(validateGarageAssignment), assignToGarage);

export default router;
