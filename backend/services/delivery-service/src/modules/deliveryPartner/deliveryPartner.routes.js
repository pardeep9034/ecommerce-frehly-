import express from "express";
import DeliveryPartnerController from "./deliveryPartner.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post("/", authenticateToken, validate("createDeliveryPartnerSchema"), DeliveryPartnerController.createDeliveryPartner);
router.get("/zone", DeliveryPartnerController.getAllDeliveryPartnersByZoneId);
router.get("/", DeliveryPartnerController.getAvalableDeliveryPartners);
router.get("/:id", DeliveryPartnerController.getDeliveryPartnerById);
router.patch("/:id", authenticateToken, validate("updateDeliveryPartnerSchema"), DeliveryPartnerController.updateDeliveryPartner);
router.patch("/:id/location", authenticateToken, validate("updateDeliveryPartnerLocationSchema"), DeliveryPartnerController.updateLocation);
router.patch("/:id/activate", authenticateToken, DeliveryPartnerController.activateDeliveryPartner);
router.patch("/:id/suspend", authenticateToken, DeliveryPartnerController.suspendDeliveryPartner);

export default router;
