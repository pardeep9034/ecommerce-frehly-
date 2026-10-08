import express from "express";
import HandleOrderController from"./handleOrder.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import validate from "../../middleware/validate.js";

const router = express.Router();
const requireDispatchRole = requireRole(STAFF_ROLES);

router.post( "/assignments/assign", authenticateToken, requireDispatchRole, validate("assignOrderSchema"), HandleOrderController.assignOrder);
router.post("/assignments/:assignmentId/re-aasign",authenticateToken,requireDispatchRole,validate("reAssignOrderSchema"),HandleOrderController.reAssignOrder)
router.post("/assignments/:assignmentId/handover",authenticateToken,requireDispatchRole,HandleOrderController.handOver)
// ponytail: staff-only until delivery_partners.user_id is BIGINT (P0.2); then requireActivePartner replaces this on both confirm routes.
router.post("/partner/handover/:id/confirm-handover",authenticateToken,requireDispatchRole,HandleOrderController.confirmHandover )
router.post("/partner/handover/:id/confirm-receipt",authenticateToken,requireDispatchRole,HandleOrderController.confirmReciept)
router.post("/assignments/:assignmentId/update-status",authenticateToken,requireDispatchRole,HandleOrderController.updateStatus)
export default router;
