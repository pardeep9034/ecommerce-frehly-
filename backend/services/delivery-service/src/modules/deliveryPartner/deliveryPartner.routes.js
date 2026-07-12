import express from "express";
import DeliveryPartnerController from "./deliveryPartner.controller.js";

const router = express.Router();

router.post("/", DeliveryPartnerController.createDeliveryPartner);
router.get("/", DeliveryPartnerController.getAllDeliveryPartners);
router.get("/:id", DeliveryPartnerController.getDeliveryPartnerById);
router.patch("/:id", DeliveryPartnerController.updateDeliveryPartner);
router.patch("/:id/location", DeliveryPartnerController.updateLocation);
router.patch("/:id/activate", DeliveryPartnerController.activateDeliveryPartner);
router.patch("/:id/suspend", DeliveryPartnerController.suspendDeliveryPartner);

export default router;
