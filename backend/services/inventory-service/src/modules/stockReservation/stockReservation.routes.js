import express from "express";
import StockReservationController from "./stockReservation.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", StockReservationController.getAllStockReservations);
router.get("/variant/:variantId", StockReservationController.getStockReservationsByVariantId);
router.get("/order/:orderId", StockReservationController.getStockReservationsByOrderId);
router.get("/:id", StockReservationController.getStockReservationById);
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
