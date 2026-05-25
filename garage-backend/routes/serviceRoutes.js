import express from "express";
import {
    createService, createWalkIn, assignMechanic, updateRequestStatus, updateStatusById,
    completeService, updateAssignment, addAssignmentItems, getMyRequests,
    getGarageRequests, getFilteredBookings, getRequest, getAvailability,
    getMyAssignments, getRequestItems, hideRequest, cancelRequest,
    updateBooking, checkPlate, dismissReview, dismissAllReviews, setAssignmentEta
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateServiceRequest, validateWalkInRequest, validateUpdateBooking, validateAssignMechanic, validateUpdateStatus, validateCompleteService, validateGarageId, validateRequestId, validateAssignmentId, validateAssignmentStatus, validateDocumentItems, validateEta } from "../validations/serviceValidation.js";

const router = express.Router();

router.post("/", protect, authorize("Customer"), validate(validateServiceRequest), createService);
router.post("/walk-in", protect, authorize("GarageManager", "SuperAdmin"), validate(validateWalkInRequest), createWalkIn);
router.get("/check-plate/:plateNumber", protect, authorize("GarageManager", "SuperAdmin"), checkPlate);
router.patch("/:requestId", protect, authorize("GarageManager", "SuperAdmin", "Customer"), validate(validateRequestId, "params"), validate(validateUpdateBooking), updateBooking);
router.put("/:requestId/status", protect, authorize("GarageManager", "Customer"), validate(validateRequestId, "params"), validate(validateUpdateStatus, "body"), updateStatusById);
router.post("/assign", protect, authorize("GarageManager"), validate(validateAssignMechanic), assignMechanic);
router.put("/status", protect, authorize("GarageManager"), validate(validateUpdateStatus), updateRequestStatus);
router.put("/complete", protect, authorize("GarageManager"), validate(validateCompleteService), completeService);
router.put("/assignments/:assignmentId/status", protect, authorize("Mechanic"), validate(validateAssignmentId, "params"), validate(validateAssignmentStatus, "body"), updateAssignment);
router.put("/assignments/:assignmentId/eta", protect, authorize("Mechanic"), validate(validateAssignmentId, "params"), validate(validateEta, "body"), setAssignmentEta);
router.post("/assignments/:assignmentId/items", protect, authorize("Mechanic"), validate(validateAssignmentId, "params"), validate(validateDocumentItems, "body"), addAssignmentItems);

router.get("/my-assignments", protect, authorize("Mechanic"), getMyAssignments);
router.get("/my-requests", protect, authorize("Customer"), getMyRequests);
router.post("/my-requests/skip-all-reviews", protect, authorize("Customer"), dismissAllReviews);
router.get("/bookings", protect, authorize("GarageManager", "GarageOwner", "Accountant", "SuperAdmin"), getFilteredBookings);

router.post("/:requestId/cancel", protect, authorize("Customer"), validate(validateRequestId, "params"), cancelRequest);
router.post("/:requestId/skip-review", protect, authorize("Customer"), validate(validateRequestId, "params"), dismissReview);
router.delete("/my-requests/:requestId", protect, authorize("Customer"), hideRequest);
router.get("/garage/:garageId", protect, authorize("GarageManager"), validate(validateGarageId, "params"), getGarageRequests);
router.get("/:requestId", protect, validate(validateRequestId, "params"), getRequest);
router.get("/:requestId/items", protect, validate(validateRequestId, "params"), getRequestItems);

export default router;