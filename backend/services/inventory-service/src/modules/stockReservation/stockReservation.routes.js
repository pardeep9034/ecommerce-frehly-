import express from "express";
import StockReservationController from "./stockReservation.controller.js";
import { authenticateToken, requireRole, staffOrService } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ADMIN_ROLES } from "../../constants/roles.js";

const router = express.Router();

// The list is the admin Reservations page. Everything below it is staff, or order-service with INTERNAL_API_KEY
// (it reserves and releases stock for customers' orders).
router.get(
  "/",
  authenticateToken,
  requireRole(ADMIN_ROLES),
  StockReservationController.getAllStockReservations,
);
router.get("/variant/:variantId", staffOrService, StockReservationController.getStockReservationsByVariantId);
router.get("/order/:orderId", staffOrService, StockReservationController.getStockReservationsByOrderId);
router.get("/:id", staffOrService, StockReservationController.getStockReservationById);
router.post(
  "/",
  staffOrService,
  validate("createStockReservationSchema"),
  StockReservationController.createStockReservation,
);
router.patch("/:id/confirm", staffOrService, StockReservationController.confirmStockReservation);
router.patch("/:id/release", staffOrService, StockReservationController.releaseStockReservation);
router.patch("/:id/expire", staffOrService, StockReservationController.expireStockReservation);

export default router;
