# Orders API Plan — replace the demo data with real data

Goal: get more data per request with **reads/joins/aggregates**, not extra tables or copied data.
Only one column was added (`orders.warehouse_id`, done 2026-10-05). Everything below is query work.

## Where each piece is needed

| Piece | Orders list | Order detail | Dashboard overview | Other |
|---|---|---|---|---|
| Warehouse on order | Column + filter | Fulfilment card | Latest orders, warehouse ops | — |
| Customer name / phone | *(column removed)* | Customer card | Latest orders | Customers page |
| Orders / revenue today, by-status counts, per-day chart | "Orders today", status counts | — | Revenue, orders today, chart, avg delivery, cancel % | — |
| Export | Export button | — | — | — |
| Notifications | "Failed payments" card (retry link) | Notify customer | Needs-attention list | — |

## 1. Warehouse — DONE (column) / next: name + filter
- Done: `orders.warehouse_id` (nullable, indexed, no FK — warehouses belong to inventory-service). Set on order create and payment retry. Old orders backfilled from `inventory_reservations.order_id` (orders without a reservation stay NULL).
- Done 2026-10-05: `GET /orders/admin/all` **requires** `warehouse_id` (400 without it) — the super admin has no linked warehouse, so one must be picked first. Client: `useSelectedWarehouse` (remembered in localStorage) + a blocking picker popup on Orders, a dropdown on Orders and Dashboard; status counts and chips are per warehouse. Orders table no longer has a Warehouse column (every row is the selected warehouse).
- Also fixed: list totals were counting order × item rows (`distinct: true`), so counts/pagination were too high.
- Still to do: replace `getDemoWarehouse` in OrderDetail (fulfilment card); optional urgency sort inside a warehouse.

## 2. Customer name / phone / order count
Options, cheapest first:

| Option | How | Cost | Verdict |
|---|---|---|---|
| **A. Use the order's own address** | `order_addresses.full_name` + `phone` already exist per order. Add `address` (those 2 columns only) to the list query = one 1-to-1 join. | 0 new calls, 0 new data | **Recommended.** It is the recipient, which is what ops needs. |
| B. Batch lookup in auth-service | `POST /users/by-ids {ids}` → order-service calls it once per page, merges `customer` into each order. | 1 extra call / page | Use only if the *account holder* name is needed (e.g. Customers page). |
| C. Copy name onto `orders` | Snapshot columns at order time. | Duplicated data | Not needed — A already is a snapshot. |
| D. SQL join to `auth_users` | Same DB today. | Fastest | Reject — couples services' tables. |

Order count per customer: one grouped query per page, no new data:
`SELECT user_id, COUNT(*) FROM orders WHERE user_id IN (:ids) GROUP BY user_id` (index on `user_id`).

## 3. Stats — one endpoint instead of 13 requests — DONE 2026-10-05
**Implemented:** `GET /orders/admin/stats?warehouse_id=&days=&tz=` (`warehouse_id` optional, `days` 1–90 default 7, `tz` default Asia/Kolkata). Returns `today`, `byStatus` (zero-filled), `perDay` (gap-free), `cancelRate`, `avgDeliveryMinutes`. Three SQL queries in parallel in `order.repository.js#getStats`, 30 s in-memory cache in the service, 4 indexes (migration `20261005000001`). Client: `useOrderStats`; `useOrderStatusCounts` now uses it (13 requests → 1); Orders "Orders today" card and the Dashboard revenue / orders today / avg delivery / cancelled cards and chart are real. Not done: per-warehouse breakdown, warehouse-ops and needs-attention cards (still demo). Walkthrough: https://claude.ai/artifact/VbDtNuDLWAjX6dyFzGiD3W

_Original plan:_
`GET /orders/admin/stats?from=&to=&warehouse_id=` — a single SQL aggregate:
- `today`: `COUNT(*)` and `SUM(total_amount)` `FILTER (WHERE placed_at >= :start)` (revenue only where `payment_status='SUCCESS'`).
- `byStatus`: `SELECT status, COUNT(*) … GROUP BY status` → replaces the 13 per-status count calls (`useOrderStatusCounts`).
- `perDay`: `date_trunc('day', placed_at)` `GROUP BY 1` → the 7/30-day chart.
- `avgDeliveryMinutes`, `cancelRate`: from `order_status_history` (DELIVERED time − first ASSIGNED/PICKED_UP time) and `byStatus`.
- Per-warehouse ops: same query with `GROUP BY warehouse_id`.
- Indexes: `(placed_at)`, `(status, created_at)`. Cache 30–60 s in memory; no stored totals.

## 4. Export + notifications
- **Export:** `GET /orders/admin/export?<same filters as /all>` → reuse the `getAllOrders` where-builder, stream CSV in batches (cap 5,000 rows). Client button downloads it.
- **Notifications:** `notification-service` is an empty folder, so this is new work. Plan: order-service publishes `order.status.changed` / `payment.failed` on the existing RabbitMQ; notification-service consumes it and sends SMS/email. Admin "send retry link / notify" = publish one event (`POST /orders/:id/notify`). Do last; it needs a provider (SMS/email) decision.

## Suggested order
1. Warehouse filter + names (small) → 2. Customer via address (small) → 3. Stats endpoint (medium, biggest win) → 4. Export (small) → 5. Notifications (large, needs provider).
