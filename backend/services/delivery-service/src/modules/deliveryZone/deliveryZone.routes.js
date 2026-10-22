import express from "express";
import DeliveryZoneController from "./deliveryZone.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import validate from "../../middleware/validate.js";

const router = express.Router();
const staffOnly = requireRole(STAFF_ROLES);

router.post("/", authenticateToken, staffOnly, validate("createDeliveryZoneSchema"), DeliveryZoneController.createDeliveryZone);
router.get("/", DeliveryZoneController.getAllDeliveryZones);
// Public: the storefront asks this before login. Must stay above /:id.
router.get("/serviceability", validate("serviceabilityQuerySchema", "query"), DeliveryZoneController.checkServiceability);
router.get("/:id", DeliveryZoneController.getDeliveryZoneById);
router.put("/:id", authenticateToken, staffOnly, validate("updateDeliveryZoneSchema"), DeliveryZoneController.updateDeliveryZone);
router.delete("/:id", authenticateToken, staffOnly, DeliveryZoneController.deleteDeliveryZone);

export default router;
