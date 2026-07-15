import express from "express";
import HandleOrderController from"./handleOrder.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post( "/assignments/assign", authenticateToken, validate("assignOrderSchema"), HandleOrderController.assignOrder);
router.post("assignments/:assignmentId/re-aasign",authenticateToken,validate("reAssignOrderSchema"),HandleOrderController.reAssignOrder)
export default router;
