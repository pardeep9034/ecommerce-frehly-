import express from "express";
import adminUserController from "./adminUser.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import requireRole from "../../middleware/requireRole.js";
import { ADMIN_ROLES } from "../../constants/roles.js";

const router = express.Router();

router.get("/", authenticateToken, requireRole(...ADMIN_ROLES), adminUserController.listCustomers);
// Customers (any admin) and staff accounts (super admins only, checked in the service).
router.patch("/:id/status", authenticateToken, requireRole(...ADMIN_ROLES), adminUserController.setStatus);

// Admin and ops-staff accounts: super admins only.
const superAdmin = [authenticateToken, requireRole("SUPER_ADMIN")];
router.get("/staff", ...superAdmin, adminUserController.listStaff); // above /:id
router.post("/", ...superAdmin, adminUserController.createStaff);
router.get("/:id", ...superAdmin, adminUserController.getStaff);
router.put("/:id", ...superAdmin, adminUserController.updateStaff);
router.post("/:id/reset-password", ...superAdmin, adminUserController.resetStaffPassword);
router.post("/:id/resend-invite", ...superAdmin, adminUserController.resendStaffInvite);

export default router;
