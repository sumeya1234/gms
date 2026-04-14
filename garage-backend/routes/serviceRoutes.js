import express from "express";
import { assignMechanic, createService, updateRequestStatus, completeService, getMyRequests, getGarageRequests, getRequest, updateAssignment, updateStatusById, getMyAssignments, addAssignmentItems, getRequestItems, hideRequest } from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateServiceRequest, validateAssignMechanic, validateUpdateStatus, validateCompleteService, validateGarageId, validateRequestId, validateAssignmentId, validateAssignmentStatus, validateDocumentItems } from "../validations/serviceValidation.js";

const router = express.Router();

router.post("/", protect, authorize("Customer"), validate(validateServiceRequest), createService);
router.put("/:requestId/status", protect, authorize("GarageManager"), validate(validateRequestId, "params"), validate(validateUpdateStatus, "body"), updateStatusById);
router.post("/assign", protect, authorize("GarageManager"), validate(validateAssignMechanic), assignMechanic);
router.put("/status", protect, authorize("GarageManager"), validate(validateUpdateStatus), updateRequestStatus);
router.put("/complete", protect, authorize("GarageManager"), validate(validateCompleteService), completeService);
router.put("/assignments/:assignmentId/status", protect, authorize("Mechanic"), validate(validateAssignmentId, "params"), validate(validateAssignmentStatus, "body"), updateAssignment);
router.post("/assignments/:assignmentId/items", protect, authorize("Mechanic"), validate(validateAssignmentId, "params"), validate(validateDocumentItems, "body"), addAssignmentItems);

router.get("/my-assignments", protect, authorize("Mechanic"), getMyAssignments);
router.get("/my-requests", protect, authorize("Customer"), getMyRequests);
router.delete("/my-requests/:requestId", protect, authorize("Customer"), hideRequest);
router.get("/garage/:garageId", protect, authorize("GarageManager"), validate(validateGarageId, "params"), getGarageRequests);
router.get("/:requestId", protect, validate(validateRequestId, "params"), getRequest);
router.get("/:requestId/items", protect, validate(validateRequestId, "params"), getRequestItems);

export default router;