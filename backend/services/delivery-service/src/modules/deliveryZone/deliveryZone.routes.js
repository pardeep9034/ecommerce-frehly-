import express from "express";
import DeliveryZoneController from "./deliveryZone.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

router.post("/", authenticateToken, validate("createDeliveryZoneSchema"), DeliveryZoneController.createDeliveryZone);
router.get("/", DeliveryZoneController.getAllDeliveryZones);
router.get("/:id", DeliveryZoneController.getDeliveryZoneById);
router.get("/warehouse", DeliveryZoneController.getDeliveryZonesByWarehouse);
router.put("/:id", authenticateToken, validate("updateDeliveryZoneSchema"), DeliveryZoneController.updateDeliveryZone);
router.delete("/:id", authenticateToken, DeliveryZoneController.deleteDeliveryZone);

export default router;
