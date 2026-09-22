import express from "express";
import orderController from "./order.controller.js";
import validate from "../../middleware/validate.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateToken, validate("createOrder"), orderController.createOrder);
router.get("/", authenticateToken, orderController.getOrderHistory);
router.get("/admin/all", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), orderController.getAllOrders);
router.get("/:orderId", authenticateToken, orderController.getOrderDetails);
router.patch("/:orderId/status", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("updateOrderStatus"), orderController.updateOrderStatus);
router.patch("/:orderId/cancel", authenticateToken, validate("cancelOrder"), orderController.cancelOrder);
router.patch("/:orderId/items/:itemId/status", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("updateOrderItemStatus"), orderController.updateOrderItemStatus);
router.post("/:orderId/items/finalize", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), orderController.finalizeOrderItems);
router.post("/:orderId/confirm-partial", authenticateToken, validate("confirmPartialOrder"), orderController.confirmPartialOrder);
router.post("/:orderId/payment/success", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("paymentCallback"), orderController.handlePaymentSuccess);
router.post("/:orderId/payment/failure", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("paymentCallback"), orderController.handlePaymentFailure);
router.post("/:orderId/payment/refund", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("paymentCallback"), orderController.refundPayment);
router.post("/:orderId/payment/retry", authenticateToken, validate("retryPayment"), orderController.retryPayment);
router.post("/reservations/expire", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), orderController.expirePendingPayments);

export default router;
