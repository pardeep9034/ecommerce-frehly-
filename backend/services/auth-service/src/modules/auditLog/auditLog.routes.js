import express from "express";
import auditLogController from "./auditLog.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import requireRole from "../../middleware/requireRole.js";
import { ADMIN_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(...ADMIN_ROLES), auditLogController.list);

export default router;
