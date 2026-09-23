import ResponseUtil from "../../utils/response.js";
import orderService from "./order.service.js";
import logger from "../../utils/Logger.js";

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
      const result = await orderService.getAllOrders(req.query);
      return ResponseUtil.success(res, result, "Orders fetched successfully");
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

      const result = await orderService.getOrderDetails(orderId, req.user);
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
}

export default new OrderController();
