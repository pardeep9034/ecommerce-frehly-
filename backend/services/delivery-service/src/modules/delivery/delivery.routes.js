import express from "express";
import DeliveryController from "./delivery.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import validate from "../../middleware/validate.js";

const router = express.Router();
const staffOnly = requireRole(STAFF_ROLES);

router.get("/", authenticateToken, staffOnly, DeliveryController.getAllDeliveries);
router.get("/:id", authenticateToken, staffOnly, DeliveryController.getDeliveryById);
router.post("/", authenticateToken, staffOnly, validate("createDeliverySchema"), DeliveryController.createDelivery);
router.put("/:id", authenticateToken, staffOnly, validate("updateDeliverySchema"), DeliveryController.updateDelivery);
router.delete("/:id", authenticateToken, staffOnly, DeliveryController.deleteDelivery);

export default router;
