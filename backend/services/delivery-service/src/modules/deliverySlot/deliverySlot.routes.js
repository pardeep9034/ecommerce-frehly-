import express from "express";
import DeliverySlotController from "./deliverySlot.controller.js";

const router = express.Router();

router.get("/", DeliverySlotController.getActiveDeliverySlots);

export default router;
