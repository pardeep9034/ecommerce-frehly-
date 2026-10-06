import express from "express";
import StockReservationController from "./stockReservation.controller.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ADMIN_ROLES } from "../../constants/roles.js";

const router = express.Router();

// The list is the admin Reservations page. The reads below it are also used by order-service,
// which forwards the caller's token (any role).
router.get(
  "/",
  authenticateToken,
  requireRole(ADMIN_ROLES),
  StockReservationController.getAllStockReservations,
);
router.get("/variant/:variantId", authenticateToken, StockReservationController.getStockReservationsByVariantId);
router.get("/order/:orderId", authenticateToken, StockReservationController.getStockReservationsByOrderId);
router.get("/:id", authenticateToken, StockReservationController.getStockReservationById);
router.post(
  "/",
  authenticateToken,
  validate("createStockReservationSchema"),
  StockReservationController.createStockReservation,
);
router.patch("/:id/confirm", authenticateToken, StockReservationController.confirmStockReservation);
router.patch("/:id/release", authenticateToken, StockReservationController.releaseStockReservation);
router.patch("/:id/expire", authenticateToken, StockReservationController.expireStockReservation);

export default router;
