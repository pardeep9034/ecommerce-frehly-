import express from "express";
import orderController from "./order.controller.js";
import validate from "../../middleware/validate.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateToken, validate("createOrder"), orderController.createOrder);
router.get("/", authenticateToken, orderController.getOrderHistory);
router.get("/admin/stats", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "SYSTEM"), orderController.getOrderStats);
router.get("/admin/customer-stats", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), orderController.getCustomerStats);
// OPS_STAFF = store staff: the service limits them to their own store (staffWarehouse).
router.get("/admin/all",authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "OPS_STAFF"), orderController.getAllOrders);
router.get("/returns", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "OPS_STAFF"), orderController.listReturns);
router.get("/:orderId", authenticateToken, orderController.getOrderDetails);
// At the door and on the way back: delivery-service calls these as SYSTEM, after its own checks (the rider owns the
// assignment, the delivery code, the store's return code).
router.post("/:orderId/deliver", authenticateToken, requireRole("SYSTEM"), validate("deliverAtDoor"), orderController.deliverAtDoor);
router.post("/:orderId/door-qr", authenticateToken, requireRole("SYSTEM"), validate("doorQr"), orderController.createDoorQr);
router.get("/:orderId/door-qr", authenticateToken, requireRole("SYSTEM"), orderController.getDoorPayment);
router.delete("/:orderId/door-qr", authenticateToken, requireRole("SYSTEM"), orderController.closeDoorQr);
router.post("/:orderId/returns/arrived", authenticateToken, requireRole("SYSTEM"), validate("returnArrived"), orderController.returnArrived);
router.post("/:orderId/returns/pickup", authenticateToken, requireRole("SYSTEM"), validate("returnPickup"), orderController.returnPickup);
// The customer asks for a return after delivery (the service refuses staff); the photo is theirs and their store's.
router.post("/:orderId/returns", authenticateToken, validate("requestReturn"), orderController.requestReturn);
router.get("/:orderId/returns/:returnId/photo", authenticateToken, orderController.getReturnPhoto);
// Store staff are limited to their own store's orders by the service (validateOrderAccess).
router.patch("/:orderId/returns/inspect", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "OPS_STAFF"), validate("inspectReturns"), orderController.inspectReturns);
router.patch("/:orderId/returns/:returnId/review", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "OPS_STAFF"), validate("reviewReturn"), orderController.reviewReturn);
// OPS_STAFF reach this through delivery-service (assign, hand over); the service allows them ASSIGNED / PICKED_UP only.
router.patch("/:orderId/status", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "SYSTEM", "OPS_STAFF"), validate("updateOrderStatus"), orderController.updateOrderStatus);
router.patch("/:orderId/cancel", authenticateToken, validate("cancelOrder"), orderController.cancelOrder);
router.patch("/:orderId/items/:itemId/status", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "OPS_STAFF"), validate("updateOrderItemStatus"), orderController.updateOrderItemStatus);
router.post("/:orderId/items/finalize", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "OPS_STAFF"), orderController.finalizeOrderItems);
router.post("/:orderId/pack", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT", "OPS_STAFF"), validate("packOrder"), orderController.packOrder);
router.post("/:orderId/confirm-partial", authenticateToken, validate("confirmPartialOrder"), orderController.confirmPartialOrder);
// No authenticateToken: the gateway calling this has no user JWT. Trust
// comes from the HMAC signature in x-payment-signature instead (verified
// inside processPaymentWebhook), the same way a real gateway webhook works.
router.post("/payments/webhook", orderController.handlePaymentWebhook);

router.post("/:orderId/payment/success", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("paymentCallback"), orderController.handlePaymentSuccess);
router.post("/:orderId/payment/failure", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("paymentCallback"), orderController.handlePaymentFailure);
router.post("/:orderId/payment/refund", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), validate("paymentCallback"), orderController.refundPayment);
router.post("/:orderId/payment/retry", authenticateToken, validate("retryPayment"), orderController.retryPayment);
router.post("/reservations/expire", authenticateToken, requireRole("ADMIN", "SUPER_ADMIN", "SUPPORT"), orderController.expirePendingPayments);

export default router;
