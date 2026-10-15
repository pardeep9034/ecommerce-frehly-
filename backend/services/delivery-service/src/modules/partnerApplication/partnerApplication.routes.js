import express from "express";
import PartnerApplicationController from "./partnerApplication.controller.js";
import PartnerReviewController from "./partnerReview.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { ROLES, STAFF_ROLES } from "../../constants/roles.js";
import validate, { uuidParam } from "../../middleware/validate.js";
import uploadDocument from "../../middleware/upload.js";

const router = express.Router();
// Applicant routes: the caller's own application, found from the token. No active partner row is needed.
const applicantOnly = requireRole([ROLES.DELIVERY_PARTNER]);
const staffOnly = requireRole(STAFF_ROLES);
const deciderOnly = requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

router.post("/", authenticateToken, applicantOnly, validate("createPartnerApplicationSchema"), PartnerApplicationController.createApplication);
router.get("/me", authenticateToken, applicantOnly, PartnerApplicationController.getMine);
router.patch("/me", authenticateToken, applicantOnly, validate("updatePartnerApplicationSchema"), PartnerApplicationController.updateMine);
router.put("/me/documents/:type", authenticateToken, applicantOnly, uploadDocument, validate("partnerDocumentSchema"), PartnerApplicationController.putDocument);
router.delete("/me/documents/:type", authenticateToken, applicantOnly, PartnerApplicationController.deleteDocument);
router.post("/me/submit", authenticateToken, applicantOnly, validate("submitPartnerApplicationSchema"), PartnerApplicationController.submit);
router.post("/me/resubmit", authenticateToken, applicantOnly, PartnerApplicationController.resubmit);

// Staff routes. Order matters: /me* first so "me" is never read as an id, then the file link, the queue, then /:id*.
// Role before id, so a caller without the role learns nothing about which ids exist.
router.get("/files/:token", PartnerReviewController.streamFile); // signed token only, no bearer
router.get("/summary", authenticateToken, staffOnly, PartnerReviewController.summary); // above /:id, or uuidParam turns "summary" into a 404
router.get("/events", authenticateToken, deciderOnly, validate("partnerActivityQuerySchema", "query"), PartnerReviewController.activity); // Activity log: admins only, above /:id
router.get("/", authenticateToken, staffOnly, validate("partnerQueueQuerySchema", "query"), PartnerReviewController.list);
router.post("/on-behalf", authenticateToken, staffOnly, validate("createOnBehalfSchema"), PartnerReviewController.createOnBehalf);
router.get("/:id", authenticateToken, staffOnly, uuidParam(), PartnerReviewController.getDetail);
router.put("/:id/documents/:type", authenticateToken, staffOnly, uuidParam(), uploadDocument, validate("partnerDocumentSchema"), PartnerReviewController.uploadForDraft);
router.post("/:id/submit", authenticateToken, staffOnly, uuidParam(), validate("submitOnBehalfSchema"), PartnerReviewController.submitForDraft);
router.post("/:id/start-review", authenticateToken, staffOnly, uuidParam(), PartnerReviewController.startReview);
router.get("/:id/documents/:type/url", authenticateToken, staffOnly, uuidParam(), PartnerReviewController.documentUrl);
router.post("/:id/documents/:type/verify", authenticateToken, staffOnly, uuidParam(), validate("verifyPartnerDocumentSchema"), PartnerReviewController.verifyDocument);
router.post("/:id/documents/:type/request-reupload", authenticateToken, staffOnly, uuidParam(), validate("reuploadPartnerDocumentSchema"), PartnerReviewController.requestReupload);
router.put("/:id/checks/:key", authenticateToken, staffOnly, uuidParam(), validate("partnerCheckSchema"), PartnerReviewController.setCheck);
router.post("/:id/notes", authenticateToken, staffOnly, uuidParam(), validate("partnerNoteSchema"), PartnerReviewController.addNote);
router.post("/:id/request-changes", authenticateToken, staffOnly, uuidParam(), validate("requestPartnerChangesSchema"), PartnerReviewController.requestChanges);
// Approve and reject are for admins only (D4): the role is checked before the id or the body, so OPS_STAFF learns nothing.
router.post("/:id/reject", authenticateToken, deciderOnly, uuidParam(), validate("rejectPartnerApplicationSchema"), PartnerReviewController.reject);
router.post("/:id/approve", authenticateToken, deciderOnly, uuidParam(), validate("approvePartnerApplicationSchema"), PartnerReviewController.approve);

export default router;
