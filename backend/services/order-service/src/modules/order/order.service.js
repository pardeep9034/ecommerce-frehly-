import initializeModels from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import OrderRepository from "../repository/order.repository.js";
import OrderItemRepository from "../repository/orderItem.repository.js";
import OrderAddressRepository from "../repository/orderAddress.repository.js";
import OrderStatusHistoryRepository from "../repository/orderStatusHistory.repository.js";
import PaymentRepository from "../repository/payment.repository.js";

const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_EXPIRED: "PAYMENT_EXPIRED"
};

const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  EXPIRED: "EXPIRED"
};

const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.PLACED],
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED]
};

const CUSTOMER_CANCEL_STATUSES = new Set([
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED
]);

const ADMIN_CANCEL_STATUSES = new Set([
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.OUT_FOR_DELIVERY
]);

const getUserId = (user, fallback) => {
  if (typeof user === "number") {
    return user;
  }

  return user?.id || user?.user_id || user?.userId || user?.sub || fallback;
};

const getAuthHeader = (authorization) => {
  return authorization ? { Authorization: authorization } : {};
};

const toJson = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value.toJSON === "function") {
    return value.toJSON();
  }

  return value;
};

const generateOrderNumber = () => {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${time}-${random}`;
};

class OrderService {
  async createOrder(user, data, authorization) {
    const userId = getUserId(user, data.user_id);

    if (!userId) {
      throw new AppError("User id is required", 400);
    }

    const db = await initializeModels();
    const reservationIds = [];

    try {
      return await db.sequelize.transaction(async (transaction) => {
        const snapshotItems = await this.buildOrderItems(data.items);
        const totals = this.calculateTotals(snapshotItems, data);

        const order = await OrderRepository.createOrder({
          order_number: generateOrderNumber(),
          user_id: userId,
          status: ORDER_STATUS.PENDING_PAYMENT,
          subtotal: totals.subtotal,
          delivery_fee: totals.delivery_fee,
          discount_amount: totals.discount_amount,
          total_amount: totals.total_amount,
          payment_status: PAYMENT_STATUS.PENDING,
          placed_at: null
        }, { transaction });

        await OrderItemRepository.createOrderItems(
          snapshotItems.map((item) => ({
            ...item,
            order_id: order.id
          })),
          { transaction }
        );

        await OrderAddressRepository.createOrderAddress({
          ...data.address,
          order_id: order.id
        }, { transaction });

        await OrderStatusHistoryRepository.createStatusHistory({
          order_id: order.id,
          old_status: null,
          new_status: ORDER_STATUS.PENDING_PAYMENT,
          changed_by: userId,
          remarks: "Order created and awaiting payment"
        }, { transaction });

        const payment = await PaymentRepository.createPayment({
          order_id: order.id,
          payment_method: data.payment_method || "COD",
          amount: totals.total_amount,
          status: PAYMENT_STATUS.PENDING,
          gateway_response: null
        }, { transaction });

        for (const item of snapshotItems) {
          const reservation = await this.createReservation(
            order.id,
            item.variant_id,
            item.quantity,
            authorization
          );

          if (reservation?.id) {
            reservationIds.push(reservation.id);
          }
        }

        await PaymentRepository.updatePayment(payment.id, {
          gateway_response: JSON.stringify({
            reservation_ids: reservationIds,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
          })
        }, { transaction });

        const details = await this.getOrderDetails(order.id, user, { transaction });

        return {
          order: details,
          payment_session: {
            order_id: order.id,
            order_number: order.order_number,
            payment_id: payment.id,
            amount: totals.total_amount,
            status: PAYMENT_STATUS.PENDING,
            expires_in_minutes: 15
          }
        };
      });
    } catch (error) {
      await this.compensateReservations(reservationIds, authorization);
      throw error;
    }
  }

  async buildOrderItems(items) {
    return await Promise.all(items.map(async (item) => {
      const variant = await this.fetchVariant(item.variant_id);
      const product = variant?.product  || {};
      const unit = variant?.measurementUnit.code|| {};
      const price = Number(variant.price);
      const mrp = Number(variant?.mrp);
      const quantity = Number(item.quantity);

      if (!Number.isFinite(price) || price < 0) {
        throw new AppError(`price is required for variant ${item.variant_id}`, 400);
      }

      if (!Number.isFinite(mrp) || mrp < 0) {
        throw new AppError(`mrp is required for variant ${item.variant_id}`, 400);
      }

      return {
        product_id:variant?.product.id || item.product_id,
        variant_id: variant?.id || item.variant_id,
        sku:  variant?.sku ||item.sku || null,
        product_name: product?.name || item.product_name || `Product ${item.product_id || variant?.product_id}`,
        variant_name:  `${product.name} - ${variant.measurementUnit?.code }`,
        unit: unit,
        quantity,
        mrp,
        selling_price: price,
        line_total: Number((quantity * price).toFixed(2))
      };
    }));
  }

  calculateTotals(items, data) {
    const subtotal = Number(items.reduce((sum, item) => sum + Number(item.line_total), 0).toFixed(2));
    const deliveryFee = Number(data.delivery_fee || 0);
    const discountAmount = Number(data.discount_amount || 0);
    const totalAmount = Number((subtotal + deliveryFee - discountAmount).toFixed(2));

    if (totalAmount < 0) {
      throw new AppError("total_amount cannot be negative", 400);
    }

    return {
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      total_amount: totalAmount
    };
  }

  async getOrderHistory(user, query = {}) {
    const userId = getUserId(user, query.user_id);
    const page = Number.parseInt(query.page, 10) || 1;
    const limit = Number.parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const where = {};

    if (userId) {
      where.user_id = userId;
    }

    const { count, rows } = await OrderRepository.getOrderHistory(where, limit, offset);

    return {
      orders: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    };
  }

  async getOrderDetails(orderId, user, options = {}) {
    const order = await OrderRepository.getOrderDetails(orderId, {
      transaction: options.transaction
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    this.validateOrderAccess(order, user);

    const orderJson = toJson(order);
    orderJson.payments = [...(orderJson.payments || [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    orderJson.statusHistory = [...(orderJson.statusHistory || [])].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    orderJson.latest_payment = orderJson.payments[0] || null;

    return orderJson;
  }

  validateOrderAccess(order, user) {
    const userId = getUserId(user);
    const role = user?.role || user?.user_role;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "SUPPORT"].includes(String(role || "").toUpperCase());

    if (!isAdmin && userId && Number(order.user_id) !== Number(userId)) {
      throw new AppError("You do not have access to this order", 403);
    }
  }

  async updateOrderStatus(orderId, data, user) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.assertTransition(order.status, data.status);
      const oldStatus = order.status;

      await OrderRepository.updateOrder(order.id, {
        status: data.status,
        placed_at: data.status === ORDER_STATUS.PLACED ? new Date() : order.placed_at
      }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: oldStatus,
        new_status: data.status,
        changed_by: data.changed_by || getUserId(user),
        remarks: data.remarks || null
      }, { transaction });

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  async cancelOrder(orderId, data, user, authorization) {
    const db = await initializeModels();
    const role = user?.role;

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderWithItems(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const allowedStatuses = role === "ADMIN" ? ADMIN_CANCEL_STATUSES : CUSTOMER_CANCEL_STATUSES;
      if (!allowedStatuses.has(order.status)) {
        throw new AppError(`${role} cannot cancel order from ${order.status} status`, 400);
      }

      const previousStatus = order.status;

      await OrderRepository.updateOrder(order.id, { status: ORDER_STATUS.CANCELLED }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: previousStatus,
        new_status: ORDER_STATUS.CANCELLED,
        changed_by: data.changed_by || getUserId(user),
        remarks: data.reason
      }, { transaction });

      let manualInventoryReview = false;

      if ([ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED].includes(previousStatus)) {
        await this.restoreInventory(order.items || [], data.reason, user, data.changed_by, authorization);
      }

      if (previousStatus === ORDER_STATUS.OUT_FOR_DELIVERY) {
        manualInventoryReview = true;
      }

      return {
        order: await this.getOrderDetails(order.id, user, { transaction }),
        manual_inventory_review: manualInventoryReview
      };
    });
  }

  async handlePaymentSuccess(orderId, data, authorization) {
    const db = await initializeModels();

    const existingOrder = await OrderRepository.getOrderById(orderId);
    const existingPayment = await this.getPendingPayment(orderId);

    if (!existingOrder) {
      throw new AppError("Order not found", 404);
    }

    if (!existingPayment) {
      throw new AppError("Pending payment not found", 404);
    }

    if (
      existingOrder.status !== ORDER_STATUS.PENDING_PAYMENT ||
      existingOrder.payment_status !== PAYMENT_STATUS.PENDING
    ) {
      throw new AppError("Only pending payment orders can be marked successful", 400);
    }

    await this.confirmReservations(orderId, authorization);

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction });
      const payment = await this.getPendingPayment(orderId, transaction);

      await PaymentRepository.updatePayment(payment.id, {
        status: PAYMENT_STATUS.SUCCESS,
        transaction_id: data.transaction_id || payment.transaction_id,
        gateway_response: this.mergeGatewayResponse(payment.gateway_response, data.gateway_response),
        paid_at: new Date()
      }, { transaction });

      const oldStatus = order.status;
      await OrderRepository.updateOrder(order.id, {
        status: ORDER_STATUS.PLACED,
        payment_status: PAYMENT_STATUS.SUCCESS,
        placed_at: new Date()
      }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: oldStatus,
        new_status: ORDER_STATUS.PLACED,
        changed_by: null,
        remarks: data.remarks || "Payment successful"
      }, { transaction });

      return await this.getOrderDetails(order.id, null, { transaction });
    });
  }

  async handlePaymentFailure(orderId, data, authorization) {
    const db = await initializeModels();

    const existingOrder = await OrderRepository.getOrderById(orderId);
    const existingPayment = await this.getPendingPayment(orderId);

    if (!existingOrder) {
      throw new AppError("Order not found", 404);
    }

    if (!existingPayment) {
      throw new AppError("Pending payment not found", 404);
    }

    if (
      existingOrder.status !== ORDER_STATUS.PENDING_PAYMENT ||
      existingOrder.payment_status !== PAYMENT_STATUS.PENDING
    ) {
      throw new AppError("Only pending payment orders can be marked failed", 400);
    }

    await this.releaseReservations(orderId, authorization, "release");

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction });
      const payment = await this.getPendingPayment(orderId, transaction);

      await PaymentRepository.updatePayment(payment.id, {
        status: PAYMENT_STATUS.FAILED,
        transaction_id: data.transaction_id || payment.transaction_id,
        gateway_response: this.mergeGatewayResponse(payment.gateway_response, data.gateway_response)
      }, { transaction });

      const oldStatus = order.status;
      await OrderRepository.updateOrder(order.id, {
        status: ORDER_STATUS.PAYMENT_FAILED,
        payment_status: PAYMENT_STATUS.FAILED
      }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: oldStatus,
        new_status: ORDER_STATUS.PAYMENT_FAILED,
        changed_by: null,
        remarks: data.remarks || "Payment failed"
      }, { transaction });

      return await this.getOrderDetails(order.id, null, { transaction });
    });
  }

  async refundPayment(orderId, data, user) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const payment = await PaymentRepository.getSuccessfulPayment(orderId, { transaction });

      if (!payment) {
        throw new AppError("Successful payment not found for refund", 404);
      }

      await PaymentRepository.updatePayment(payment.id, {
        status: PAYMENT_STATUS.REFUNDED,
        gateway_response: this.mergeGatewayResponse(payment.gateway_response, data.gateway_response)
      }, { transaction });

      await OrderRepository.updateOrder(order.id, {
        payment_status: PAYMENT_STATUS.REFUNDED
      }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: order.status,
        new_status: order.status,
        changed_by: getUserId(user),
        remarks: data.remarks || "Payment refunded"
      }, { transaction });

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  async expirePendingPayments(authorization) {
    const db = await initializeModels();
    const expiryTime = new Date(Date.now() - 15 * 60 * 1000);
    const orders = await OrderRepository.getExpiredPendingPayments(expiryTime);

    const expired = [];

    for (const order of orders) {
      await this.releaseReservations(order.id, authorization, "expire");

      await db.sequelize.transaction(async (transaction) => {
        const payment = await this.getPendingPayment(order.id, transaction);

        if (payment) {
          await PaymentRepository.updatePayment(payment.id, { status: PAYMENT_STATUS.EXPIRED }, { transaction });
        }

        await OrderRepository.updateOrder(order.id, {
          status: ORDER_STATUS.PAYMENT_EXPIRED,
          payment_status: PAYMENT_STATUS.FAILED
        }, { transaction });

        await OrderStatusHistoryRepository.createStatusHistory({
          order_id: order.id,
          old_status: ORDER_STATUS.PENDING_PAYMENT,
          new_status: ORDER_STATUS.PAYMENT_EXPIRED,
          changed_by: null,
          remarks: "Payment reservation expired"
        }, { transaction });
      });

      expired.push(order.id);
    }

    return {
      expired_count: expired.length,
      order_ids: expired
    };
  }

  assertTransition(currentStatus, nextStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      throw new AppError(`Invalid status transition from ${currentStatus} to ${nextStatus}`, 400);
    }
  }

  async getPendingPayment(orderId, transaction) {
    return await PaymentRepository.getPendingPayment(orderId, { transaction });
  }

  async fetchVariant(variantId) {
    const response = await fetch(`${env.PRODUCT_SERVICE_URL}/product-variant/variants/${variantId}`);

    if (!response.ok) {
      throw new AppError(`Variant ${variantId} not found`, 404);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new AppError(`Variant ${variantId} not found`, 404);
    }

    return result.data;
  }

  async requestInventory(path, options = {}, authorization) {
    const response = await fetch(`${env.INVENTORY_SERVICE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(authorization),
        ...(options.headers || {})
      }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new AppError(result.message || "Inventory service request failed", response.status || 500);
    }

    return result.data;
  }

  async createReservation(orderId, variantId, quantity, authorization) {
    const data = await this.requestInventory(
      "/stock-reservations",
      {
        method: "POST",
        body: JSON.stringify({
          order_id: orderId,
          variant_id: variantId,
          quantity,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
      },
      authorization
    );

    return data?.stockReservation || data;
  }

  async getReservations(orderId, authorization) {
    const data = await this.requestInventory(
      `/stock-reservations/order/${orderId}?limit=100&offset=0`,
      { method: "GET" },
      authorization
    );

    return data?.rows || data?.stockReservations?.rows || [];
  }

  async confirmReservations(orderId, authorization) {
    const reservations = await this.getReservations(orderId, authorization);

    for (const reservation of reservations.filter((item) => item.status === "ACTIVE")) {
      await this.requestInventory(
        `/stock-reservations/${reservation.id}/confirm`,
        { method: "PATCH" },
        authorization
      );
    }
  }

  async releaseReservations(orderId, authorization, action) {
    const reservations = await this.getReservations(orderId, authorization);

    for (const reservation of reservations.filter((item) => item.status === "ACTIVE")) {
      await this.requestInventory(
        `/stock-reservations/${reservation.id}/${action}`,
        { method: "PATCH" },
        authorization
      );
    }
  }

  async compensateReservations(reservationIds, authorization) {
    for (const reservationId of reservationIds) {
      try {
        await this.requestInventory(
          `/stock-reservations/${reservationId}/release`,
          { method: "PATCH" },
          authorization
        );
      } catch (error) {
        console.error(`Failed to release reservation ${reservationId}:`, error.message);
      }
    }
  }

  async restoreInventory(items, reason, user, changedBy, authorization) {
    const createdBy = changedBy || getUserId(user);

    for (const item of items) {
      await this.requestInventory(
        "/stock-movements",
        {
          method: "POST",
          body: JSON.stringify({
            variant_id: item.variant_id,
            movement_type: "RETURN",
            quantity: item.quantity,
            reason: reason || "Order cancelled",
            created_by: createdBy
          })
        },
        authorization
      );
    }
  }

  mergeGatewayResponse(existingResponse, nextResponse) {
    let existing = {};

    try {
      existing = existingResponse ? JSON.parse(existingResponse) : {};
    } catch (error) {
      existing = { previous_raw: existingResponse };
    }

    const next = typeof nextResponse === "string"
      ? { raw: nextResponse }
      : (nextResponse || {});

    return JSON.stringify({
      ...existing,
      ...next
    });
  }
}

export default new OrderService();
