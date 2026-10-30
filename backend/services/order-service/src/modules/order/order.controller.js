import ResponseUtil from "../../utils/response.js";
import orderService from "./order.service.js";
import logger from "../../utils/Logger.js";
import AppError from "../../utils/AppError.js";

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const actorContext = (req) => ({
  actorId: req.user?.user_id || null,
  actorRole: req.user?.role || null
});

class OrderController {
  async createOrder(req, res, next) {
    const warehouse_id=req.headers["x-warehouse-id"]
    const idempotency_key=req.headers["idempotency-key"]
    const data=req.body
    try {
      const result = await orderService.createOrder(req.user,{...data,warehouse_id,idempotency_key}, req.headers.authorization);
      logger.info("order.create.success", { ...actorContext(req), orderId: result?.order?.id });
      return ResponseUtil.success(res, result, "Order created successfully", 201);
    } catch (error) {
      logger.error("order.create.failed", { ...actorContext(req), error: error.message });
      return next(error);
    }
  }

  async getOrderHistory(req, res, next) {
    try {
      const result = await orderService.getOrderHistory(req.user, req.query);
      return ResponseUtil.success(res, result, "Order history fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const result = await orderService.getAllOrders(req.query, req.user);
      return ResponseUtil.success(res, result, "Orders fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async getOrderStats(req, res, next) {
    try {
      const result = await orderService.getOrderStats(req.query, req.user);
      return ResponseUtil.success(res, result, "Order stats fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async getCustomerStats(req, res, next) {
    try {
      const result = await orderService.getCustomerStats(req.query, req.user);
      return ResponseUtil.success(res, result, "Customer stats fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async getOrderDetails(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.getOrderDetails(orderId, req.user, { withStaffNames: true });
      return ResponseUtil.success(res, result, "Order details fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.updateOrderStatus(orderId, req.body, req.user);
      logger.info("order.status.updated", { ...actorContext(req), orderId, status: req.body?.status });
      return ResponseUtil.success(res, result, "Order status updated successfully");
    } catch (error) {
      logger.error("order.status.update_failed", { ...actorContext(req), orderId: req.params.orderId, error: error.message });
      return next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.cancelOrder(orderId, req.body, req.user, req.headers.authorization);
      logger.info("order.cancelled", { ...actorContext(req), orderId });
      return ResponseUtil.success(res, result, "Order cancelled successfully");
    } catch (error) {
      logger.error("order.cancel_failed", { ...actorContext(req), orderId: req.params.orderId, error: error.message });
      return next(error);
    }
  }

  async updateOrderItemStatus(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      const itemId = parsePositiveInt(req.params.itemId);

      if (!orderId || !itemId) {
        return ResponseUtil.error(res, "Invalid order or item ID", 400);
      }

      const result = await orderService.updateOrderItemStatus(orderId, itemId, req.body, req.user);
      return ResponseUtil.success(res, result, "Order item status updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async finalizeOrderItems(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.finalizeOrderItems(orderId, req.user, req.headers.authorization);
      return ResponseUtil.success(res, result, "Order items finalized successfully");
    } catch (error) {
      return next(error);
    }
  }

  async packOrder(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.packOrder(orderId, req.body, req.user);
      return ResponseUtil.success(res, result, "Order packed");
    } catch (error) {
      return next(error);
    }
  }

  async confirmPartialOrder(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.confirmPartialOrder(orderId, req.body.decision, req.user, req.headers.authorization);
      return ResponseUtil.success(res, result, "Order confirmation processed successfully");
    } catch (error) {
      return next(error);
    }
  }

  async handlePaymentWebhook(req, res, next) {
    try {
      const signature = req.headers["x-payment-signature"];
      const result = await orderService.processPaymentWebhook(req.rawBody, signature);
      logger.info("order.payment.webhook_processed", { orderId: result?.id || result?.order?.id });
      return ResponseUtil.success(res, result, "Webhook processed successfully");
    } catch (error) {
      logger.error("order.payment.webhook_failed", { error: error.message });
      return next(error);
    }
  }

  async handlePaymentSuccess(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.handlePaymentSuccess(orderId, req.body, req.headers.authorization);
      logger.info("order.payment.success", { ...actorContext(req), orderId });
      return ResponseUtil.success(res, result, "Payment success processed successfully");
    } catch (error) {
      logger.error("order.payment.success_failed", { ...actorContext(req), orderId: req.params.orderId, error: error.message });
      return next(error);
    }
  }

  async handlePaymentFailure(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.handlePaymentFailure(orderId, req.body, req.headers.authorization);
      logger.info("order.payment.failure", { ...actorContext(req), orderId });
      return ResponseUtil.success(res, result, "Payment failure processed successfully");
    } catch (error) {
      logger.error("order.payment.failure_failed", { ...actorContext(req), orderId: req.params.orderId, error: error.message });
      return next(error);
    }
  }

  async refundPayment(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const result = await orderService.refundPayment(orderId, req.body, req.user);
      logger.info("order.payment.refunded", { ...actorContext(req), orderId });
      return ResponseUtil.success(res, result, "Payment refunded successfully");
    } catch (error) {
      logger.error("order.payment.refund_failed", { ...actorContext(req), orderId: req.params.orderId, error: error.message });
      return next(error);
    }
  }

  async expirePendingPayments(req, res, next) {
    try {
      const result = await orderService.expirePendingPayments(req.headers.authorization);
      return ResponseUtil.success(res, result, "Expired payment reservations processed successfully");
    } catch (error) {
      return next(error);
    }
  }

  async retryPayment(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      if (!orderId) {
        return ResponseUtil.error(res, "Invalid order ID", 400);
      }

      const warehouse_id = req.headers["x-warehouse-id"];
      const result = await orderService.retryPayment(orderId, { ...req.body, warehouse_id }, req.user, req.headers.authorization);
      logger.info("order.payment.retry", { ...actorContext(req), orderId });
      return ResponseUtil.success(res, result, "Payment retry initiated successfully");
    } catch (error) {
      logger.error("order.payment.retry_failed", { ...actorContext(req), orderId: req.params.orderId, error: error.message });
      return next(error);
    }
  }

  async listReturns(req, res, next) {
    try {
      const result = await orderService.listReturns(req.query, req.user);
      return ResponseUtil.success(res, result, "Returns fetched successfully");
    } catch (error) {
      return next(error);
    }
  }

  async getReturnPhoto(req, res, next) {
    try {
      const orderId = parsePositiveInt(req.params.orderId);
      const returnId = parsePositiveInt(req.params.returnId);
      if (!orderId || !returnId) {
        return ResponseUtil.error(res, "Invalid order or return ID", 400);
      }
      const { bytes, mime } = await orderService.getReturnPhoto(orderId, returnId, req.user);
      res.set({ "Content-Type": mime, "Cache-Control": "private, no-store" });
      return res.send(bytes);
    } catch (error) {
      return next(error);
    }
  }
}

// The return's id from /:orderId/returns/:returnId routes.
const returnIdOf = (req) => {
  const returnId = parsePositiveInt(req.params.returnId);
  if (!returnId) {
    throw new AppError("Invalid return ID", 400);
  }
  return returnId;
};

// The door and returns endpoints: each takes /:orderId and hands the body (and caller) to one service method.
const orderAction = (event, message, run) => async (req, res, next) => {
  try {
    const orderId = parsePositiveInt(req.params.orderId);
    if (!orderId) {
      return ResponseUtil.error(res, "Invalid order ID", 400);
    }

    const result = await run(orderId, req);
    logger.info(event, { ...actorContext(req), orderId });
    return ResponseUtil.success(res, result, message);
  } catch (error) {
    logger.error(`${event}_failed`, { ...actorContext(req), orderId: req.params.orderId, error: error.message });
    return next(error);
  }
};

const controller = new OrderController();
Object.assign(controller, {
  deliverAtDoor: orderAction("order.door.delivered", "Order delivered", (orderId, req) => orderService.deliverAtDoor(orderId, req.body, req.user)),
  createDoorQr: orderAction("order.door_qr.requested", "QR ready", (orderId, req) => orderService.createDoorQr(orderId, req.body)),
  getDoorPayment: orderAction("order.door_qr.checked", "Door payment fetched", (orderId) => orderService.getDoorPayment(orderId)),
  closeDoorQr: orderAction("order.door_qr.closed", "QR closed", (orderId) => orderService.closeDoorQr(orderId)),
  returnArrived: orderAction("order.return.arrived", "Return received", (orderId, req) => orderService.returnArrived(orderId, req.body, req.user)),
  inspectReturns: orderAction("order.return.inspected", "Returns inspected", (orderId, req) => orderService.inspectReturns(orderId, req.body, req.user, req.headers.authorization)),
  requestReturn: orderAction("order.return.requested", "Return requested", (orderId, req) => orderService.requestReturn(orderId, req.body, req.user)),
  reviewReturn: orderAction("order.return.reviewed", "Return reviewed", (orderId, req) => orderService.reviewReturn(orderId, returnIdOf(req), req.body, req.user, req.headers.authorization)),
  returnPickup: orderAction("order.return.pickup", "Pickup recorded", (orderId, req) => orderService.returnPickup(orderId, req.body))
});

export default controller;
