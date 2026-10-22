import express from "express";
import PartnerMeController from "./partnerMe.controller.js";
import { authenticateToken, requireActivePartner } from "../../middleware/auth.js";
import validate, { uuidParam } from "../../middleware/validate.js";

const router = express.Router();

// The delivery partner's own data. Mounted at /delivery-partners/me, before the /:id router.
router.use(authenticateToken, requireActivePartner);

router.get("/", PartnerMeController.getMe);
router.patch("/online", validate("partnerOnlineSchema"), PartnerMeController.setOnlineStatus);
router.get("/assignments", validate("partnerAssignmentsQuerySchema", "query"), PartnerMeController.listAssignments);
router.get("/assignments/:id", uuidParam(), PartnerMeController.getAssignment);
router.patch("/assignments/:id/status", uuidParam(), validate("partnerAssignmentStatusSchema"), PartnerMeController.updateAssignmentStatus);
// The Handover screen. Starting, confirming and declining live in handleOrder (/handle-orders), shared with staff.
router.get("/handovers", validate("partnerHandoversQuerySchema", "query"), PartnerMeController.listHandovers);
router.get("/handovers/candidates", validate("handoverCandidatesQuerySchema", "query"), PartnerMeController.handoverCandidates);

export default router;
