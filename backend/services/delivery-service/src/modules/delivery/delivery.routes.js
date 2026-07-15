import express from "express";
import DeliveryController from "./delivery.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";

const router = express.Router();

router.get("/", DeliveryController.getAllDeliveries);
router.get("/:id", DeliveryController.getDeliveryById);
router.post("/", authenticateToken, validate("createDeliverySchema"), DeliveryController.createDelivery);
router.put("/:id", authenticateToken, validate("updateDeliverySchema"), DeliveryController.updateDelivery);
router.delete("/:id", authenticateToken, DeliveryController.deleteDelivery);

export default router;
