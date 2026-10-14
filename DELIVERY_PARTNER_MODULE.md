# Delivery Partner Module

Branch: `feature/delivery-partner-module` (off `v1.2`). Tracks progress against the
[design canvas](https://claude.ai/artifact/2AywLUq3gTaHA48yeKCkeY) (20 artboards: mobile
PWA, web dashboard, self-onboarding, admin partner management).

Order: **web dashboard first** (this pass), then the mobile PWA, in a later branch.

## What's done (frontend only — no backend changes in this pass)

New files:
- `client/src/pages/partner/{PartnerLogin,PartnerDashboard,PartnerOrders,PartnerHistory,PartnerProfile}.jsx`
- `client/src/components/partner/{PartnerLayout,PartnerSidebar,StatusBadge}.jsx`
- `client/src/apis/partnerApi.js`, `client/src/hooks/use-partner.js`
- `client/src/lib/auth.js` (`getTokenRole`, factored out of `App.jsx`), `client/src/lib/assignmentStatus.js`
- Routes: `/partner/login` (public) and `/partner/*` (guarded by `DELIVERY_PARTNER` role, mirrors how `/dashboard` is guarded by `ADMIN_ROLES`)
- `client/src/components/freshly/LoginPage.jsx` was **not** touched — partners get their
  own login page for the same reason admins do (`AdminLogin.jsx`), instead of branching
  role logic into the shopper-facing login.

All four pages call the API endpoints below through `partnerApi.js` / `use-partner.js`.
None of these endpoints exist yet, so every page will show its loading/empty state
against a live backend until the changes below ship.

**Deliberately left out of this pass** (see "Deferred" at the bottom): live map, the
online/offline presence toggle, Handovers tab, Documents section on Profile.

## APIs needed

All under the existing `/delivery-partners` gateway prefix (already proxied to
delivery-service — no gateway change needed). Auth: `Authorization: Bearer <JWT>`,
role `DELIVERY_PARTNER`. None take a partner id in the URL or body — every one resolves
"me" from the caller's own `req.user.user_id`, so one partner can never address another
partner's data by guessing an id.

### `GET /delivery-partners/me`
Partner's own profile.
```json
{
  "success": true,
  "data": {
    "id": "uuid", "user_id": "uuid",
    "name": "Ravi Kumar", "phone": "+91...", "email": "...",
    "vehicle_type": "Motorbike", "vehicle_number": "PB65AX4412",
    "max_active_orders": 4, "current_active_orders": 2, "status": "ACTIVE",
    "joined_at": "2026-03-12T...",
    "zones": [{ "id": 1, "name": "Sector 70", "is_primary": true }],
    "stats": { "delivered_7d": 74, "failed_7d": 3, "on_time_rate_7d": 96 }
  }
}
```

### `GET /delivery-partners/me/assignments`
Query: `status` = `ACTIVE` | `HISTORY` (any terminal status) | `COMPLETED` | `FAILED` |
`TRANSFERRED` | `CANCELLED`; optional `date=today`; `page`, `limit`.
```json
{ "success": true, "data": { "items": [ {
  "id": "assignment-uuid", "order_id": 10491, "status": "ASSIGNED",
  "pickup_name": "...", "pickup_address": "...",
  "customer_name": "...", "delivery_address": "...",
  "assigned_at": "...", "updated_at": "...",
  "last_attempt_reason": "Customer not reachable"
} ], "total": 64, "page": 1, "limit": 20 } }
```
All fields already exist on `DeliveryAssignment` (denormalized at assignment time) — this
is a plain filtered `findAndCountAll` scoped to `delivery_partner_id`, no cross-service
calls needed for the list views.

### `GET /delivery-partners/me/assignments/:id`
Single assignment, ownership-checked, plus order items and status timeline:
```json
{ "success": true, "data": {
  "...assignment fields as above...",
  "order_items": [{ "name": "Tomato (Hybrid)", "qty": "1 kg" }],
  "status_history": [{ "status": "PICKED_UP", "created_at": "..." }]
}}
```

### `PATCH /delivery-partners/me/assignments/:id/status`
Body: `{ "status": "PICKED_UP"|"OUT_FOR_DELIVERY"|"DELIVERED"|"DELIVERY_FAILED", "reason"?: string }`.
`reason` is required when `status` is `DELIVERY_FAILED`. Returns the updated assignment.

## Backend changes required (none made in this pass)

1. **Let a partner's own token through.** `delivery-service/src/middleware/auth.js`'s
   `authenticateToken` only lets `["ADMIN","SUPER_ADMIN","OPS_STAFF"]` past — add
   `"DELIVERY_PARTNER"`. Every route above still needs its own check that the
   authenticated user is the assignment's/partner's owner (never trust a partner-supplied
   id) — see point 2.

2. **New `me` routes**, e.g. a `deliveryPartnerMe` module (or added to the existing
   `deliveryPartner` module): resolve the caller's own `DeliveryPartner` row via
   `DeliveryPartnerRepository.getDeliveryPartnerByUserId(req.user.user_id)` (already
   exists, unused) — never accept a partner id from the client. For the assignment
   endpoints, look up by `delivery_partner_id = <that row's id>` and 403 if a requested
   assignment belongs to someone else.

3. **Status updates need a partner-safe path.** `POST /handle-orders/assignments/:id/update-status`
   is currently `requireDispatchRole`-only (staff). The new `PATCH .../status` endpoint
   should wrap the existing `HandleOrderService.updateStatus` but: (a) verify the caller
   owns the assignment, (b) restrict `status` to the forward subset above — never let a
   partner set `ASSIGNED`/`TRANSFERRED`/`CANCELLED` — and (c) on `DELIVERY_FAILED`, also
   write a `DeliveryAttempt` row (model + repository already exist and are unused —
   `DeliveryAttemptRepository.createDeliveryAttempt`) with `failure_reason: reason`, in
   the same transaction.

4. **Auto-progression will race with real updates.** `HandleOrderService.scheduleAutoProgression`
   (in `handleOrder.service.js`) fires timers that simulate PICKED_UP → OUT_FOR_DELIVERY →
   DELIVERED on every assignment, because no partner app existed to report real status
   before now. Once partners can report real status, a stale timer can fire *after* a
   real update and overwrite it with a fake one. Fix once, at the shared choke point:
   track pending timeout handles per `assignmentId` and clear them at the top of
   `updateStatus` (called by both the dispatch-only and new partner-safe paths) before
   applying the new status.

5. **Order items need a cross-service read, and it's currently blocked.**
   `order-service`'s `validateOrderAccess` (`order.service.js`) only allows the order's
   own customer or `["ADMIN","SUPER_ADMIN","SUPPORT"]` — a delivery partner's own JWT
   would get a 403 reading `/orders/:id`, and so would the existing internal
   `buildSystemAuthorization()` token (`role: "SYSTEM"`, already used elsewhere in
   `handleOrder.service.js` for the same kind of internal call) because `"SYSTEM"` isn't
   in that allow-list either. Add `"SYSTEM"` to `validateOrderAccess`'s admin check —
   that's the one place every future internal service-to-service read needs to pass
   through, not a per-caller patch. Then `GET .../assignments/:id` can call
   `order-service` with a minted system token (mirroring the existing pattern) to fetch
   items, instead of widening partner access to `/orders/:id` directly (which would let
   any partner read any order by guessing an id).

6. **Status timeline reuses `order-service`'s existing history**, not
   `DeliveryStatusHistory` (a delivery-service model that exists but is never written to
   today). `order-service`'s `getOrderDetails` already returns `statusHistory` — the same
   system-token call in point 5 can pull it, so no new write path needs to be built for
   this pass.

7. **Partner name/phone aren't in the JWT.** The token only carries
   `{ user_id, email, role }` (see `auth-service/.../token.service.js`), so
   `GET /delivery-partners/me` needs a cross-service call to user-service/auth-service for
   the partner's name and phone, the same way `handleOrder.service.js` already calls
   `INVENTORY_SERVICE_WAREHOUSE_URL` for warehouse info.

8. **Partner login already works as-is** — no auth-service change needed. A user with
   `role: "DELIVERY_PARTNER"` (enum already exists on `User.model.js`) logs in through the
   existing `POST /auth/login/password`, which issues a token with that role regardless of
   which page called it. `PartnerLogin.jsx` posts to the same endpoint `AdminLogin.jsx`
   uses and just checks the returned role client-side.

## Deferred (not in this pass, tracked for later)

- **Online/offline toggle** — the design shows it on every page, but `DeliveryPartner`
  has no presence column (only the admin-controlled `status` enum ACTIVE/SUSPENDED/
  INACTIVE, which is a different thing). Needs a real `is_online` column + semantics
  decision before it's wired to anything; a decorative toggle that saves nothing was left
  out rather than built to look functional.
- **Handovers** (the "Hand over" / "Confirm receipt" actions and nav tab) — picking a
  *new* partner to hand off to needs a nearby-partner search, which only makes sense with
  the mobile app's GPS. `HandleOrderService.handOver`/`confirmHandover`/`confirmReciept`
  already exist backend-side but `handOver` is currently dispatch-only too; revisit
  alongside the PWA pass.
- **Documents section on Profile** — no schema exists for partner documents at all; that
  belongs to the self-onboarding module (`Apply`/`Documents`/`Status` artboards), not
  built yet.
- **Live route map** — no mapping library is installed in `client/`; the design's map is
  illustrative only. Add when a maps provider is chosen.
