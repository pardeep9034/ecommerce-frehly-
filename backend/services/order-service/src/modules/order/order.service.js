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
import OrderReturnRepository from "../repository/orderReturn.repository.js";
import {publisher} from "../../messaging/index.js"
import OrderEvents from "../../messaging/events/order.events.js";
import PaymentEvents from "../../messaging/events/payment.events.js";
import { paymentGateway } from "../../payment/index.js";
import logger from "../../utils/Logger.js";
import { getOrderRules } from "../../utils/orderRules.js";
import { getStaffName } from "../../utils/staffNames.js";
import { deliveryCode } from "../../utils/deliveryCode.js";

const STATS_CACHE = new Map();
const STATS_TTL_MS = 30 * 1000;

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
  RETURNED_TO_STORE: "RETURNED_TO_STORE",
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
  // Back to PICKED_UP when the handover is declined or withdrawn: the first partner still holds the order.
  [ORDER_STATUS.HANDOVER_IN_PROGRESS]: [ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERY_FAILED],
  // A partner on the way can still fail the drop (customer unreachable); the failed-delivery screen starts here.
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERY_FAILED],
  // Another try with the same partner (delivery-service caps it at 3 failed attempts), or the goods go back to the
  // store (RETURNED_TO_STORE comes from delivery-service after the store checks the rider's return code).
  [ORDER_STATUS.DELIVERY_FAILED]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.RETURNED_TO_STORE],
  // Back at the store: send it out again with any rider, or cancel it (cancelOrder inspects and refunds).
  [ORDER_STATUS.RETURNED_TO_STORE]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED],
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

// The customer sees the delivery code while the order is on its way.
const IN_TRANSIT_STATUSES = new Set([
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.HANDOVER_IN_PROGRESS
]);

const RETURN_STATUS = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_TRANSIT: "IN_TRANSIT",
  RECEIVED: "RECEIVED",
  CLOSED: "CLOSED"
};

// A customer can ask for a return until 24 h after delivery; these reasons need their photo.
const CUSTOMER_RETURN_WINDOW_MS = 24 * 60 * 60 * 1000;
const PHOTO_REASONS = new Set(["DAMAGED", "BAD_QUALITY", "WRONG_ITEM"]);

// JPEG or PNG by the file's first bytes, else null.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const imageMime = (bytes) =>
  bytes.length > 8 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg"
    : bytes.length > 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE) ? "image/png"
      : null;

// Door QRs outlive the rider's on-screen timeout (Razorpay wants close_by some minutes ahead); Retry / Switch to
// cash close them early.
const DOOR_QR_LIFETIME_MS = 16 * 60 * 1000;

const round2 = (value) => Math.round(Number(value) * 100) / 100;

// A line's price per unit: line_total is what was charged for the whole quantity.
const unitPrice = (item) => Number(item.line_total) / Number(item.quantity);

const getUserId = (user, fallback) => {
  if (typeof user === "number") {
    return user;
  }

  return  user?.user_id || fallback;
};

// Inventory calls: inventory-service lets staff tokens or this service's internal key through, not a customer's token.
const getAuthHeader = (authorization) => ({
  ...(authorization ? { Authorization: authorization } : {}),
  ...(env.INTERNAL_API_KEY ? { "x-internal-key": env.INTERNAL_API_KEY } : {}),
});

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

// Which warehouse delivers to this address, asked of delivery-service. Never trust the client's x-warehouse-id for this.
const getServiceArea = async (address) => {
  const params = new URLSearchParams();
  if (/^\d{6}$/.test(String(address.postal_code ?? "").trim())) params.set("pincode", String(address.postal_code).trim());
  if (address.latitude != null && address.longitude != null) {
    params.set("lat", address.latitude);
    params.set("lng", address.longitude);
  }
  if (!params.size) return { serviceable: false };

  const response = await fetch(`${env.API_GATEWAY_URL}/delivery-zones/serviceability?${params}`);
  if (!response.ok) {
    throw new AppError("Could not check delivery for this address", 502);
  }
  return (await response.json()).data;
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

    // The cart was priced and stock-checked against x-warehouse-id; the order must go to the warehouse that serves
    // the address. A mismatch means the customer changed location without switching store.
    const serviceArea = await getServiceArea(userAddress.data);
    if (!serviceArea.serviceable) {
      throw new AppError("We don't deliver to this address yet", 422);
    }
    if (data.warehouse_id && Number(data.warehouse_id) !== serviceArea.warehouse_id) {
      throw new AppError("This address is served by another store. Switch your location to this address and check your cart again.", 409);
    }
    data = { ...data, warehouse_id: serviceArea.warehouse_id };

    const paymentMethod = data.payment_method || "COD";
    const isCOD = paymentMethod === "COD";
    const { paymentWindow } = await getOrderRules();
    const expiresAt = new Date(Date.now() + paymentWindow * 60 * 1000);

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
          idempotency_key: idempotencyKey,
          warehouse_id: data.warehouse_id ? Number(data.warehouse_id) : null
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

        await this.recordStatusChange(order, {
          old_status: null,
          new_status: order.status,
          changed_by: userId,
          remarks: isCOD ? "Order placed with Cash on Delivery" : "Order created and awaiting payment"
        }, transaction);

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
            authorization,
            expiresAt
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
            ...(isCOD ? {} : { expires_at: expiresAt.toISOString() }),
            ...(gatewaySession ? { provider_session_id: gatewaySession.providerSessionId, checkout_url: gatewaySession.checkoutUrl } : {})
          })
        }, { transaction });
        // After commit only, and not awaited: a broker outage must not fail checkout, and a
        // rollback must not leave an order.created (cart-service clears the cart on it).
        transaction.afterCommit(() => {
          void this.publishEvent(OrderEvents.ORDER_CREATED, { ...orderData, items: snapshotItems });
        });

        // COD orders start at PLACED with no payment webhook, so confirm the
        // reservations here. Nothing else happens by itself: the order stays
        // PLACED until staff review the items and finalize them.
        if (isCOD) {
          await this.confirmReservations(order.id, authorization);
        }

        const details = await this.getOrderDetails(order.id, user, { transaction });

        return {
          order: details,
          payment_session: {
            order_id: order.id,
            order_number: order.order_number,
            payment_id: payment.id,
            amount: totals.total_amount,
            status: payment.status,
            expires_in_minutes: isCOD ? null : paymentWindow,
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
    const { paymentWindow } = await getOrderRules();

    return {
      order: details,
      payment_session: {
        order_id: details.id,
        order_number: details.order_number,
        payment_id: latestPayment?.id || null,
        amount: details.total_amount,
        status: latestPayment?.status || details.payment_status,
        expires_in_minutes: details.payment_status === PAYMENT_STATUS.SUCCESS ? null : paymentWindow,
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

  // Every status change goes through here: the history row, then order.status.changed after commit (the customer's
  // texts hang off it). A row that keeps the status (a refund) is history only, unless it is a step of a customer's
  // return: `returnUpdate` { step, amount?, storePhone? } is what they (and on a new one, the store) are texted.
  async recordStatusChange(order, change, transaction, returnUpdate = null) {
    const history = await OrderStatusHistoryRepository.createStatusHistory({ order_id: order.id, ...change }, { transaction });
    if (change.old_status !== change.new_status || returnUpdate) {
      const data = {
        historyId: history.id,
        orderId: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        warehouseId: order.warehouse_id,
        oldStatus: change.old_status,
        newStatus: change.new_status,
        changedBy: change.changed_by ?? null,
        totalAmount: order.total_amount,
        ...(returnUpdate ? { returnStep: returnUpdate.step, returnAmount: returnUpdate.amount ?? null, storePhone: returnUpdate.storePhone ?? null } : {}),
      };
      transaction.afterCommit(() => {
        void this.publishEvent(OrderEvents.ORDER_STATUS_CHANGED, data);
      });
    }
    return history;
  }

  // Never throws. The log names the order only: payloads carry items and amounts.
  async publishEvent(event, payload) {
    try {
      await publisher.publish(event, payload);
    } catch (error) {
      logger.error(`Failed to publish ${event.routingKey}`, { error: error.message, orderId: payload.orderId ?? payload.id });
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

    // Pay at the door: the order is out for delivery, not waiting on checkout.
    if (event.type === "door_qr.credited") {
      await this.recordDoorUpi(order.id, { qrId: event.qrCodeId, paymentId: event.transactionId, amount: event.amount });
      return await this.getOrderDetails(order.id, null);
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
      // only an ACTIVE variant of an ACTIVE product can be ordered
      if (variant?.status !== "ACTIVE" || product.status !== "ACTIVE") {
        throw new AppError(`${product.name || item.product_name || "An item"} is no longer on sale; remove it from your cart`, 409);
      }
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

  async getAllOrders(query = {}, user) {
    // Store managers and staff only ever list their own store's orders, whatever warehouse_id they send.
    const staffStore = this.ownWarehouse(user);
    if (staffStore) query = { ...query, warehouse_id: staffStore };

    const page = Number.parseInt(query.page, 10) || 1;
    const limit = Number.parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // One warehouse at a time: listing every warehouse's orders in one call is slow and not useful.
    // Exception: one customer's orders (user_id) are few, so they may span warehouses.
    const hasWarehouse = query.warehouse_id !== undefined && query.warehouse_id !== "";
    const warehouseId = hasWarehouse ? Number.parseInt(query.warehouse_id, 10) : null;
    if (hasWarehouse && (!Number.isInteger(warehouseId) || warehouseId <= 0)) {
      throw new AppError("warehouse_id must be a positive number", 400);
    }
    const hasUser = query.user_id !== undefined && query.user_id !== "";
    const userId = hasUser ? Number(query.user_id) : null;
    if (hasUser && (!Number.isInteger(userId) || userId <= 0)) {
      throw new AppError("user_id must be a positive number", 400);
    }
    if (!warehouseId && !userId) {
      throw new AppError("warehouse_id is required", 400);
    }
    const where = {};
    if (warehouseId) where.warehouse_id = warehouseId;
    if (userId) where.user_id = userId;

    // `status` may be one value, a comma list ("A,B") or repeated/array (status[]=A&status[]=B) → IN (...)
    const statuses = [query.status].flat().flatMap((value) => String(value ?? "").split(",")).map((value) => value.trim()).filter(Boolean);
    if (statuses.length) {
      where.status = statuses.length === 1 ? statuses[0] : statuses;
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

  // Dashboard numbers: today's orders/revenue, per-day series, counts by status, cancel rate, avg delivery time.
  // Cached 30 s per (warehouse, days, tz) so many admins refreshing don't repeat the same aggregate.
  // A store manager gets their own store's numbers whatever warehouse_id they send (none would mean all stores).
  async getOrderStats(query = {}, user) {
    const ownStore = this.ownWarehouse(user);
    if (ownStore) query = { ...query, warehouse_id: ownStore };
    const warehouseId = query.warehouse_id ? Number.parseInt(query.warehouse_id, 10) : null;
    if (query.warehouse_id && (!Number.isInteger(warehouseId) || warehouseId <= 0)) {
      throw new AppError("warehouse_id must be a positive number", 400);
    }
    const days = Math.min(Math.max(Number.parseInt(query.days, 10) || 7, 1), 90);
    const tz = String(query.tz || "Asia/Kolkata");
    if (!/^[A-Za-z0-9_+-/]{1,40}$/.test(tz)) {
      throw new AppError("Invalid tz", 400);
    }

    const cacheKey = `${warehouseId ?? "all"}|${days}|${tz}`;
    const hit = STATS_CACHE.get(cacheKey);
    if (hit && Date.now() - hit.at < STATS_TTL_MS) return hit.data;

    let raw;
    try {
      raw = await OrderRepository.getStats({ warehouseId, days, tz });
    } catch (error) {
      if (/time zone/i.test(error.message)) throw new AppError("Invalid tz", 400);
      throw error;
    }

    const Order = await OrderRepository.getModel();
    const byStatus = Object.fromEntries(Order.getAttributes().status.values.map((status) => [status, 0]));
    raw.byStatus.forEach((row) => {
      byStatus[row.status] = row.count;
    });

    const perDay = raw.perDay.map((row) => ({ ...row, orders: Number(row.orders), cancelled: Number(row.cancelled), revenue: Number(row.revenue) }));
    const totalOrders = perDay.reduce((sum, row) => sum + row.orders, 0);
    const totalCancelled = perDay.reduce((sum, row) => sum + row.cancelled, 0);
    const today = perDay[perDay.length - 1] || { orders: 0, cancelled: 0, revenue: 0 };

    const data = {
      warehouse_id: warehouseId,
      days,
      tz,
      today: { orders: today.orders, cancelled: today.cancelled, revenue: today.revenue },
      byStatus,
      perDay,
      cancelRate: totalOrders ? Math.round((totalCancelled / totalOrders) * 1000) / 10 : null, // % over the window
      avgDeliveryMinutes: raw.avgDeliveryMinutes,
      avgPackMinutesToday: raw.avgPackMinutesToday
    };

    if (STATS_CACHE.size >= 100) STATS_CACHE.clear(); // tiny cache: keep it bounded
    STATS_CACHE.set(cacheKey, { at: Date.now(), data });
    return data;
  }

  // Order count / spend / recent orders for the given customers (the ids on the Customers page),
  // plus store-wide figures for its stat cards. `user_ids` is a comma list, max 100. A store manager's figures count
  // only their own store's orders.
  async getCustomerStats(query = {}, user) {
    const warehouseId = this.ownWarehouse(user);
    const userIds = String(query.user_ids ?? "").split(",").map((value) => value.trim()).filter(Boolean).map(Number);
    if (userIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new AppError("user_ids must be a comma list of positive numbers", 400);
    }
    if (userIds.length > 100) {
      throw new AppError("user_ids can have at most 100 ids", 400);
    }
    const tz = String(query.tz || "Asia/Kolkata");
    if (!/^[A-Za-z0-9_+-/]{1,40}$/.test(tz)) {
      throw new AppError("Invalid tz", 400);
    }

    let raw;
    try {
      raw = await OrderRepository.getCustomerStats({ userIds, tz, warehouseId });
    } catch (error) {
      if (/time zone/i.test(error.message)) throw new AppError("Invalid tz", 400);
      throw error;
    }

    const customers = Object.fromEntries(
      userIds.map((id) => [id, { user_id: id, orders: 0, spent: 0, last_order_at: null, recent_orders: [] }])
    );
    raw.perUser.forEach((row) => {
      Object.assign(customers[Number(row.user_id)], { orders: row.orders, spent: row.spent, last_order_at: row.last_order_at });
    });
    raw.recent.forEach((row) => {
      customers[Number(row.user_id)].recent_orders.push({ id: Number(row.id), total: row.total, date: row.date });
    });

    return { customers: Object.values(customers), summary: raw.summary };
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

    // Who picked the order is for staff only. The name is looked up on request (options.withStaffNames): it is an
    // extra call to auth-service, so the many internal calls that only need the order skip it.
    if (!this.isStaffUser(user)) {
      delete orderJson.picked_by;
    } else if (options.withStaffNames && orderJson.picked_by) {
      orderJson.picked_by_name = await getStaffName(orderJson.picked_by);
    }

    // Why a return was rejected is for staff: the customer is only told it doesn't meet the return terms.
    orderJson.returns = [...(orderJson.returns || [])]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map(({ reject_reason, ...row }) => (this.isStaffUser(user) ? { ...row, reject_reason } : row));
    // Only the customer gets the delivery code (the rider asks them for it); staff and internal callers never do.
    if (user && !this.isStaffUser(user) && IN_TRANSIT_STATUSES.has(orderJson.status)) {
      orderJson.delivery_code = deliveryCode(orderJson.id);
    }

    return orderJson;
  }

  // SYSTEM is the short-lived internal token other services mint (delivery-service reads items and moves the status with it).
  isStaffUser(user) {
    const role = user?.role || user?.user_role;
    return ["ADMIN", "SUPER_ADMIN", "SUPPORT", "SYSTEM", "OPS_STAFF"].includes(String(role || "").toUpperCase());
  }

  // Store staff (OPS_STAFF) work in one store: the warehouse_id auth-service puts in their token.
  // Returns that store's id, or null for every other role.
  staffWarehouse(user) {
    if (user?.role !== "OPS_STAFF") return null;
    const warehouseId = Number(user.warehouse_id);
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
      throw new AppError("No store is assigned to this account", 403);
    }
    return warehouseId;
  }

  // What a caller may read or act on: store managers (ADMIN) and store staff (OPS_STAFF) see only their own store
  // (Task 193); null for everyone else (super admin, support, system). staffWarehouse stays OPS_STAFF only: it also
  // means "limited to store-staff actions" in updateOrderStatus.
  ownWarehouse(user) {
    if (user?.role !== "ADMIN" && user?.role !== "OPS_STAFF") return null;
    const warehouseId = Number(user.warehouse_id);
    if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
      throw new AppError("No store is assigned to this account", 403);
    }
    return warehouseId;
  }

  validateOrderAccess(order, user) {
    const staffStore = this.ownWarehouse(user);
    if (staffStore) {
      if (Number(order.warehouse_id) !== staffStore) {
        throw new AppError("You do not have access to this order", 403);
      }
      return;
    }

    const userId = getUserId(user);
    const isAdmin = this.isStaffUser(user);

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

      // Store staff only reach this through delivery-service: assigning a rider, or calling off a rider-to-rider handover
      // (back to PICKED_UP). The store's own hand-over (ASSIGNED -> PICKED_UP) comes as SYSTEM after the pickup code check.
      const staffMove = data.status === ORDER_STATUS.ASSIGNED
        || (data.status === ORDER_STATUS.PICKED_UP && order.status === ORDER_STATUS.HANDOVER_IN_PROGRESS);
      if (this.staffWarehouse(user) && !staffMove) {
        throw new AppError("Store staff can only assign a rider here; hand over with the rider's pickup code", 403);
      }
      this.validateOrderAccess(order, user);

      this.assertTransition(order.status, data.status);
      const oldStatus = order.status;

      await OrderRepository.updateOrder(order.id, {
        status: data.status,
        placed_at: data.status === ORDER_STATUS.PLACED ? new Date() : order.placed_at
      }, { transaction });

      // changed_by is a BIGINT: a SYSTEM caller's user_id is the text "system", so it is recorded as no one.
      const actorId = Number(getUserId(user));
      await this.recordStatusChange(order, {
        old_status: oldStatus,
        new_status: data.status,
        changed_by: data.changed_by || (Number.isInteger(actorId) ? actorId : null),
        remarks: data.remarks || null
      }, transaction);

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

      // Before restoreInventory below: that HTTP call isn't undone by the transaction rollback.
      this.validateOrderAccess(order, user);

      if (order.status === ORDER_STATUS.RETURNED_TO_STORE) {
        return {
          order: await this.cancelReturnedOrder(order, data, user, authorization, transaction),
          manual_inventory_review: false
        };
      }

      const allowedStatuses = role === "ADMIN" ? ADMIN_CANCEL_STATUSES : CUSTOMER_CANCEL_STATUSES;
      if (!allowedStatuses.has(order.status)) {
        throw new AppError(`${role} cannot cancel order from ${order.status} status`, 400);
      }

      const previousStatus = order.status;

      await OrderRepository.updateOrder(order.id, { status: ORDER_STATUS.CANCELLED }, { transaction });

      await this.recordStatusChange(order, {
        old_status: previousStatus,
        new_status: ORDER_STATUS.CANCELLED,
        changed_by: data.changed_by || getUserId(user),
        remarks: data.reason
      }, transaction);

      let manualInventoryReview = false;

      if ([ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED].includes(previousStatus)) {
        await this.restoreInventory(order.items || [], order.warehouse_id, data.reason, data.changed_by || getUserId(user), authorization);
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

      this.validateOrderAccess(order, user);

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

  // Store staff record the bags and the rack a packed order waits on; packed_at marks it ready for a rider.
  // Packing again just overwrites them (a miscount gets fixed by packing again).
  async packOrder(orderId, data, user) {
    const order = await OrderRepository.getOrderById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    this.validateOrderAccess(order, user);

    if (order.status !== ORDER_STATUS.READY_FOR_ASSIGNMENT) {
      throw new AppError(`Cannot pack an order that is ${order.status}`, 400);
    }

    await OrderRepository.updateOrder(order.id, {
      packed_at: new Date(),
      bag_count: data.bag_count,
      rack_label: data.rack_label || null
    });

    return await this.getOrderDetails(order.id, user);
  }

  async finalizeOrderItems(orderId, user, authorization) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderWithItems(orderId, { transaction });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // Before finalizeReviewedItems: it releases stock reservations over HTTP, which a rollback can't undo.
      this.validateOrderAccess(order, user);

      if (![ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED].includes(order.status)) {
        throw new AppError(`Cannot finalize items while order is ${order.status}`, 400);
      }

      const items = order.items || [];
      const pendingCount = items.filter((item) => item.status === "PENDING").length;

      if (pendingCount > 0) {
        throw new AppError(`${pendingCount} item(s) still pending review`, 400);
      }

      return await this.finalizeReviewedItems(order, transaction, user, authorization);
    });
  }

  // Staff finalize an order whose items they have all reviewed (READY or
  // NOT_AVAILABLE): the order-level transition + refund bookkeeping that
  // follows. The staff member is recorded as who picked the order.
  async finalizeReviewedItems(order, transaction, user, authorization) {
    const items = order.items || [];
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

    // picked_by is a BIGINT: a SYSTEM caller's user_id is the text "system", so it is recorded as no one.
    const pickerId = Number(getUserId(user));
    await OrderRepository.updateOrder(order.id, {
      status: newStatus,
      refunded_amount: Number(order.refunded_amount) + refundTotal,
      picked_by: Number.isInteger(pickerId) ? pickerId : null
    }, { transaction });

    await this.recordStatusChange(order, {
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: getUserId(user),
      remarks: unavailableItems.length > 0
        ? `${unavailableItems.length} item(s) unavailable, ₹${refundTotal.toFixed(2)} refunded`
        : "All items ready for delivery"
    }, transaction);

    const finalized = {
      orderId: order.id,
      readyItems: readyItems.map((item) => ({ id: item.id, product_name: item.product_name })),
      unavailableItems: unavailableItems.map((item) => ({
        id: item.id,
        product_name: item.product_name,
        remarks: item.admin_remarks
      })),
      refundAmount: refundTotal,
      newStatus
    };
    transaction.afterCommit(() => {
      void this.publishEvent(OrderEvents.ORDER_ITEMS_FINALIZED, finalized);
    });

    return await this.getOrderDetails(order.id, user, { transaction });
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

      await this.recordStatusChange(order, {
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: getUserId(user),
        remarks: decision === "ACCEPT_PARTIAL"
          ? "Customer accepted partial order"
          : "Customer cancelled remaining items"
      }, transaction);

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

      await this.recordStatusChange(order, {
        old_status: oldStatus,
        new_status: ORDER_STATUS.PLACED,
        changed_by: null,
        remarks: data.remarks || "Payment successful"
      }, transaction);

      return await this.getOrderDetails(order.id, null, { transaction });
    });

    await this.publishEvent(PaymentEvents.PAYMENT_CHARGED, {
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

      await this.recordStatusChange(order, {
        old_status: oldStatus,
        new_status: ORDER_STATUS.PAYMENT_FAILED,
        changed_by: null,
        remarks: data.remarks || "Payment failed"
      }, transaction);

      return await this.getOrderDetails(order.id, null, { transaction });
    });

    await this.publishEvent(PaymentEvents.PAYMENT_FAILED, {
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

      await this.recordStatusChange(order, {
        old_status: order.status,
        new_status: order.status,
        changed_by: getUserId(user),
        remarks: data.remarks || "Payment refunded"
      }, transaction);

      return {
        details: await this.getOrderDetails(order.id, user, { transaction }),
        transactionId: payment.transaction_id
      };
    });

    await this.publishEvent(PaymentEvents.PAYMENT_REFUNDED, {
      orderId,
      transactionId
    });

    return details;
  }

  async expirePendingPayments(authorization) {
    const db = await initializeModels();
    // ponytail: uses today's window, so a changed window also applies to orders already waiting; read
    // gateway_response.expires_at per order if that ever matters.
    const { paymentWindow } = await getOrderRules();
    const expiryTime = new Date(Date.now() - paymentWindow * 60 * 1000);
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

        await this.recordStatusChange(order, {
          old_status: ORDER_STATUS.PENDING_PAYMENT,
          new_status: ORDER_STATUS.PAYMENT_EXPIRED,
          changed_by: null,
          remarks: "Payment reservation expired"
        }, transaction);
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
    const { paymentWindow } = await getOrderRules();
    const expiresAt = new Date(Date.now() + paymentWindow * 60 * 1000);

    const db = await initializeModels();
    const reservationIds = [];

    try {
      return await db.sequelize.transaction(async (transaction) => {
        const freshOrder = await OrderRepository.getOrderById(orderId, { transaction });
        const oldStatus = freshOrder.status;

        this.assertTransition(oldStatus, ORDER_STATUS.PENDING_PAYMENT);

        const items = await OrderItemRepository.getItemsByOrderId(orderId, { transaction });
        // The order's warehouse was checked against its address at checkout; the header only fills in old orders
        // saved without one.
        const warehouseId = freshOrder.warehouse_id ?? (data.warehouse_id ? Number(data.warehouse_id) : null);

        await OrderRepository.updateOrder(freshOrder.id, {
          status: ORDER_STATUS.PENDING_PAYMENT,
          payment_status: PAYMENT_STATUS.PENDING,
          ...(warehouseId ? { warehouse_id: warehouseId } : {}) // retry re-reserves stock here
        }, { transaction });

        await this.recordStatusChange(freshOrder, {
          old_status: oldStatus,
          new_status: ORDER_STATUS.PENDING_PAYMENT,
          changed_by: getUserId(user),
          remarks: data.remarks || "Payment retry initiated"
        }, transaction);

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
            warehouseId,
            item.quantity,
            authorization,
            expiresAt
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
            expires_at: expiresAt.toISOString(),
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
            expires_in_minutes: paymentWindow,
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

  // ---- At the door (delivery-service calls these as SYSTEM for the rider) ----

  // Items the customer turned away at the door: each on the order and in the bag (not NOT_AVAILABLE), at most its
  // quantity, and not everything (that is a failed delivery, REFUSED, not a delivery).
  checkRejections(items, rejected = []) {
    const inBag = new Map(items.filter((item) => item.status !== "NOT_AVAILABLE").map((item) => [Number(item.id), item]));
    const seen = new Set();

    const lines = rejected.map((entry) => {
      const id = Number(entry.order_item_id);
      const item = inBag.get(id);
      if (!item) {
        throw new AppError(`Item ${entry.order_item_id} is not in this delivery`, 400);
      }
      if (seen.has(id)) {
        throw new AppError(`${item.product_name} is listed twice`, 400);
      }
      seen.add(id);
      if (entry.quantity > Number(item.quantity)) {
        throw new AppError(`Only ${Number(item.quantity)} of ${item.product_name} were sent`, 400);
      }
      return { item, quantity: entry.quantity, reason: entry.reason, note: entry.note || null };
    });

    const sent = [...inBag.values()].reduce((sum, item) => sum + Number(item.quantity), 0);
    const turnedAway = lines.reduce((sum, line) => sum + line.quantity, 0);
    if (sent > 0 && turnedAway >= sent) {
      throw new AppError("Every item was turned away: mark the delivery as failed (refused) instead", 400);
    }

    return lines;
  }

  // What the rider collects on a pay-on-delivery order: the total less earlier refunds (unavailable items) and the
  // items turned away at the door.
  doorAmountDue(order, rejectedLines) {
    const turnedAway = rejectedLines.reduce((sum, line) => sum + unitPrice(line.item) * line.quantity, 0);
    return Math.max(0, round2(Number(order.total_amount) - Number(order.refunded_amount) - turnedAway));
  }

  // The current door QR, kept on the COD payment row's gateway_response: { id, amount, image_url, closed_at }.
  readDoorQr(payment) {
    if (!payment?.gateway_response) return null;
    try {
      return JSON.parse(payment.gateway_response).door_qr || null;
    } catch {
      return null;
    }
  }

  doorPaymentView(order, doorQr) {
    const paid = order.collected_method === "UPI";
    return {
      paid,
      amount: paid ? Number(order.collected_amount) : (doorQr ? Number(doorQr.amount) : null),
      qr: !paid && doorQr && !doorQr.closed_at ? { id: doorQr.id, image_url: doorQr.image_url, amount: Number(doorQr.amount) } : null
    };
  }

  // Loads what every door-payment call needs, and refuses an order that isn't paid at the door or isn't at the door.
  async loadDoorOrder(orderId, transaction) {
    const order = await OrderRepository.getOrderById(orderId, { transaction });
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    const payment = await PaymentRepository.getSuccessfulPayment(order.id, { transaction });
    if (!payment || (payment.payment_method !== "COD" && order.collected_method !== "UPI")) {
      throw new AppError("This order was paid online; there is nothing to collect", 400);
    }
    return { order, payment };
  }

  // Rider shows the customer a QR for what is due (the items turned away so far are left out). Also Retry: the
  // previous QR is closed first, and if it turns out to have been paid meanwhile, that payment is kept instead.
  async createDoorQr(orderId, data) {
    const { order, payment } = await this.loadDoorOrder(orderId);
    if (order.status !== ORDER_STATUS.OUT_FOR_DELIVERY) {
      throw new AppError(`A QR can only be shown at the door (order is ${order.status})`, 400);
    }
    if (order.collected_method === "UPI") {
      return this.doorPaymentView(order, null);
    }

    const items = await OrderItemRepository.getItemsByOrderId(order.id);
    const amount = this.doorAmountDue(order, this.checkRejections(items, data.rejected_items));
    if (amount <= 0) {
      throw new AppError("Nothing is due on this order", 400);
    }

    const previous = this.readDoorQr(payment);
    if (previous && !previous.closed_at) {
      await paymentGateway.closeDoorQr(previous.id);
      if (await this.syncDoorQr(order.id, previous)) {
        return this.doorPaymentView(await OrderRepository.getOrderById(order.id), null);
      }
    }

    const qr = await paymentGateway.createDoorQr({
      orderId: order.id,
      orderNumber: order.order_number,
      amount,
      closeBy: new Date(Date.now() + DOOR_QR_LIFETIME_MS)
    });
    const doorQr = { id: qr.qrId, amount, image_url: qr.imageUrl, created_at: new Date().toISOString(), closed_at: null };
    await PaymentRepository.updatePayment(payment.id, {
      gateway_response: this.mergeGatewayResponse(payment.gateway_response, { door_qr: doorQr })
    });
    logger.info("order.door_qr.created", { orderId: order.id, qrId: qr.qrId, amount });

    return this.doorPaymentView(order, doorQr);
  }

  // The rider app polls this while the QR is up. Asks the gateway too, so a missed webhook doesn't strand the rider.
  async getDoorPayment(orderId) {
    const { order, payment } = await this.loadDoorOrder(orderId);
    const doorQr = this.readDoorQr(payment);
    if (order.collected_method !== "UPI" && doorQr && !doorQr.closed_at && await this.syncDoorQr(order.id, doorQr)) {
      return this.doorPaymentView(await OrderRepository.getOrderById(order.id), doorQr);
    }
    return this.doorPaymentView(order, doorQr);
  }

  // Switch to cash: stop the QR taking payments, then look once more, so a payment that landed just now isn't missed.
  async closeDoorQr(orderId) {
    const { order, payment } = await this.loadDoorOrder(orderId);
    const doorQr = this.readDoorQr(payment);
    if (order.collected_method === "UPI" || !doorQr || doorQr.closed_at) {
      return this.doorPaymentView(order, doorQr);
    }

    await paymentGateway.closeDoorQr(doorQr.id);
    if (await this.syncDoorQr(order.id, doorQr)) {
      return this.doorPaymentView(await OrderRepository.getOrderById(order.id), doorQr);
    }

    const closed = { ...doorQr, closed_at: new Date().toISOString() };
    await PaymentRepository.updatePayment(payment.id, {
      gateway_response: this.mergeGatewayResponse(payment.gateway_response, { door_qr: closed })
    });
    return this.doorPaymentView(order, closed);
  }

  async syncDoorQr(orderId, doorQr) {
    const status = await paymentGateway.getDoorQr(doorQr.id);
    if (!status.paid) return false;
    return await this.recordDoorUpi(orderId, { qrId: doorQr.id, paymentId: status.paymentId, amount: status.amount });
  }

  // The door QR was paid (the webhook, or a poll that found the payment first). Idempotent: whichever comes second
  // finds UPI already recorded. The COD payment row becomes the UPI payment, so refunds go back through the gateway.
  async recordDoorUpi(orderId, { qrId, paymentId, amount }) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (order.collected_method === "UPI") return true;

      const payment = await PaymentRepository.getSuccessfulPayment(orderId, { transaction });
      const doorQr = this.readDoorQr(payment);
      if (!doorQr || doorQr.id !== qrId) {
        // ponytail: a QR that Retry replaced was paid anyway (its close lost the race). The money is real and has no
        // order to land on; it is only logged, for a refund by hand.
        logger.error("order.door_qr.stale_payment", { orderId, qrId, paymentId, amount });
        return false;
      }

      const paidAmount = round2(amount ?? doorQr.amount);
      await PaymentRepository.updatePayment(payment.id, {
        payment_method: "UPI",
        transaction_id: paymentId,
        amount: paidAmount,
        paid_at: new Date(),
        gateway_response: this.mergeGatewayResponse(payment.gateway_response, {
          door_qr: { ...doorQr, paid_payment_id: paymentId, paid_at: new Date().toISOString() }
        })
      }, { transaction });
      await OrderRepository.updateOrder(order.id, {
        collected_amount: paidAmount,
        collected_method: "UPI",
        collected_at: new Date()
      }, { transaction });
      logger.info("order.door_qr.paid", { orderId, qrId, paymentId, amount: paidAmount });
      return true;
    });
  }

  // The rider's "Delivered" with what happened at the door: items turned away ride back with the rider (DOORSTEP
  // returns, IN_TRANSIT until the store takes them), and on a pay-on-delivery order, how the rest was paid.
  async deliverAtDoor(orderId, data, user) {
    const db = await initializeModels();

    const { details, closeQr } = await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new AppError("Order not found", 404);
      }
      this.assertTransition(order.status, ORDER_STATUS.DELIVERED);

      const items = await OrderItemRepository.getItemsByOrderId(order.id, { transaction });
      const rejected = this.checkRejections(items, data.rejected_items);
      const payment = await PaymentRepository.getSuccessfulPayment(order.id, { transaction });
      const payAtDoor = payment?.payment_method === "COD" || order.collected_method === "UPI";
      const doorQr = this.readDoorQr(payment);

      const collected = {};
      if (payAtDoor) {
        const due = this.doorAmountDue(order, rejected);
        if (order.collected_method === "UPI") {
          if (round2(order.collected_amount) !== due) {
            throw new AppError(`₹${Number(order.collected_amount).toFixed(2)} was paid by QR but ₹${due.toFixed(2)} is due: the turned-away items changed after the QR was made`, 409);
          }
        } else if (due > 0) {
          if (data.payment_method === "UPI") {
            throw new AppError("The QR has not been paid yet", 409);
          }
          if (data.payment_method !== "CASH") {
            throw new AppError("Say how the customer paid: cash or UPI", 400);
          }
          Object.assign(collected, { collected_amount: due, collected_method: "CASH", collected_at: new Date() });
        }
      }

      if (rejected.length) {
        await OrderReturnRepository.createReturns(rejected.map((line) => ({
          order_id: order.id,
          order_item_id: line.item.id,
          quantity: line.quantity,
          source: "DOORSTEP",
          reason: line.reason,
          note: line.note,
          assignment_id: data.assignment_id || null,
          status: RETURN_STATUS.IN_TRANSIT,
          // Never charged on a pay-on-delivery order (left out of what was collected); prepaid is refunded after the
          // store has the item back (inspectReturns).
          refund_amount: payAtDoor ? 0 : round2(unitPrice(line.item) * line.quantity),
          refund_status: payAtDoor ? "NOT_NEEDED" : "PENDING"
        })), { transaction });
      }

      await OrderRepository.updateOrder(order.id, { status: ORDER_STATUS.DELIVERED, ...collected }, { transaction });

      const actorId = Number(data.changed_by || getUserId(user));
      const notes = [
        rejected.length ? `${rejected.length} item(s) turned away at the door` : null,
        collected.collected_method === "CASH" ? `₹${collected.collected_amount.toFixed(2)} collected in cash` : null,
        order.collected_method === "UPI" ? `₹${Number(order.collected_amount).toFixed(2)} paid by UPI at the door` : null
      ].filter(Boolean);
      await this.recordStatusChange(order, {
        old_status: order.status,
        new_status: ORDER_STATUS.DELIVERED,
        changed_by: Number.isInteger(actorId) ? actorId : null,
        remarks: notes.join("; ") || null
      }, transaction);

      return {
        details: await this.getOrderDetails(order.id, user, { transaction }),
        // Paid in cash with a QR still up: close it so the customer can't pay twice.
        closeQr: collected.collected_method === "CASH" && doorQr && !doorQr.closed_at ? doorQr.id : null
      };
    });

    if (closeQr) {
      paymentGateway.closeDoorQr(closeQr).catch((error) => {
        logger.error("order.door_qr.close_failed", { orderId, qrId: closeQr, error: error.message });
      });
    }

    return details;
  }

  // ---- Returns ----

  // Pays `amount` back the way the customer paid. Never throws: the outcome is recorded on the returns, so stock that
  // was already moved isn't undone by a gateway error. SENT: through the gateway (online, or UPI at the door).
  // DUE: paid in cash; cash refunds are a separate process. NOT_NEEDED: nothing was charged (cash on delivery that
  // never got delivered). FAILED: the gateway refused; refund by hand.
  async sendRefund(order, amount, transaction) {
    if (!(amount > 0)) {
      return { status: "NOT_NEEDED", ref: null };
    }

    const payment = await PaymentRepository.getSuccessfulPayment(order.id, { transaction });
    if (order.collected_method === "CASH" || (payment?.payment_method === "COD" && order.status === ORDER_STATUS.DELIVERED)) {
      return { status: "DUE", ref: null };
    }
    if (!payment || payment.payment_method === "COD") {
      return { status: "NOT_NEEDED", ref: null };
    }

    try {
      const refund = await paymentGateway.refund({ transactionId: payment.transaction_id, amount });
      const refunded = round2(Number(order.refunded_amount) + amount);
      const full = refunded >= Number(order.total_amount);

      await OrderRepository.updateOrder(order.id, {
        refunded_amount: refunded,
        ...(full ? { payment_status: PAYMENT_STATUS.REFUNDED } : {})
      }, { transaction });
      if (full) {
        await PaymentRepository.updatePayment(payment.id, { status: PAYMENT_STATUS.REFUNDED }, { transaction });
      }
      // The caller may read it again in the same transaction.
      order.refunded_amount = refunded;

      const event = { orderId: order.id, transactionId: payment.transaction_id, amount, refundId: refund.refundId };
      transaction.afterCommit(() => {
        void this.publishEvent(PaymentEvents.PAYMENT_REFUNDED, event);
      });
      return { status: "SENT", ref: refund.refundId };
    } catch (error) {
      logger.error("order.refund.failed", { orderId: order.id, amount, error: error.message });
      return { status: "FAILED", ref: null };
    }
  }

  // How each returned line was split: restocked + written off must add up to its quantity. With all, every line needs
  // an entry; otherwise only the lines given are handled.
  inspectionFor(lines, given, key, all) {
    const byId = new Map(lines.map((line) => [Number(line.id), line]));
    const seen = new Set();

    const result = given.map((entry) => {
      const id = Number(entry[key]);
      const line = byId.get(id);
      if (!line) {
        throw new AppError(`${key} ${entry[key]} is not waiting for inspection here`, 400);
      }
      if (seen.has(id)) {
        throw new AppError(`${key} ${id} is listed twice`, 400);
      }
      seen.add(id);
      if (entry.restock_qty + entry.write_off_qty !== Number(line.quantity)) {
        throw new AppError(`Restocked plus written off must be ${Number(line.quantity)} for ${line.product_name || `return ${id}`}`, 400);
      }
      return { line, restock_qty: entry.restock_qty, write_off_qty: entry.write_off_qty };
    });

    if (all && seen.size !== byId.size) {
      throw new AppError("Say what happens to every returned item", 400);
    }
    return result;
  }

  // The store took goods back from the rider (delivery-service checked the return code first): a failed order becomes
  // RETURNED_TO_STORE, and items turned away at the door become RECEIVED, waiting for inspection.
  async returnArrived(orderId, data, user) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const failedOrder = order.status === ORDER_STATUS.DELIVERY_FAILED;
      if (failedOrder) {
        this.assertTransition(order.status, ORDER_STATUS.RETURNED_TO_STORE);
        await OrderRepository.updateOrder(order.id, { status: ORDER_STATUS.RETURNED_TO_STORE }, { transaction });
      }

      const [received] = await OrderReturnRepository.update(
        { order_id: order.id, status: RETURN_STATUS.IN_TRANSIT, ...(data.assignment_id ? { assignment_id: data.assignment_id } : {}) },
        { status: RETURN_STATUS.RECEIVED, received_at: new Date() },
        { transaction }
      );

      if (!failedOrder && !received) {
        throw new AppError("Nothing from this order is on its way back", 409);
      }

      const actorId = Number(data.changed_by);
      await this.recordStatusChange(order, {
        old_status: order.status,
        new_status: failedOrder ? ORDER_STATUS.RETURNED_TO_STORE : order.status,
        changed_by: Number.isInteger(actorId) ? actorId : null,
        remarks: failedOrder ? "Goods back at the store" : `${received} turned-away item(s) back at the store`
      }, transaction);

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  // Store staff (own store) or an admin check what came back: each RECEIVED return is split into restocked and
  // written-off units and closed, and what the customer paid for it is refunded.
  async inspectReturns(orderId, data, user, authorization) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new AppError("Order not found", 404);
      }
      // Before restoreInventory: that HTTP call isn't undone by a rollback.
      this.validateOrderAccess(order, user);

      const waiting = (await OrderReturnRepository.getReturnsByOrderId(order.id, { transaction }))
        .filter((row) => row.status === RETURN_STATUS.RECEIVED);
      if (!waiting.length) {
        throw new AppError("Nothing from this order is waiting for inspection", 409);
      }

      const split = this.inspectionFor(waiting, data.items, "return_id", false);
      const items = new Map((await OrderItemRepository.getItemsByOrderId(order.id, { transaction })).map((item) => [Number(item.id), item]));
      const actorId = Number(getUserId(user));
      const inspectedBy = Number.isInteger(actorId) ? actorId : null;

      // A wrong item that came back is the variant that was sent, not the one ordered.
      await this.restoreInventory(
        split.map((entry) => ({
          variant_id: entry.line.sent_variant_id || items.get(Number(entry.line.order_item_id)).variant_id,
          quantity: entry.restock_qty
        })),
        order.warehouse_id,
        `Return on ${order.order_number}`,
        inspectedBy,
        authorization
      );

      const owed = split
        .filter((entry) => entry.line.refund_status === "PENDING")
        .reduce((sum, entry) => sum + Number(entry.line.refund_amount), 0);
      const refundAmount = Math.min(round2(owed), round2(Number(order.total_amount) - Number(order.refunded_amount)));
      const refund = await this.sendRefund(order, refundAmount, transaction);

      const now = new Date();
      for (const entry of split) {
        const pending = entry.line.refund_status === "PENDING";
        await OrderReturnRepository.updateReturn(entry.line.id, {
          status: RETURN_STATUS.CLOSED,
          restock_qty: entry.restock_qty,
          write_off_qty: entry.write_off_qty,
          inspected_by: inspectedBy,
          inspected_at: now,
          ...(pending ? { refund_status: refund.status, refund_ref: refund.ref } : {})
        }, { transaction });
      }

      await this.recordStatusChange(order, {
        old_status: order.status,
        new_status: order.status,
        changed_by: inspectedBy,
        remarks: `${split.length} returned item(s) inspected${refund.status === "SENT" ? `, ₹${refundAmount.toFixed(2)} refunded` : ""}`
      }, transaction, split.some((entry) => entry.line.source === "CUSTOMER") ? this.refundUpdate(refund, refundAmount) : null);

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  // cancelOrder for a failed delivery back at the store that won't go out again. Store staff (own store) or an admin
  // say what goes back on the shelf (default: all of it; the rest is written off), and what the customer paid that
  // wasn't refunded yet goes back to them.
  async cancelReturnedOrder(order, data, user, authorization, transaction) {
    if (!["OPS_STAFF", "ADMIN", "SUPER_ADMIN"].includes(user?.role)) {
      throw new AppError("Only the store or an admin can cancel a returned order", 403);
    }

    const items = (order.items || []).filter((item) => item.status !== "NOT_AVAILABLE");
    const split = data.items?.length
      ? this.inspectionFor(items, data.items, "order_item_id", true)
      : items.map((line) => ({ line, restock_qty: Number(line.quantity), write_off_qty: 0 }));
    const actorId = Number(data.changed_by || getUserId(user));
    const inspectedBy = Number.isInteger(actorId) ? actorId : null;

    await this.restoreInventory(
      split.map((entry) => ({ variant_id: entry.line.variant_id, quantity: entry.restock_qty })),
      order.warehouse_id,
      data.reason,
      inspectedBy,
      authorization
    );
    const refund = await this.sendRefund(order, round2(Number(order.total_amount) - Number(order.refunded_amount)), transaction);

    const now = new Date();
    await OrderReturnRepository.createReturns(split.map((entry) => ({
      order_id: order.id,
      order_item_id: entry.line.id,
      quantity: entry.line.quantity,
      source: "FAILED_DELIVERY",
      reason: "NOT_DELIVERED",
      note: data.reason,
      status: RETURN_STATUS.CLOSED,
      restock_qty: entry.restock_qty,
      write_off_qty: entry.write_off_qty,
      refund_amount: refund.status === "NOT_NEEDED" ? 0 : round2(entry.line.line_total),
      refund_status: refund.status,
      refund_ref: refund.ref,
      inspected_by: inspectedBy,
      inspected_at: now
    })), { transaction });

    await OrderRepository.updateOrder(order.id, { status: ORDER_STATUS.CANCELLED }, { transaction });
    await this.recordStatusChange(order, {
      old_status: order.status,
      new_status: ORDER_STATUS.CANCELLED,
      changed_by: inspectedBy,
      remarks: data.reason
    }, transaction);

    return await this.getOrderDetails(order.id, user, { transaction });
  }

  // What the customer is texted about a refund on their return; null when there is nothing to tell (FAILED goes to staff).
  refundUpdate(refund, amount) {
    if (refund.status === "SENT") return { step: "REFUND_SENT", amount };
    if (refund.status === "DUE") return { step: "REFUND_DUE", amount };
    return null;
  }

  // The store's contact number (inventory-service), for its texts. null when it can't be read: that text is skipped.
  async storePhone(warehouseId) {
    try {
      const response = await fetch(`${env.API_GATEWAY_URL}/warehouses/${warehouseId}`);
      return response.ok ? (await response.json()).data?.contact_phone || null : null;
    } catch (error) {
      logger.warn("order.store_phone.unavailable", { warehouseId, error: error.message });
      return null;
    }
  }

  // The customer asks to return (part of) one delivered item, until 24 h after delivery; a photo for damaged, bad
  // quality and wrong item. It waits for the store's review (REQUESTED), and the store's contact is texted.
  async requestReturn(orderId, data, user) {
    if (this.isStaffUser(user)) {
      throw new AppError("Only the customer can ask for a return", 403);
    }
    const photo = data.photo ? Buffer.from(data.photo, "base64") : null;
    if (photo && !imageMime(photo)) {
      throw new AppError("The photo must be a JPEG or PNG", 415);
    }
    if (PHOTO_REASONS.has(data.reason) && !photo) {
      throw new AppError("Add a photo of the item", 400);
    }

    const db = await initializeModels();
    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new AppError("Order not found", 404);
      }
      this.validateOrderAccess(order, user);
      if (order.status !== ORDER_STATUS.DELIVERED) {
        throw new AppError("Only a delivered order can be returned", 409);
      }
      // The first DELIVERED row: later ones keep the status (a return's own notes), so they don't move the window.
      const delivered = await OrderStatusHistoryRepository.findOne(
        { order_id: order.id, new_status: ORDER_STATUS.DELIVERED },
        { order: [["created_at", "ASC"]], transaction }
      );
      if (!delivered || Date.now() - new Date(delivered.created_at).getTime() > CUSTOMER_RETURN_WINDOW_MS) {
        throw new AppError("Returns close 24 hours after delivery", 409);
      }

      const item = (await OrderItemRepository.getItemsByOrderId(order.id, { transaction }))
        .find((line) => Number(line.id) === data.order_item_id && line.status !== "NOT_AVAILABLE");
      if (!item) {
        throw new AppError("That item isn't on this order", 400);
      }
      // What was delivered and isn't already on its way back: turned away at the door counts, a rejected ask doesn't.
      const taken = (await OrderReturnRepository.getReturnsByOrderId(order.id, { transaction }))
        .filter((row) => Number(row.order_item_id) === Number(item.id) && row.status !== RETURN_STATUS.REJECTED)
        .reduce((sum, row) => sum + Number(row.quantity), 0);
      const left = Number(item.quantity) - taken;
      if (data.quantity > left) {
        throw new AppError(left > 0 ? `You can return at most ${left} of this item` : "This item is already being returned", 400);
      }

      await OrderReturnRepository.createReturns([{
        order_id: order.id,
        order_item_id: item.id,
        quantity: data.quantity,
        source: "CUSTOMER",
        reason: data.reason,
        note: data.note || null,
        status: RETURN_STATUS.REQUESTED,
        photo,
        refund_amount: round2(unitPrice(item) * data.quantity),
        refund_status: "PENDING"
      }], { transaction });

      const actorId = Number(getUserId(user));
      await this.recordStatusChange(order, {
        old_status: order.status,
        new_status: order.status,
        changed_by: Number.isInteger(actorId) ? actorId : null,
        remarks: `Return asked for: ${data.quantity} × ${item.product_name}`
      }, transaction, { step: "REQUESTED", storePhone: await this.storePhone(order.warehouse_id) });

      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  // The store (own store) or an admin decides a customer's return. A rejection is final; its reason stays with staff.
  // Approved with no pickup: refunded now and closed (nothing comes back, so nothing is restocked). With a pickup it
  // waits for a rider (APPROVED) and is refunded once the store has inspected it. A wrong item fixes the stock now.
  async reviewReturn(orderId, returnId, data, user, authorization) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new AppError("Order not found", 404);
      }
      this.validateOrderAccess(order, user);

      const row = (await OrderReturnRepository.getReturnsByOrderId(order.id, { transaction }))
        .find((line) => Number(line.id) === returnId && line.source === "CUSTOMER");
      if (!row) {
        throw new AppError("Return not found", 404);
      }
      if (row.status !== RETURN_STATUS.REQUESTED) {
        throw new AppError("This return was already reviewed", 409);
      }
      if (data.sent_variant_id && row.reason !== "WRONG_ITEM") {
        throw new AppError("Only a wrong item has a variant that was sent instead", 400);
      }

      const item = (await OrderItemRepository.getItemsByOrderId(order.id, { transaction }))
        .find((line) => Number(line.id) === Number(row.order_item_id));
      const actorId = Number(getUserId(user));
      const reviewer = Number.isInteger(actorId) ? actorId : null;
      const now = new Date();
      const reviewed = { reviewed_by: reviewer, reviewed_at: now };
      const what = `${Number(row.quantity)} × ${item.product_name}`;
      const note = (remarks, update) => this.recordStatusChange(order, {
        old_status: order.status,
        new_status: order.status,
        changed_by: reviewer,
        remarks
      }, transaction, update);

      if (data.decision === "REJECT") {
        await OrderReturnRepository.updateReturn(row.id, {
          status: RETURN_STATUS.REJECTED,
          reject_reason: data.reject_reason,
          refund_amount: 0,
          refund_status: "NOT_NEEDED",
          ...reviewed
        }, { transaction });
        await note(`Return of ${what} rejected (${data.reject_reason})`, { step: "REJECTED" });
        return await this.getOrderDetails(order.id, user, { transaction });
      }

      if (data.sent_variant_id && Number(data.sent_variant_id) !== Number(item.variant_id)) {
        await this.fixWrongItemStock(order, item, data.sent_variant_id, Number(row.quantity), reviewer, authorization);
      }
      const sent = { sent_variant_id: data.sent_variant_id || null };

      if (data.pickup) {
        await OrderReturnRepository.updateReturn(row.id, { status: RETURN_STATUS.APPROVED, ...sent, ...reviewed }, { transaction });
        await note(`Return of ${what} approved, a rider will collect it`, { step: "APPROVED" });
        return await this.getOrderDetails(order.id, user, { transaction });
      }

      const refundAmount = Math.min(round2(row.refund_amount), round2(Number(order.total_amount) - Number(order.refunded_amount)));
      const refund = await this.sendRefund(order, refundAmount, transaction);
      await OrderReturnRepository.updateReturn(row.id, {
        status: RETURN_STATUS.CLOSED,
        restock_qty: 0,
        write_off_qty: row.quantity,
        refund_status: refund.status,
        refund_ref: refund.ref,
        inspected_by: reviewer,
        inspected_at: now,
        ...sent,
        ...reviewed
      }, { transaction });
      await note(
        `Return of ${what} approved, no pickup${refund.status === "SENT" ? `, ₹${refundAmount.toFixed(2)} refunded` : ""}`,
        this.refundUpdate(refund, refundAmount) || { step: "APPROVED" }
      );
      return await this.getOrderDetails(order.id, user, { transaction });
    });
  }

  // A wrong item: the ordered variant never left the shelf (back in), the one sent instead did (out). Best effort:
  // a stock count that is already off must not block the customer's refund, so a failure is logged for the store.
  async fixWrongItemStock(order, item, sentVariantId, quantity, actorId, authorization) {
    const reason = `Wrong item on ${order.order_number}`;
    const moves = [
      { variant_id: item.variant_id, movement_type: "RETURN" },
      { variant_id: sentVariantId, movement_type: "SALE" }
    ];
    for (const move of moves) {
      try {
        await this.requestInventory("/stock-movements", {
          method: "POST",
          body: JSON.stringify({
            ...move,
            warehouse_id: order.warehouse_id,
            quantity,
            reason,
            ...(Number.isInteger(actorId) ? { created_by: actorId } : {})
          })
        }, authorization);
      } catch (error) {
        logger.error("order.return.stock_fix_failed", { orderId: order.id, ...move, quantity, error: error.message });
      }
    }
  }

  // delivery-service's pickup job for a customer's approved returns. ASSIGNED ties the returns waiting for a rider to
  // the job (the customer is texted); COLLECTED: the rider has them (IN_TRANSIT; the store takes them with the return
  // code, returnArrived); FAILED: they wait for another rider.
  async returnPickup(orderId, data) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const order = await OrderRepository.getOrderById(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const waiting = { status: RETURN_STATUS.APPROVED, assignment_id: data.assignment_id };
      const [where, values, remarks] = {
        ASSIGNED: [{ status: RETURN_STATUS.APPROVED, assignment_id: null }, { assignment_id: data.assignment_id }, "Rider assigned to collect"],
        COLLECTED: [waiting, { status: RETURN_STATUS.IN_TRANSIT }, "Rider collected"],
        FAILED: [waiting, { assignment_id: null }, "Rider couldn't collect"],
        // delivery-service couldn't save the job it tied these to (assignPickup): they wait for a rider again.
        UNASSIGNED: [waiting, { assignment_id: null }, "Rider job not saved, waiting for a rider again:"]
      }[data.step];
      const [count] = await OrderReturnRepository.update({ order_id: order.id, source: "CUSTOMER", ...where }, values, { transaction });
      if (!count) {
        // A repeat: this step was saved here, but delivery-service didn't commit its side (a crash, a timeout) and the
        // rider tapped again. Answer OK so it can finish; nothing changes twice and no second note or text goes out.
        const held = await OrderReturnRepository.findAll(
          { order_id: order.id, source: "CUSTOMER", assignment_id: data.assignment_id },
          { transaction }
        );
        const alreadyDone = {
          ASSIGNED: held.some((row) => row.status === RETURN_STATUS.APPROVED),
          COLLECTED: held.some((row) => row.status !== RETURN_STATUS.APPROVED),
          FAILED: held.length === 0,
          UNASSIGNED: true
        }[data.step];
        if (alreadyDone) {
          return { count: 0, repeat: true };
        }
        throw new AppError(
          data.step === "ASSIGNED" ? "No approved return is waiting for a rider"
            : held.length ? "These items were already marked collected" : "No return is on this pickup",
          409
        );
      }

      const actorId = Number(data.changed_by);
      await this.recordStatusChange(order, {
        old_status: order.status,
        new_status: order.status,
        changed_by: Number.isInteger(actorId) ? actorId : null,
        remarks: `${remarks} ${count} returned item(s)`
      }, transaction, data.step === "ASSIGNED" ? { step: "PICKUP_ASSIGNED" } : null);

      return { count };
    });
  }

  // The customer's photo on their return: the customer themselves, or staff of the order's store.
  async getReturnPhoto(orderId, returnId, user) {
    const order = await OrderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    this.validateOrderAccess(order, user);
    const row = await OrderReturnRepository.getPhoto(order.id, returnId);
    if (!row?.photo) {
      throw new AppError("No photo for this return", 404);
    }
    return { bytes: row.photo, mime: imageMime(row.photo) || "application/octet-stream" };
  }

  // The returns queue: store managers and staff see their store, a super admin all (or ?warehouse_id=).
  // ?status=RECEIVED,IN_TRANSIT.
  async listReturns(query = {}, user) {
    const staffStore = this.ownWarehouse(user);
    const warehouseId = staffStore || Number(query.warehouse_id) || null;
    const statuses = String(query.status || "").split(",").filter((status) => RETURN_STATUS[status]);

    const rows = await OrderReturnRepository.findReturns({
      statuses,
      warehouseId,
      limit: Math.min(Number(query.limit) || 100, 200)
    });
    return rows.map(toJson);
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

 // expiresAt: end of the payment window (Settings → Order rules), same for every item of the order.
 async createReservation(orderId, variantId, warehouseId, quantity, authorization, expiresAt) {
  const inventoryResponse = await fetch(
    `${env.API_GATEWAY_URL}/stock-reservations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(authorization),
      },
      body: JSON.stringify({
        order_id: orderId,
        variant_id: variantId,
        warehouse_id: warehouseId,
        quantity,
        expires_at: expiresAt.toISOString(),
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

  // Puts items back on the order's store shelf (inventory-service needs the warehouse). items: { variant_id, quantity }.
  // created_by is a number or nothing: a SYSTEM caller's user_id is the text "system".
  async restoreInventory(items, warehouseId, reason, createdBy, authorization) {
    const actorId = Number(createdBy);

    for (const item of items) {
      if (!(Number(item.quantity) > 0)) continue;
      await this.requestInventory(
        "/stock-movements",
        {
          method: "POST",
          body: JSON.stringify({
            variant_id: item.variant_id,
            warehouse_id: warehouseId,
            movement_type: "RETURN",
            quantity: Number(item.quantity),
            reason: reason || "Order cancelled",
            ...(Number.isInteger(actorId) ? { created_by: actorId } : {})
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
