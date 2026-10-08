import express from "express";
import DeliveryPartnerZoneController from "./deliveryPartnerZone.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import validate from "../../middleware/validate.js";

const router = express.Router();
const staffOnly = requireRole(STAFF_ROLES);

router.post("/", authenticateToken, staffOnly, validate("createDeliveryPartnerZoneSchema"), DeliveryPartnerZoneController.createDeliveryPartnerZone);
router.get("/", DeliveryPartnerZoneController.getAllDeliveryPartnerZones);
router.get("/partner/:deliveryPartnerId", DeliveryPartnerZoneController.getZonesByPartner);
router.get("/:id", DeliveryPartnerZoneController.getDeliveryPartnerZoneById);
router.put("/:id", authenticateToken, staffOnly, validate("updateDeliveryPartnerZoneSchema"), DeliveryPartnerZoneController.updateDeliveryPartnerZone);
router.delete("/:id", authenticateToken, staffOnly, DeliveryPartnerZoneController.deleteDeliveryPartnerZone);

export default router;
