import express from "express";
import { createComplaint, getMyComplaints, resolveComplaint, getGarageComplaints } from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";
import { validateComplaint, validateComplaintStatus, validateComplaintId } from "../validations/complaintValidation.js";

const router = express.Router();

router.post("/", protect, authorize("Customer"), validate(validateComplaint), createComplaint);
router.get("/my-complaints", protect, authorize("Customer"), getMyComplaints);
router.get("/garage/:garageId", protect, authorize("SuperAdmin", "GarageManager"), getGarageComplaints);
router.put("/:complaintId/resolve", protect, authorize("SuperAdmin", "GarageManager"), validate(validateComplaintId, "params"), validate(validateComplaintStatus, "body"), resolveComplaint);

export default router;