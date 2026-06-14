import express from "express";
import DeliveryController from "./delivery.controller.js";

const router = express.Router();

router.get("/", DeliveryController.getAllDeliveries);
router.get("/:id", DeliveryController.getDeliveryById);
router.post("/", DeliveryController.createDelivery);
router.put("/:id", DeliveryController.updateDelivery);
router.delete("/:id", DeliveryController.deleteDelivery);

export default router;
