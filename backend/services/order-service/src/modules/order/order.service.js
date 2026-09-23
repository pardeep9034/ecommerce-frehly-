import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import initializeModels from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import OrderRepository from "../repository/order.repository.js";
import OrderItemRepository from "../repository/orderItem.repository.js";
import OrderAddressRepository from "../repository/orderAddress.repository.js";
import OrderStatusHistoryRepository from "../repository/orderStatusHistory.repository.js";
import PaymentRepository from "../repository/payment.repository.js";
import {publisher} from "../../messaging/index.js"
import OrderEvents from "../../messaging/events/order.events.js";
import PaymentEvents from "../../messaging/events/payment.events.js";
import { paymentGateway } from "../../payment/index.js";
import logger from "../../utils/Logger.js";

const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  READY_FOR_ASSIGNMENT:"READY_FOR_ASSIGNMENT",
  AWAITING_CUSTOMER_CONFIRMATION: "AWAITING_CUSTOMER_CONFIRMATION",
  ASSIGNED:"ASSIGNED",
  PICKED_UP:"PICKED_UP",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  HANDOVER_IN_PROGRESS:"HANDOVER_IN_PROGRESS",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  DELIVERY_FAILED:"DELIVERY_FAILED",
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
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.PLACED, ORDER_STATUS.PAYMENT_FAILED, ORDER_STATUS.PAYMENT_EXPIRED],
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.READY_FOR_ASSIGNMENT, ORDER_STATUS.AWAITING_CUSTOMER_CONFIRMATION, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.READY_FOR_ASSIGNMENT, ORDER_STATUS.AWAITING_CUSTOMER_CONFIRMATION, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.AWAITING_CUSTOMER_CONFIRMATION]: [ORDER_STATUS.READY_FOR_ASSIGNMENT, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY_FOR_ASSIGNMENT]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERY_FAILED],
  [ORDER_STATUS.ASSIGNED]: [ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERY_FAILED],
  [ORDER_STATUS.PICKED_UP]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.HANDOVER_IN_PROGRESS, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERY_FAILED],
  [ORDER_STATUS.HANDOVER_IN_PROGRESS]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERY_FAILED],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.PAYMENT_FAILED]: [ORDER_STATUS.PENDING_PAYMENT],
  [ORDER_STATUS.PAYMENT_EXPIRED]: [ORDER_STATUS.PENDING_PAYMENT]
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

  return  user?.user_id || fallback;
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

    const idempotencyKey = data.idempotency_key ? String(data.idempotency_key).trim() : null;

    if (idempotencyKey) {
      const existingOrder = await OrderRepository.findByUserIdempotencyKey(userId, idempotencyKey);
      if (existingOrder) {
        return await this.buildOrderResponse(existingOrder, user);
      }
    }

    const cartItemsResponse=await fetch(`${env.API_GATEWAY_URL}/cart/${data.cart_id}`,{
  headers: {
    "Content-Type":"application/json",
    Authorization: authorization
  }    })
  if(!cartItemsResponse.ok){
    throw new AppError("cart items not found");
  }
const cartItems= await cartItemsResponse.json();
logger.debug("cart items", { cartItems });

if (!cartItems?.data?.items?.length) {
  throw new AppError("Cart is empty", 400);
}


const userAddressResponse=await fetch(`${env.API_GATEWAY_URL}/user-addresses/${data.address_id}`,{
  method:"GET",
  headers:{
    Authorization:authorization
  }
})
if(!userAddressResponse.ok){
  throw new AppError("user address not found",404)
}
const userAddress=await userAddressResponse.json()
if(!userAddress.success){
  throw new AppError("user address not found",404)
}

    const paymentMethod = data.payment_method || "COD";
    const isCOD = paymentMethod === "COD";

    const db = await initializeModels();
    const reservationIds = [];

    try {
      return await db.sequelize.transaction(async (transaction) => {
        const snapshotItems = await this.buildOrderItems(cartItems.data.items);
        const totals = this.calculateTotals(snapshotItems, data);

        const order = await OrderRepository.createOrder({
          order_number: generateOrderNumber(),
          user_id: userId,
          status: isCOD ? ORDER_STATUS.PLACED : ORDER_STATUS.PENDING_PAYMENT,
          subtotal: totals.subtotal,
          delivery_fee: totals.delivery_fee,
          discount_amount: totals.discount_amount,
          total_amount: totals.total_amount,
          payment_status: isCOD ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.PENDING,
          placed_at: isCOD ? new Date() : null,
          idempotency_key: idempotencyKey
        }, { transaction });

        const createdItems = await OrderItemRepository.createOrderItems(
          snapshotItems.map((item) => ({
            ...item,
            order_id: order.id
          })),
          { transaction }
        );

        await OrderAddressRepository.createOrderAddress({
          order_id:order.id,
          full_name:userAddress.data.full_name,
          phone:userAddress.data.phone,
          address_line_1:userAddress.data.address_line_1,
          address_line_2:userAddress.data.address_line_2 || null,
          landmark:userAddress.data.landmark || null,
          city:userAddress.data.city,
          state:userAddress.data.state,
          postal_code:userAddress.data.postal_code,
          country:userAddress.data.country,
          latitude:userAddress.data.latitude,
          longitude:userAddress.data.longitude,
        }, { transaction });

        await OrderStatusHistoryRepository.createStatusHistory({
          order_id: order.id,
          old_status: null,
          new_status: order.status,
          changed_by: userId,
          remarks: isCOD ? "Order placed with Cash on Delivery" : "Order created and awaiting payment"
        }, { transaction });

        const payment = await PaymentRepository.createPayment({
          order_id: order.id,
          payment_method: paymentMethod,
          amount: totals.total_amount,
          status: isCOD ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.PENDING,
          paid_at: isCOD ? new Date() : null,
          gateway_response: null
        }, { transaction });
        const orderData=order.toJSON()

      

        for (const item of snapshotItems) {
          const reservation = await this.createReservation(
            order.id,
            item.variant_id,
            data.warehouse_id,
            item.quantity,
            authorization
          );

          if (reservation?.id) {
            reservationIds.push(reservation.id);

            const createdItem = createdItems.find((created) => created.variant_id === item.variant_id);
            if (createdItem) {
              await OrderItemRepository.updateItem(createdItem.id, { reservation_id: reservation.id }, { transaction });
            }
          }
        }

        const gatewaySession = isCOD ? null : await paymentGateway.createPaymentSession({
          orderId: order.id,
          orderNumber: order.order_number,
          amount: totals.total_amount,
          paymentMethod
        });

        await PaymentRepository.updatePayment(payment.id, {
          gateway_response: JSON.stringify({
            reservation_ids: reservationIds,
            ...(isCOD ? {} : { expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() }),
            ...(gatewaySession ? { provider_session_id: gatewaySession.providerSessionId, checkout_url: gatewaySession.checkoutUrl } : {})
          })
        }, { transaction });
           await publisher.publish(OrderEvents.ORDER_CREATED,{...orderData,items:snapshotItems})

        const details = await this.getOrderDetails(order.id, user, { transaction });

        return {
          order: details,
          payment_session: {
            order_id: order.id,
            order_number: order.order_number,
            payment_id: payment.id,
            amount: totals.total_amount,
            status: payment.status,
            expires_in_minutes: isCOD ? null : 15,
            checkout_url: gatewaySession?.checkoutUrl || null,
            provider_session_id: gatewaySession?.providerSessionId || null
          }
        };
      });
    } catch (error) {
      if (idempotencyKey && error?.name === "SequelizeUniqueConstraintError") {
        const existingOrder = await OrderRepository.findByUserIdempotencyKey(userId, idempotencyKey);
        if (existingOrder) {
          return await this.buildOrderResponse(existingOrder, user);
        }
      }
      await this.compensateReservations(reservationIds, authorization);
      throw error;
    }
  }

  async buildOrderResponse(order, user) {
    const details = await this.getOrderDetails(order.id, user);
    const latestPayment = details.latest_payment;
    const gatewayInfo = this.parseGatewayResponse(latestPayment?.gateway_response);

    return {
      order: details,
      payment_session: {
        order_id: details.id,
        order_number: details.order_number,
        payment_id: latestPayment?.id || null,
        amount: details.total_amount,
        status: latestPayment?.status || details.payment_status,
        expires_in_minutes: details.payment_status === PAYMENT_STATUS.SUCCESS ? null : 15,
        checkout_url: gatewayInfo.checkout_url || null,
        provider_session_id: gatewayInfo.provider_session_id || null
      }
    };
  }

  parseGatewayResponse(raw) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (error) {
      return {};
    }
  }

  async publishPaymentEvent(event, payload) {
    try {
      await publisher.publish(event, payload);
    } catch (error) {
      logger.error(`Failed to publish ${event.routingKey}`, { error: error.message, ...payload });
    }
  }

  // A gateway webhook has no user's JWT to forward to inventory-service.
  // Mint a short-lived internal token instead — every service verifies
  // JWTs against the same shared JWT_SECRET, so this is accepted exactly
  // like a real user's token would be (see backend/CLAUDE.md's Auth section).
  buildSystemAuthorization() {
    const token = jwt.sign({ user_id: "system", role: "SYSTEM" }, process.env.JWT_SECRET, { expiresIn: "5m" });
    return `Bearer ${token}`;
  }

  async processPaymentWebhook(rawBody, signatureHeader) {
    if (!paymentGateway.verifyWebhookSignature(rawBody, signatureHeader)) {
      throw new AppError("Invalid webhook signature", 401);
    }

    const event = paymentGateway.parseWebhookEvent(rawBody);
    const order = await OrderRepository.getOrderById(event.orderId);

    if (!order) {
      throw new AppError(`Webhook references unknown order ${event.orderId}`, 404);
    }

    // Gateways redeliver webhooks (no ack, network blip, etc). If this
    // order already left PENDING_PAYMENT, this event was already applied
    // (or is now stale) — treat it as a no-op instead of erroring, so the
    // gateway sees a clean 200 and stops retrying.
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      logger.info("payment.webhook.ignored", { orderId: event.orderId, orderStatus: order.status, eventType: event.type });
      return await this.getOrderDetails(order.id, null);
    }

    const authorization = this.buildSystemAuthorization();
    const data = {
      transaction_id: event.transactionId,
      gateway_response: event.raw,
      remarks: `Payment ${event.type === "payment.succeeded" ? "confirmed" : "failed"} via gateway webhook`
    };

    if (event.type === "payment.succeeded") {
      return await this.handlePaymentSuccess(order.id, data, authorization);
    }

    if (event.type === "payment.failed") {
      return await this.handlePaymentFailure(order.id, data, authorization);
    }

    logger.info("payment.webhook.unhandled_event", { orderId: event.orderId, eventType: event.type });
    return await this.getOrderDetails(order.id, null);
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

  async getAllOrders(query = {}) {
    const page = Number.parseInt(query.page, 10) || 1;
    const limit = Number.parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const where = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.user_id) {
      where.user_id = query.user_id;
    }

    if (query.search) {
      const trimmed = String(query.search).trim();
      if (/^\d+$/.test(trimmed)) {
        const numeric = Number(trimmed);
        where[Op.or] = [{ id: numeric }, { user_id: numeric }];
      } else {
        where.id = -1;
      }
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

  async updateOrderItemStatus(orderId, itemId, data, user) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderWithItems(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (![ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED].includes(order.status)) {
        throw new AppError(`Cannot review items while order is ${order.status}`, 400);
      }

      const item = (order.items || []).find((orderItem) => Number(orderItem.id) === Number(itemId));

      if (!item) {
        throw new AppError("Order item not found", 404);
      }

      await OrderItemRepository.updateItem(item.id, {
        status: data.status,
        admin_remarks: data.remarks || null
      }, { transaction });

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  async finalizeOrderItems(orderId, user, authorization) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderWithItems(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (![ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED].includes(order.status)) {
        throw new AppError(`Cannot finalize items while order is ${order.status}`, 400);
      }

      const items = order.items || [];
      const pendingCount = items.filter((item) => item.status === "PENDING").length;

      if (pendingCount > 0) {
        throw new AppError(`${pendingCount} item(s) still pending review`, 400);
      }

      const readyItems = items.filter((item) => item.status === "READY");
      const unavailableItems = items.filter((item) => item.status === "NOT_AVAILABLE");

      let refundTotal = 0;

      for (const item of unavailableItems) {
        if (item.reservation_id) {
          await this.requestInventory(
            `/stock-reservations/${item.reservation_id}/release`,
            { method: "PATCH" },
            authorization
          );
        }

        const refundAmount = Number(item.line_total);
        refundTotal += refundAmount;

        await OrderItemRepository.updateItem(item.id, {
          refund_amount: refundAmount,
          refunded_at: new Date()
        }, { transaction });
      }

      const oldStatus = order.status;
      let newStatus;

      if (unavailableItems.length === 0) {
        newStatus = ORDER_STATUS.READY_FOR_ASSIGNMENT;
      } else if (readyItems.length === 0) {
        newStatus = ORDER_STATUS.CANCELLED;
      } else {
        newStatus = ORDER_STATUS.AWAITING_CUSTOMER_CONFIRMATION;
      }

      this.assertTransition(oldStatus, newStatus);

      await OrderRepository.updateOrder(order.id, {
        status: newStatus,
        refunded_amount: Number(order.refunded_amount) + refundTotal
      }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: getUserId(user),
        remarks: unavailableItems.length > 0
          ? `${unavailableItems.length} item(s) unavailable, ₹${refundTotal.toFixed(2)} refunded`
          : "All items ready for delivery"
      }, { transaction });

      await publisher.publish(OrderEvents.ORDER_ITEMS_FINALIZED, {
        orderId: order.id,
        readyItems: readyItems.map((item) => ({ id: item.id, product_name: item.product_name })),
        unavailableItems: unavailableItems.map((item) => ({
          id: item.id,
          product_name: item.product_name,
          remarks: item.admin_remarks
        })),
        refundAmount: refundTotal,
        newStatus
      });

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  async confirmPartialOrder(orderId, decision, user, authorization) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderWithItems(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      this.validateOrderAccess(order, user);

      if (order.status !== ORDER_STATUS.AWAITING_CUSTOMER_CONFIRMATION) {
        throw new AppError(`Order is not awaiting confirmation (current status: ${order.status})`, 400);
      }

      const oldStatus = order.status;
      let newStatus;
      let additionalRefund = 0;

      if (decision === "ACCEPT_PARTIAL") {
        newStatus = ORDER_STATUS.READY_FOR_ASSIGNMENT;
      } else {
        const readyItems = (order.items || []).filter((item) => item.status === "READY");

        for (const item of readyItems) {
          if (item.reservation_id) {
            await this.requestInventory(
              `/stock-reservations/${item.reservation_id}/release`,
              { method: "PATCH" },
              authorization
            );
          }

          const refundAmount = Number(item.line_total);
          additionalRefund += refundAmount;

          await OrderItemRepository.updateItem(item.id, {
            refund_amount: refundAmount,
            refunded_at: new Date()
          }, { transaction });
        }

        newStatus = ORDER_STATUS.CANCELLED;
      }

      this.assertTransition(oldStatus, newStatus);

      await OrderRepository.updateOrder(order.id, {
        status: newStatus,
        refunded_amount: Number(order.refunded_amount) + additionalRefund
      }, { transaction });

      await OrderStatusHistoryRepository.createStatusHistory({
        order_id: order.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: getUserId(user),
        remarks: decision === "ACCEPT_PARTIAL"
          ? "Customer accepted partial order"
          : "Customer cancelled remaining items"
      }, { transaction });

      return await this.getOrderDetails(order.id, user, { transaction });
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

    this.assertTransition(existingOrder.status, ORDER_STATUS.PLACED);

    await this.confirmReservations(orderId, authorization);

    const details = await db.sequelize.transaction(async (transaction) => {
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

    await this.publishPaymentEvent(PaymentEvents.PAYMENT_CHARGED, {
      orderId,
      amount: details.total_amount,
      transactionId: details.latest_payment?.transaction_id
    });

    return details;
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

    this.assertTransition(existingOrder.status, ORDER_STATUS.PAYMENT_FAILED);

    await this.releaseReservations(orderId, authorization, "release");

    const details = await db.sequelize.transaction(async (transaction) => {
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

    await this.publishPaymentEvent(PaymentEvents.PAYMENT_FAILED, {
      orderId,
      reason: data.remarks || data.reason || "unknown"
    });

    return details;
  }

  async refundPayment(orderId, data, user) {
    const db = await initializeModels();

    const { details, transactionId } = await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const payment = await PaymentRepository.getSuccessfulPayment(orderId, { transaction });

      if (!payment) {
        throw new AppError("Successful payment not found for refund", 404);
      }

      // COD was never charged through a gateway — nothing to refund there,
      // just flip the DB flags (an offline/cash refund happens outside this system).
      const gatewayRefund = payment.payment_method !== "COD" && payment.transaction_id
        ? await paymentGateway.refund({ transactionId: payment.transaction_id, amount: data.amount || payment.amount })
        : null;

      const nextGatewayResponse = gatewayRefund
        ? { ...(typeof data.gateway_response === "object" ? data.gateway_response : {}), refund: gatewayRefund }
        : data.gateway_response;

      await PaymentRepository.updatePayment(payment.id, {
        status: PAYMENT_STATUS.REFUNDED,
        gateway_response: this.mergeGatewayResponse(payment.gateway_response, nextGatewayResponse)
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

      return {
        details: await this.getOrderDetails(order.id, user, { transaction }),
        transactionId: payment.transaction_id
      };
    });

    await this.publishPaymentEvent(PaymentEvents.PAYMENT_REFUNDED, {
      orderId,
      transactionId
    });

    return details;
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

        this.assertTransition(order.status, ORDER_STATUS.PAYMENT_EXPIRED);

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

  async retryPayment(orderId, data, user, authorization) {
    const order = await OrderRepository.getOrderWithItems(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    this.validateOrderAccess(order, user);
    this.assertTransition(order.status, ORDER_STATUS.PENDING_PAYMENT);

    const latestPayment = await PaymentRepository.findOne(
      { order_id: orderId },
      { order: [["created_at", "DESC"]] }
    );
    const paymentMethod = data.payment_method || latestPayment?.payment_method || "COD";

    const db = await initializeModels();
    const reservationIds = [];

    try {
      return await db.sequelize.transaction(async (transaction) => {
        const freshOrder = await OrderRepository.getOrderById(orderId, { transaction });
        const oldStatus = freshOrder.status;

        this.assertTransition(oldStatus, ORDER_STATUS.PENDING_PAYMENT);

        const items = await OrderItemRepository.getItemsByOrderId(orderId, { transaction });

        await OrderRepository.updateOrder(freshOrder.id, {
          status: ORDER_STATUS.PENDING_PAYMENT,
          payment_status: PAYMENT_STATUS.PENDING
        }, { transaction });

        await OrderStatusHistoryRepository.createStatusHistory({
          order_id: freshOrder.id,
          old_status: oldStatus,
          new_status: ORDER_STATUS.PENDING_PAYMENT,
          changed_by: getUserId(user),
          remarks: data.remarks || "Payment retry initiated"
        }, { transaction });

        const payment = await PaymentRepository.createPayment({
          order_id: freshOrder.id,
          payment_method: paymentMethod,
          amount: freshOrder.total_amount,
          status: PAYMENT_STATUS.PENDING,
          paid_at: null,
          gateway_response: null
        }, { transaction });

        for (const item of items) {
          const reservation = await this.createReservation(
            freshOrder.id,
            item.variant_id,
            data.warehouse_id,
            item.quantity,
            authorization
          );

          if (reservation?.id) {
            reservationIds.push(reservation.id);
            await OrderItemRepository.updateItem(item.id, { reservation_id: reservation.id }, { transaction });
          }
        }

        const gatewaySession = await paymentGateway.createPaymentSession({
          orderId: freshOrder.id,
          orderNumber: freshOrder.order_number,
          amount: freshOrder.total_amount,
          paymentMethod
        });

        await PaymentRepository.updatePayment(payment.id, {
          gateway_response: JSON.stringify({
            reservation_ids: reservationIds,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            provider_session_id: gatewaySession.providerSessionId,
            checkout_url: gatewaySession.checkoutUrl
          })
        }, { transaction });

        const details = await this.getOrderDetails(freshOrder.id, user, { transaction });

        return {
          order: details,
          payment_session: {
            order_id: freshOrder.id,
            order_number: freshOrder.order_number,
            payment_id: payment.id,
            amount: freshOrder.total_amount,
            status: payment.status,
            expires_in_minutes: 15,
            checkout_url: gatewaySession.checkoutUrl,
            provider_session_id: gatewaySession.providerSessionId
          }
        };
      });
    } catch (error) {
      await this.compensateReservations(reservationIds, authorization);
      throw error;
    }
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
    const response = await fetch(`${env.API_GATEWAY_URL}/product-variant/variants/${variantId}`);

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
    const response = await fetch(`${env.API_GATEWAY_URL}${path}`, {
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

 async createReservation(orderId, variantId, warehouseId, quantity, authorization) {
  const inventoryResponse = await fetch(
    `${env.API_GATEWAY_URL}/stock-reservations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        order_id: orderId,
        variant_id: variantId,
        warehouse_id: warehouseId,
        quantity,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
    }
  );

  const inventory = await inventoryResponse.json();

  logger.debug("Inventory response", { inventory });

  if (!inventoryResponse.ok) {
    throw new AppError(
      inventory.message || "Inventory reservation failed",
      inventoryResponse.status
    );
  }

  if (!inventory.success) {
    throw new AppError(
      inventory.message || "Inventory reservation failed",
      400
    );
  }

  return inventory.data.stockReservation;
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
        logger.error(`Failed to release reservation ${reservationId}:`, error.message);
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
