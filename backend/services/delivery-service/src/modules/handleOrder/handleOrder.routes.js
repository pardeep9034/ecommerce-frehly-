import express from "express";
import HandleOrderController from"./handleOrder.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post( "/assignments/assign", authenticateToken, validate("assignOrderSchema"), HandleOrderController.assignOrder);
router.post("/assignments/:assignmentId/re-aasign",authenticateToken,validate("reAssignOrderSchema"),HandleOrderController.reAssignOrder)
router.post("/assignments/:assignmentId/handover",authenticateToken,HandleOrderController.handOver)
router.post("/partner/handover/:id/confirm-handover",authenticateToken,HandleOrderController.confirmHandover )
router.post("/partner/handover/:id/confirm-receipt",authenticateToken,HandleOrderController.confirmReciept)
router.post("/assignments/:assignmentId/update-status",authenticateToken,HandleOrderController.updateStatus)
export default router;
