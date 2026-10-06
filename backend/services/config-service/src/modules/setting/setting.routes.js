import express from "express";
import settingController from "./setting.controller.js";
import validateGroup from "../../middleware/validate.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { ADMIN_ROLES } from "../../utils/roles.js";

const router = express.Router();

router.use(authenticateToken, requireRole(...ADMIN_ROLES));

router.get("/", settingController.getAll);
router.patch("/:group", validateGroup, settingController.updateGroup);

export default router;
