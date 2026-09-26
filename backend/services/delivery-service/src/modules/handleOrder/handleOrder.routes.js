import express from "express";
import HandleOrderController from"./handleOrder.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();
const requireDispatchRole = requireRole(["ADMIN", "SUPER_ADMIN", "OPS_STAFF"]);

router.post( "/assignments/assign", authenticateToken, requireDispatchRole, validate("assignOrderSchema"), HandleOrderController.assignOrder);
router.post("/assignments/:assignmentId/re-aasign",authenticateToken,requireDispatchRole,validate("reAssignOrderSchema"),HandleOrderController.reAssignOrder)
router.post("/assignments/:assignmentId/handover",authenticateToken,requireDispatchRole,HandleOrderController.handOver)
router.post("/partner/handover/:id/confirm-handover",authenticateToken,HandleOrderController.confirmHandover )
router.post("/partner/handover/:id/confirm-receipt",authenticateToken,HandleOrderController.confirmReciept)
router.post("/assignments/:assignmentId/update-status",authenticateToken,requireDispatchRole,HandleOrderController.updateStatus)
export default router;
