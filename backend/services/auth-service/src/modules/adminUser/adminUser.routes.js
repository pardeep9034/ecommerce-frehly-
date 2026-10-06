import express from "express";
import adminUserController from "./adminUser.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import requireRole from "../../middleware/requireRole.js";
import { ADMIN_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(...ADMIN_ROLES), adminUserController.listCustomers);
router.patch("/:id/status", authenticateToken, requireRole(...ADMIN_ROLES), adminUserController.setCustomerStatus);

export default router;
