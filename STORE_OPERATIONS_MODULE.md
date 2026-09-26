# Store Operations Module — Web Console

Branch: `feature/store-operations-module` (off `v1.2`). Tracks progress against the
[Store Operations UI design canvas](https://claude.ai/artifact/H68yEA943tYVUkvCkwxxi6) (43
artboards: web console + mobile PWA) and the queued follow-on
[Admin Warehouses & Staff canvas](https://claude.ai/artifact/VJC2BbHPBRS9bnWTXN4L7B) (not
started yet).

Order: **web console first** (this pass), then the mobile PWA, in a later branch — same
sequencing as [[DELIVERY_PARTNER_MODULE]].

## What's done (frontend only — no backend changes in this pass)

New files:
- `client/src/pages/store/{StoreLogin,StoreBoard,StoreOrderDetail,StoreHandover,StoreStock,StoreSettings}.jsx`
- `client/src/components/store/{StoreLayout,StoreSidebar,StageBadge}.jsx`
- `client/src/apis/storeApi.js`, `client/src/hooks/use-store.js`
- `client/src/lib/orderStage.js` — derives a client-side "stage" (New / Picking / Waiting
  on customer / Packing / Ready for pickup / Rider assigned / Cancelled) from the real
  `Order.status` plus two fields that don't exist yet (`is_packed`, item-level review
  state). There is no PICKING/PACKING value in `ORDER_STATUS` — see "Headline blocker"
  below.
- Routes: `/store/login` (public) and `/store/*` (guarded by `client/src/lib/storeRole.js`'s
  `STORE_ROLES = ["OPS_STAFF", "ADMIN"]` — **reuses existing roles, no migration needed**:
  `OPS_STAFF` acts as store staff, `ADMIN` acts as store manager. `storeDesignation(role)`
  picks the label shown in the sidebar/settings. This replaces an earlier draft of this
  module that proposed a brand-new `STORE_STAFF` role — dropped once it was confirmed
  `OPS_STAFF`/`ADMIN` already reach the relevant services (see backend changes below).

`StoreStock.jsx` deliberately reuses the *existing* `useInventory` / `useStockMovement`
hooks and `InventoryApi.fetchInventoryByWarehouse` / `StockMovementApi.createStockMovement`
(already in the codebase for the admin dashboard, just never wired into a page) instead of
new endpoints — see backend change #6.

**Deliberately left out of this pass** (see "Deferred" at the bottom): the "Store
settings" tab (hours, pack-by target, auto-assign, racks), live board auto-refresh,
label printing, mobile PWA screens.

## Headline blocker: `autoFinalizeOrder` skips the entire pick/pack step

`order-service/src/modules/order/order.service.js`'s `autoFinalizeOrder` (called right
after payment success, and again elsewhere) marks **every** item `READY` unconditionally
and jumps straight to `READY_FOR_ASSIGNMENT` — its own comment says this exists because
*"there's nothing left for an admin to decide in the normal case... Failures are
swallowed."* Today this means every order skips Picking and Packing entirely.

The Store Operations queue this module builds a UI for (`New` → `Picking` →
`Packing` → `Ready for pickup`) will sit perpetually empty unless `autoFinalizeOrder` is
scoped down — e.g. only auto-finalize orders for warehouses with no active staff, or
disabled once a warehouse has real staff assigned. This is the exact same shape of
problem as `DeliveryAssignment.scheduleAutoProgression` documented in
[[DELIVERY_PARTNER_MODULE]] backend change #4: a "simulate the missing human" mechanism
that now needs to yield to a real one. **Both should be fixed together** — see "How this
ties together" below — ideally behind the same kind of check (does this order's warehouse
have staff who can act on it?).

## APIs needed

All under a new `/store` gateway prefix. Auth: `Authorization: Bearer <JWT>`, role
`OPS_STAFF` (store staff) or `ADMIN` (store manager) — see backend change #1 for why no
new role is needed. Like the delivery-partner APIs, nothing takes a warehouse id or staff
id from the client — every endpoint resolves "my warehouse" server-side from the caller's
own `user_id`, never from the `x-warehouse-id` header the client currently sends (see
backend change #5).

### `GET /store/me`
Staff member's own profile.
```json
{ "success": true, "data": {
  "user_id": "uuid", "name": "Suresh Bansal", "phone": "+91...",
  "designation": "Store manager",
  "warehouse_id": 7, "warehouse_name": "Dark Store · Phase 7"
}}
```

### `GET /store/me/queue?stage=&search=`
Every open order for the staff member's own warehouse. `stage` is optional and is the
derived value from `orderStage.js` (`NEW|PICKING|WAITING|PACKING|READY|ASSIGNED`) —
computing it server-side would remove the client's need to know about `is_packed`, but
either resolution point works as long as it's centralized (see backend change #3).
```json
{ "success": true, "data": { "items": [ {
  "id": 10495, "order_number": "10495", "status": "PLACED",
  "customer_name": "...", "delivery_address": "...",
  "items": [{ "id": 1, "product_name": "Tomato (Hybrid)", "quantity": 1, "status": "PENDING" }],
  "is_packed": false, "bag_count": null, "rack_label": null,
  "pack_by": "2026-09-26T07:40:00Z"
} ] } }
```

### `GET /store/me/orders/:orderId`
Ownership-checked (order's `warehouse_id` must match caller's own), plus
`status_history` (reuse `order-service`'s existing `OrderStatusHistory`, same as
[[DELIVERY_PARTNER_MODULE]] backend change #6 — don't build a second write path).

### `PATCH /store/me/orders/:orderId/items/:itemId/status`
### `POST /store/me/orders/:orderId/items/finalize`
Same bodies as the existing `PATCH /orders/:orderId/items/:itemId/status` and
`POST /orders/:orderId/items/finalize` — **these already exist** in
`order.service.js`/`order.routes.js` and already do exactly what the Pick screen needs.
`ADMIN` already passes their `requireRole` check (see backend change #2); they just need
`OPS_STAFF` added, plus a warehouse-ownership check — not a new implementation.

### `POST /store/me/orders/:orderId/pack`
Body: `{ "bag_count": 2, "rack_label": "B-4" }`. New — no `bag_count`/`rack_label`/
`is_packed` fields exist on `Order` today (see backend change #3). Sets `is_packed: true`.

### `GET /store/me/orders/:orderId/available-riders`
### `POST /store/me/orders/:orderId/assign-rider`
Body: `{ "delivery_partner_id": "uuid" }`. Reuses whatever assignment-creation logic
already exists for admin-triggered assignment (check `handleOrder.service.js`'s
assignment-creation path before writing a new one) — the new part is just listing nearby
*online* partners, which needs the `is_online` presence column flagged as missing in
[[DELIVERY_PARTNER_MODULE]] ("Deferred" section). **This endpoint can't be built until
that column exists.**

### `GET /store/me/handovers`
Orders in `ASSIGNED`/`PICKED_UP` status for the caller's warehouse where a rider is at
or near the store. Denormalize rider name/status the same way `DeliveryAssignment`
already denormalizes pickup/delivery info for the partner-facing endpoints.

### `POST /store/me/orders/:orderId/handover`
Body: `{ "pickup_code": "4821" }`. This is the store side of
`HandleOrderService.confirmHandover`/`confirmReciept`, which already exist in
delivery-service — see backend change #5 (the role check already passes; only a
warehouse-ownership wrapper is needed). This module is the actor
[[DELIVERY_PARTNER_MODULE]]'s "Deferred" section said that flow was waiting for.

## Backend changes required (none made in this pass)

1. **No new role — reuses `OPS_STAFF` (store staff) and `ADMIN` (store manager).**
   An earlier draft of this doc proposed a new `STORE_STAFF` role requiring an
   auth-service migration. That's dropped: `OPS_STAFF` already exists on
   `User.model.js`'s enum, already authenticates against every relevant service (see
   points 2, 5 and 6 below), and login already works today via the existing
   `POST /auth/login/password` — `StoreLogin.jsx` just checks the returned role
   client-side, same pattern as `PartnerLogin.jsx`/`AdminLogin.jsx`. Zero auth-service
   changes needed for this module. (The design's `WebLogin.dc.html` shows a mobile+OTP
   flow; there's no login-via-OTP endpoint today — `authApi.js` only has OTP for signup
   verification — so the password flow was used instead of building UI with nothing
   behind it.)

2. **Item-status endpoints need `OPS_STAFF` added, plus warehouse scoping.**
   `PATCH /orders/:orderId/items/:itemId/status` and `POST /orders/:orderId/items/finalize`
   (`order.routes.js`) are `requireRole("ADMIN","SUPER_ADMIN","SUPPORT")`-only — `ADMIN`
   (store manager) already passes; `OPS_STAFF` (store staff) needs adding. Either way —
   same lesson as [[DELIVERY_PARTNER_MODULE]] point 2 — never trust a client-supplied
   warehouse id: resolve the caller's own warehouse from their staff record (point 4) and
   403 if the order's `warehouse_id` doesn't match.

3. **No PICKING/PACKING order status exists.** `ORDER_STATUS` has `PLACED → CONFIRMED →
   READY_FOR_ASSIGNMENT`, with nothing in between. This module's board derives "Picking"
   from `PLACED`/`CONFIRMED` + partially-reviewed items, and "Packing" from
   `READY_FOR_ASSIGNMENT` + a not-yet-existing `is_packed` flag — deliberately *not*
   proposing new enum values, since `ALLOWED_TRANSITIONS` and every existing consumer of
   `order.status` (customer app, admin dashboard, delivery-service) would need
   auditing against new states. Adding `is_packed`/`bag_count`/`rack_label` columns to
   `Order` is a smaller, additive change that doesn't touch the transition graph.
   Whichever service computes the "stage" (this doc assumes the client does, off fields
   the API returns) should be the *only* place that does — don't let both the client and
   a future admin view invent their own derivation and drift apart.

4. **Orders aren't tied to a warehouse at all.** `Order.model.js` has no `warehouse_id`
   column, and `Warehouse.model.js` has no staff/manager association — confirmed via a
   full read of both models, and `find -iname "*staff*"` turns up no staff model
   anywhere in the backend. Two things are needed:
   - A `WarehouseStaff` join table (`user_id`, `warehouse_id`, `role` — staff vs manager
     derived from the user's existing `OPS_STAFF`/`ADMIN` role, not a new column) — the
     store equivalent of `DeliveryPartnerZone` — so `GET /store/me` and every
     warehouse-scoped query can resolve "my warehouse" from the caller's own account.
     This is also exactly what the queued **Admin Warehouses & Staff** module's "Assign
     staff" screen needs, so build it once, shared by both, rather than each module
     inventing its own version. Note this means an `ADMIN` user acting as store manager
     is scoped to *one* warehouse here even though the same account has global access via
     `/dashboard` — that's intentional (this join table is what makes them "this
     warehouse's manager" specifically), not a contradiction.
   - `Order.warehouse_id`, set at order-placement time (order-service already knows which
     warehouse's stock it reserved against, via `StockReservation`). Without it there's no
     efficient way to answer "what orders does my store need to work on" at all.
   - `Order.bag_count`, `Order.rack_label`, `Order.is_packed` for the Pack screen.

5. **`x-warehouse-id` is a hardcoded client header today, not real scoping.**
   `client/src/apis/axiosInstance.js` sends `"x-warehouse-id": "1"` on *every* request,
   unconditionally — it's a placeholder for a single-warehouse assumption, not a real
   per-user warehouse resolution. None of this module's new endpoints should read that
   header; they resolve the warehouse from the `WarehouseStaff` row in point 4 instead,
   the same "never trust a client-supplied id" rule as delivery-partner's "me" endpoints.

6. **inventory-service's own auth middleware has two live bugs that block any real
   warehouse scoping there**, found while checking whether `OPS_STAFF`/`ADMIN` already
   reach it (`backend/services/inventory-service/src/middleware/auth.js`):
   - `authenticateToken` checks
     `if(decoded.role === "ADMIN" || "SUPER_ADMIN"||"OPS_STAFF")` — the classic
     `a === "X" || "Y"` bug called out in `backend/CLAUDE.md`. `"SUPER_ADMIN"` and
     `"OPS_STAFF"` are non-empty strings, always truthy, so this condition is **always
     true** — any authenticated user of any role currently passes, not just
     admin/ops-staff. Needs `["ADMIN","SUPER_ADMIN","OPS_STAFF"].includes(decoded.role)`.
   - On success it sets `req.user = decoded.user_id` — a bare id, not the full payload —
     so `requireRole` (defined in the same file) can never work here: it reads
     `req.user.role`, which is `undefined` on a bare id. Needs `req.user = decoded`, matching
     the "`req.user` = full decoded JWT payload" convention used elsewhere.
   - Neither bug is exercised today — `inventory.routes.js`/`stockMovement.routes.js`
     only call `authenticateToken`, never `requireRole` — so nothing currently breaks, but
     fixing bug #1 correctly (with `.includes()`) must keep `OPS_STAFF` and `ADMIN` in the
     list, or this module's `StoreStock.jsx` (which already relies on these routes today
     via the bug) and the existing admin dashboard's inventory pages both lose access.
   - Once fixed, `/inventory/*` and `/stock-movements` write routes should add
     `requireRole("ADMIN","SUPER_ADMIN","OPS_STAFF")` explicitly rather than relying on
     `authenticateToken`'s role check doing double duty, plus scope writes to the caller's
     own `warehouse_id` from point 4.
   - Separately, `fetchInventoryByWarehouse`'s response has never actually been rendered
     by any existing page (admin's own `Inventory.jsx` has a "will be connected when the
     API is available" stub), so the field names this doc assumes
     (`current_stock`, `reserved_stock`, `low_stock_threshold` — real `Inventory.model.js`
     columns) are best-effort until confirmed against a real response.

7. **Handover needs a warehouse-ownership wrapper, not a role change.**
   `HandleOrderService.handOver`/`confirmHandover`/`confirmReciept` sit behind
   `requireDispatchRole = requireRole(["ADMIN","SUPER_ADMIN","OPS_STAFF"])` in
   `handleOrder.routes.js` — confirmed by reading the route file — so both store roles
   *already* pass. [[DELIVERY_PARTNER_MODULE]] flagged this as "dispatch-only, revisit
   alongside a real actor"; this module is that actor. The only new work is wrapping
   `confirmHandover` with a check that the order's warehouse matches the caller's own
   (point 4), the same shape as delivery-partner's status-update wrapper — not a
   `requireRole` change.

8. **Rider assignment depends on the same missing presence column.**
   `GET /store/me/orders/:orderId/available-riders` needs to know which delivery
   partners are online — `DeliveryPartner` has no `is_online` column
   ([[DELIVERY_PARTNER_MODULE]] "Deferred"). This endpoint can't return anything
   meaningful until that ships; build it after, not before.

## How this ties together with the delivery-partner module

Both modules exist because two "simulate the missing human" mechanisms
(`autoFinalizeOrder` and `scheduleAutoProgression`) were built when no real
picker/packer/rider app existed. Shipping either module's backend in isolation
re-introduces a race: a store worker who finalizes items for real can still get
overwritten by `autoFinalizeOrder` firing first, and a rider whose status a partner
reports for real can still get overwritten by a stale `scheduleAutoProgression` timer.
**Recommend implementing both fixes in the same pass**, gated on the same signal —
whether the order's warehouse has staff at all (point 4's `WarehouseStaff` table doubles
as that signal: no rows for a warehouse means keep auto-finalizing/auto-progressing for
it, exactly as today).

They also share the "never trust a client-supplied id, resolve it from the caller's own
account" rule throughout — delivery partner id, warehouse id, and (once built) staff id
should all be resolved the same way, through the caller's `req.user.user_id`.

## Deferred (not in this pass, tracked for later)

- **"Store settings" tab** (hours, pack-by target, max orders per slot, auto-assign
  riders, racks) — no backing fields exist anywhere on `Warehouse.model.js`. Left out
  rather than built as toggles that save nothing, same call made for delivery-partner's
  online/offline toggle.
- **Label printing** — the design's "Print label" button has no printer integration; out
  of scope for a web app regardless.
- **Live board auto-refresh / websocket push** — `StoreBoard.jsx` polls on normal
  react-query defaults; a real-time queue would need a push channel, not built here.
- **Admin Warehouses & Staff module** (6-screen CRUD: warehouse list/create/detail,
  assign-staff, staff & admin accounts) — queued as the next module after this one, per
  the user's "start with Store Operations, then this" ordering. Its "Assign staff" screen
  should be built against the same `WarehouseStaff` table from backend change #4.
- **Mobile PWA screens** (Login, Queue, Pick, NotAvailable, Pack, PackPartial,
  AssignRider, Handover, Stock, Me, Logout, plus per-status `OD-*` order-detail screens) —
  deferred to a later branch, same sequencing as the delivery-partner PWA.
