import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class OrderRepository extends BaseRepository {
  constructor() {
    super("Order");
  }

  async createOrder(orderData, options = {}) {
    return await this.create(orderData, options);
  }

  async getOrderById(id, options = {}) {
    return await this.findById(id, options);
  }

  async findByUserIdempotencyKey(userId, idempotencyKey, options = {}) {
    return await this.findOne({ user_id: userId, idempotency_key: idempotencyKey }, options);
  }

  async getOrderDetails(id, options = {}) {
    return await this.findById(id, {
      include: [
        { association: "items" },
        { association: "address" },
        { association: "payments" },
        { association: "statusHistory" }
      ],
      ...options
    });
  }

  async getOrderWithItems(id, options = {}) {
    return await this.findById(id, {
      include: [{ association: "items" }],
      ...options
    });
  }

  async getOrderHistory(where = {}, limit = 10, offset = 0) {
    return await this.findAndCountAll(where, {
      attributes: { exclude: ["picked_by"] }, // customers read this list too; who picked is on the order detail, for staff
      include: [
        { association: "payments", limit: 1, order: [["created_at", "DESC"]] },
        {association:"items"},
        { association: "address", attributes: ["full_name"] } // recipient name for list rows; 1-to-1, no extra rows
      ],
      distinct: true, // count orders, not order x item rows
      order: [["created_at", "DESC"]],
      limit,
      offset
    });
  }

  // Aggregates for the admin dashboards. All three run in the database and return a handful of rows,
  // so the cost stays small however many orders exist. `warehouseId` null = every warehouse.
  async getStats({ warehouseId, days, tz }) {
    const Model = await this.getModel();
    const run = (sql) =>
      Model.sequelize.query(sql, {
        replacements: { warehouseId, days, tz },
        type: Model.sequelize.QueryTypes.SELECT
      });
    const whereWarehouse = warehouseId ? "AND warehouse_id = :warehouseId" : "";
    const since = "((now() AT TIME ZONE :tz)::date - (:days - 1))::timestamp AT TIME ZONE :tz";

    const [byStatus, perDay, delivery] = await Promise.all([
      run(`SELECT status, COUNT(*)::int AS count FROM orders WHERE true ${whereWarehouse} GROUP BY status`),
      // One row per calendar day (empty days included) so the chart has no gaps.
      run(`
        WITH days AS (
          SELECT generate_series((now() AT TIME ZONE :tz)::date - (:days - 1), (now() AT TIME ZONE :tz)::date, interval '1 day')::date AS day
        ), agg AS (
          SELECT (placed_at AT TIME ZONE :tz)::date AS day,
                 COUNT(*)::int AS orders,
                 COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
                 COALESCE(SUM(total_amount - refunded_amount)
                   FILTER (WHERE payment_status = 'SUCCESS' AND status <> 'CANCELLED'), 0)::float AS revenue
          FROM orders
          WHERE placed_at >= ${since} ${whereWarehouse}
          GROUP BY 1
        )
        SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
               COALESCE(a.orders, 0) AS orders,
               COALESCE(a.cancelled, 0) AS cancelled,
               COALESCE(a.revenue, 0) AS revenue
        FROM days d LEFT JOIN agg a ON a.day = d.day
        ORDER BY d.day`),
      // Pickup -> delivered, for orders delivered inside the window.
      run(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (d.at - p.at)) / 60))::int AS minutes
        FROM orders o
        JOIN LATERAL (SELECT MIN(created_at) AS at FROM order_status_history WHERE order_id = o.id AND new_status = 'PICKED_UP') p ON true
        JOIN LATERAL (SELECT MIN(created_at) AS at FROM order_status_history WHERE order_id = o.id AND new_status = 'DELIVERED') d ON true
        WHERE p.at IS NOT NULL AND d.at IS NOT NULL AND d.at >= ${since} ${whereWarehouse.replace("warehouse_id", "o.warehouse_id")}`)
    ]);

    return { byStatus, perDay, avgDeliveryMinutes: delivery[0]?.minutes ?? null };
  }

  // Per-customer numbers for the admin Customers page. Orders that never got paid/placed
  // (pending, failed, expired payment) don't count. Spent = paid, not cancelled, net of refunds
  // (same rule as the dashboard revenue).
  async getCustomerStats({ userIds, tz }) {
    const Model = await this.getModel();
    const run = (sql) =>
      Model.sequelize.query(sql, {
        replacements: { userIds, tz },
        type: Model.sequelize.QueryTypes.SELECT
      });
    const placed = "status NOT IN ('PENDING_PAYMENT', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED')";
    const monthStart = "(date_trunc('month', now() AT TIME ZONE :tz)) AT TIME ZONE :tz";

    const [perUser, recent, summary] = await Promise.all([
      userIds.length
        ? run(`
            SELECT user_id, COUNT(*)::int AS orders,
                   COALESCE(SUM(total_amount - refunded_amount) FILTER (WHERE payment_status = 'SUCCESS' AND status <> 'CANCELLED'), 0)::float AS spent,
                   MAX(placed_at) AS last_order_at
            FROM orders WHERE user_id IN (:userIds) AND ${placed}
            GROUP BY user_id`)
        : [],
      userIds.length
        ? run(`
            SELECT id, user_id, total_amount::float AS total, placed_at AS date FROM (
              SELECT id, user_id, total_amount, placed_at,
                     ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY placed_at DESC, id DESC) AS rn
              FROM orders WHERE user_id IN (:userIds) AND ${placed}
            ) t WHERE rn <= 3 ORDER BY user_id, rn`)
        : [],
      run(`
        SELECT COUNT(*) FILTER (WHERE month_orders > 0)::int AS ordered_this_month,
               COUNT(*) FILTER (WHERE total_orders > 1)::int AS repeat_customers,
               COUNT(*)::int AS customers_with_orders
        FROM (
          SELECT user_id, COUNT(*) AS total_orders, COUNT(*) FILTER (WHERE placed_at >= ${monthStart}) AS month_orders
          FROM orders WHERE ${placed} GROUP BY user_id
        ) t`)
    ]);

    return { perUser, recent, summary: summary[0] };
  }

  async getExpiredPendingPayments(expiryTime) {
    return await this.findAll({
      status: "PENDING_PAYMENT",
      payment_status: "PENDING",
      created_at: { [Op.lt]: expiryTime }
    });
  }

  async updateOrder(id, orderData, options = {}) {
    return await this.updateById(id, orderData, options);
  }
}

export default new OrderRepository();
