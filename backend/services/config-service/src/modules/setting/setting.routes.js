import express from "express";
import settingController from "./setting.controller.js";
import validateGroup from "../../middleware/validate.js";
import { authenticateToken, requireInternalKey, requireRole } from "../../middleware/auth.js";
import { ADMIN_ROLES } from "../../utils/roles.js";

const router = express.Router();

// order-service reads the saved rules with the shared key, no user token. Above router.use so the admin check skips it.
router.get("/internal/:group", requireInternalKey, settingController.getGroup);

router.use(authenticateToken, requireRole(...ADMIN_ROLES));

router.get("/", settingController.getAll);
router.patch("/:group", validateGroup, settingController.updateGroup);

export default router;
