import express from "express";
import DeliveryPartnerZoneController from "./deliveryPartnerZone.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post("/", authenticateToken, validate("createDeliveryPartnerZoneSchema"), DeliveryPartnerZoneController.createDeliveryPartnerZone);
router.get("/", DeliveryPartnerZoneController.getAllDeliveryPartnerZones);
router.get("/partner/:deliveryPartnerId", DeliveryPartnerZoneController.getZonesByPartner);
router.get("/:id", DeliveryPartnerZoneController.getDeliveryPartnerZoneById);
router.put("/:id", authenticateToken, validate("updateDeliveryPartnerZoneSchema"), DeliveryPartnerZoneController.updateDeliveryPartnerZone);
router.delete("/:id", authenticateToken, DeliveryPartnerZoneController.deleteDeliveryPartnerZone);

export default router;
