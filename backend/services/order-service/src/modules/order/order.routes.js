import express from "express";
import orderController from "./order.controller.js";
import validate from "../../middleware/validate.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateToken, validate("createOrder"), orderController.createOrder);
router.get("/", authenticateToken, orderController.getOrderHistory);
router.get("/:orderId", authenticateToken, orderController.getOrderDetails);
router.patch("/:orderId/status", authenticateToken, validate("updateOrderStatus"), orderController.updateOrderStatus);
router.patch("/:orderId/cancel", authenticateToken, validate("cancelOrder"), orderController.cancelOrder);
router.post("/:orderId/payment/success", authenticateToken, validate("paymentCallback"), orderController.handlePaymentSuccess);
router.post("/:orderId/payment/failure", authenticateToken, validate("paymentCallback"), orderController.handlePaymentFailure);
router.post("/:orderId/payment/refund", authenticateToken, validate("paymentCallback"), orderController.refundPayment);
router.post("/reservations/expire", authenticateToken, orderController.expirePendingPayments);

export default router;
