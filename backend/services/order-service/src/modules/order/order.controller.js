import ResponseUtil from "../../utils/response.js";
import orderService from "./order.service.js";

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

class OrderController {
  async createOrder(req, res, next) {
    try {
      const result = await orderService.createOrder(req.user, req.body, req.headers.authorization);
      return ResponseUtil.success(res, result, "Order created successfully", 201);
    } catch (error) {
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
      return ResponseUtil.success(res, result, "Order status updated successfully");
    } catch (error) {
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
      return ResponseUtil.success(res, result, "Order cancelled successfully");
    } catch (error) {
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
      return ResponseUtil.success(res, result, "Payment success processed successfully");
    } catch (error) {
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
      return ResponseUtil.success(res, result, "Payment failure processed successfully");
    } catch (error) {
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
      return ResponseUtil.success(res, result, "Payment refunded successfully");
    } catch (error) {
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
}

export default new OrderController();
