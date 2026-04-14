import express from "express";
import { createComplaint, getMyComplaints, resolveComplaint, getGarageComplaints, sendMessage, getMessages, getAllComplaints } from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateComplaint, validateComplaintStatus, validateComplaintId } from "../validations/complaintValidation.js";

const router = express.Router();

router.post("/", protect, authorize("Customer"), validate(validateComplaint), createComplaint);
router.get("/my-complaints", protect, authorize("Customer"), getMyComplaints);
router.get("/all", protect, authorize("SuperAdmin"), getAllComplaints);
router.get("/garage/:garageId", protect, authorize("SuperAdmin", "GarageManager"), getGarageComplaints);
router.put("/:complaintId/resolve", protect, authorize("SuperAdmin", "GarageManager"), validate(validateComplaintId, "params"), validate(validateComplaintStatus, "body"), resolveComplaint);

// Message routes
router.post("/:complaintId/messages", protect, validate(validateComplaintId, "params"), sendMessage);
router.get("/:complaintId/messages", protect, validate(validateComplaintId, "params"), getMessages);

export default router;