import express from "express";
import DeliveryPartnerController from "./deliveryPartner.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { STAFF_ROLES,ROLES } from "../../constants/roles.js";
import validate from "../../middleware/validate.js";

const router = express.Router();
const staffOnly = requireRole(STAFF_ROLES);

router.post("/", authenticateToken, requireRole([ROLES.SUPER_ADMIN]), validate("createDeliveryPartnerSchema"), DeliveryPartnerController.createDeliveryPartner);
router.get("/zone", DeliveryPartnerController.getAllDeliveryPartnersByZoneId);
router.get("/", DeliveryPartnerController.getAvalableDeliveryPartners);
// Dashboard staff only. Must stay above /:id.
router.get("/list", authenticateToken, staffOnly, DeliveryPartnerController.listPartners);
router.get("/:id", DeliveryPartnerController.getDeliveryPartnerById);
router.patch("/:id", authenticateToken, staffOnly, validate("updateDeliveryPartnerSchema"), DeliveryPartnerController.updateDeliveryPartner);
router.patch("/:id/location", authenticateToken, staffOnly, validate("updateDeliveryPartnerLocationSchema"), DeliveryPartnerController.updateLocation);
router.patch("/:id/activate", authenticateToken, staffOnly, DeliveryPartnerController.activateDeliveryPartner);
router.patch("/:id/suspend", authenticateToken, staffOnly, DeliveryPartnerController.suspendDeliveryPartner);

export default router;
