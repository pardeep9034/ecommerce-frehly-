import express from "express";
import DeliverySlotController from "./deliverySlot.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";
import validate, { uuidParam } from "../../middleware/validate.js";

const router = express.Router();
// Slots are shared by every store, so admins manage them, not store staff.
const adminOnly = requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

router.get("/", DeliverySlotController.getActiveDeliverySlots);
router.get("/all", authenticateToken, adminOnly, DeliverySlotController.getAllDeliverySlots);
router.post("/", authenticateToken, adminOnly, validate("createDeliverySlotSchema"), DeliverySlotController.createDeliverySlot);
router.patch("/:id", authenticateToken, adminOnly, uuidParam(), validate("updateDeliverySlotSchema"), DeliverySlotController.updateDeliverySlot);

export default router;
