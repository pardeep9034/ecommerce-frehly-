# Delivery Partner Module

The partner app is **phone-only** (`/partner/*`, `MobileShell`; a desktop browser shows the
same 430 px column). The desktop workspace (`/partner/web/*`) and the first web dashboard
(`PartnerDashboard`, `PartnerLayout`, ...) were removed on 2026-10-15. This file keeps the
API contract the phone screens need.

## Frontend state

- Phone screens: `client/src/pages/partner/{Login,ForgotPassword,Home,Pickup,Deliver,Confirm,Failed,Handover,History,Profile}.jsx`.
  **On the API (2026-10-15):** Home, History, Pickup, Deliver, Failed, Confirm, Profile. **Still demo data**
  (`lib/partnerDemoData.js`): Handover only. The admin pages DeliveryPartners and DeliveryPartnerDetail also still import
  `PARTNER_SUMMARY`, `ACTIVE_ASSIGNMENTS`, `STATS_7D` from it, and `PartnerBits` / `Failed` take UI constants
  (`STATUS_STYLE`, `DELIVERY_STEPS`, `FAILED_REASONS`), so the file cannot be deleted yet.
- Wiring: `apis/partnerApi.js`, `hooks/use-partner.js`, `lib/assignmentStatus.js` (forward-only next-status map,
  `STEP_LABEL` / `STEP_INDEX`, IST `timeOf` / `dayOf`, `initialsOf`, `mapsUrl`). Order screens live at
  `/partner/orders/:assignmentId/{pickup,deliver,confirm,failed}`; the id is the assignment's uuid, not the order number.
- One tap, one step: Pickup "Confirm pickup" → PICKED_UP; Deliver "Start delivery" → OUT_FOR_DELIVERY; Confirm "Complete
  delivery" → DELIVERED; Failed → DELIVERY_FAILED with the reason. Each screen redirects a stale link (back button, old tab)
  to where the job is now. `useUpdateAssignmentStatus` returns its invalidations so a screen opened next sees fresh data.
- Home's online switch calls `PATCH /me/online` with the state it wants (`useSetOnline`); the copy says online partners can be
  assigned and offline ones get no new orders (see below). It has no "Current slot" tile (no data;
  "Last 7 days" instead), and no handover card until Handover is wired. History has "Today" and "All time": the backend only
  filters by `date=today`, so week / month need a new value there.
- Not backed by data, so left out: distance and ETA, due time and slot, order total, "Paid online" (the assignment carries
  neither; the order has a total, but nothing hands it to the partner screens yet). **Confirm keeps the 4-digit code field and the doorstep photo picker as designed, but neither
  is checked or saved**: no delivery code exists server-side, so any 4 digits complete the delivery (the screen says so).
- Profile: no email (the partner row has none), no document list, "Edit" vehicle and "Live location sharing" are "not wired".
- Sign-in and the route guard: `lib/partnerSession.js`, `RequirePartner` in `App.jsx`.

## APIs (built 2026-10-15)

All under `/delivery-partners/me` (the gateway already proxies `/delivery-partners`). Auth: `Authorization: Bearer <JWT>`
with role `DELIVERY_PARTNER` and an `ACTIVE` partner row, else 403 (`requireActivePartner` in `middleware/auth.js`).
"Me" is the token's user: no route takes a partner id, and another partner's assignment answers 404, the same as one
that does not exist. BIGINT columns come back as strings (`user_id`, zone `id`); `order_id` is a number.
Code: `src/modules/partnerMe/`. Check: `docker compose exec -T delivery-service node partnerMe.check.js`.

### `GET /delivery-partners/me`
```json
{ "success": true, "data": {
  "id": "uuid", "user_id": "14", "name": "...", "phone": "...",
  "vehicle_type": "Motorbike", "vehicle_number": "PB65AX4412",
  "max_active_orders": 4, "current_active_orders": 2, "status": "ACTIVE", "is_online": false,
  "joined_at": "2026-03-12T...",
  "zones": [{ "id": "1", "name": "Sector 70", "is_primary": true }],
  "stats": { "delivered_7d": 74, "failed_7d": 3 }
}}
```
No `email` (the partner row has none) and no on-time rate (nothing records the promised time).

### `GET /delivery-partners/me/assignments`
Query: `status` = `ACTIVE` (default) | `HISTORY` (any finished) | `COMPLETED` | `FAILED` | `TRANSFERRED` | `CANCELLED`;
`date=today` (finished work only, IST day); `page` (1), `limit` (20, max 50). Open work: newest assigned first; finished work: most recently finished first.
```json
{ "success": true, "data": { "items": [ {
  "id": "assignment-uuid", "order_id": 10491,
  "status": "ASSIGNED", "assignment_status": "ACTIVE",
  "pickup_name": "...", "pickup_address": "...", "customer_name": "...", "delivery_address": "...",
  "assigned_at": "...", "updated_at": "...", "last_attempt_reason": null
} ], "total": 64, "page": 1, "limit": 20 } }
```
`status` is the step the screens show: `ASSIGNED` | `PICKED_UP` | `OUT_FOR_DELIVERY` while open, then `DELIVERED` |
`DELIVERY_FAILED` | `TRANSFERRED` | `CANCELLED`. `assignment_status` is the raw column
(`ACTIVE` | `COMPLETED` | `FAILED` | `TRANSFERRED` | `CANCELLED`).

### `GET /delivery-partners/me/assignments/:id`
The item above plus: `customer_phone` and `pickup_contact_phone` (null once the job is finished), `pickup_contact_name`,
`pickup_latitude/longitude`, `delivery_latitude/longitude`, `order_items` (`[{ "name": "Potato", "qty": "2 kg" }]`, lines
marked NOT_AVAILABLE left out; `null` if the order service cannot be reached) and `status_history`
(`[{ "status", "remarks", "created_at" }]`, oldest first).

### `PATCH /delivery-partners/me/assignments/:id/status`
Body `{ "status": "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DELIVERY_FAILED", "reason"?: string }`. `reason`
(3–255 characters) is required for `DELIVERY_FAILED` and refused for the rest. One forward move at a time
(ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED); `DELIVERY_FAILED` from any open step. A skipped or repeated move,
or a finished assignment, is 409. Returns the updated item.

### `PATCH /delivery-partners/me/online`
Body `{ "online": true | false }` (a real boolean; anything else, or no body, is 400). Sets the caller's `is_online` and returns
`{ "id": "uuid", "is_online": true }`. **A state, not a flip**: sending the same value again (a retry, a double tap) changes
nothing. `online_since` is set to now when going online, kept if already online, and cleared going offline. One
`UPDATE ... RETURNING`, no read first. Only an ACTIVE partner reaches it (`requireActivePartner`), and it only ever touches
the caller's own row.

**What online means.** Only an online partner can be given a new order: the zone list staff choose from
(`getAllDeliveryPartnersByZoneId`) leaves offline partners out, and `assignOrder`, `reAssignOrder` and `handOver` each refuse an
offline target partner ("not available" / "not capable of accepting order"). Going offline does not touch orders the partner
already holds; they finish them as usual. `is_online` starts `false`, so a newly approved partner gets nothing until they go
online once.

## How it works

- **Where the step comes from.** `DeliveryAssignment.status` only says ACTIVE / COMPLETED / ... , so the step lives in
  `delivery_status_history`: a row is written when an order is assigned (`ASSIGNED`) and on every `updateStatus`; an open
  assignment's step is its latest row (ASSIGNED when it has none). Limit: a handover or reassign creates a new assignment
  without rows, so it shows ASSIGNED until its next move.
- **One choke point.** The partner route checks ownership and the move, then calls `HandleOrderService.updateStatus`, the
  same function the dispatcher route and the timers use. There it writes the timeline row, writes a `DeliveryAttempt`
  (attempt number, reason) on `DELIVERY_FAILED`, and moves the order. It forwards a SYSTEM token to the order service
  with the partner's `user_id` as `changed_by`, since the order service refuses a partner's own token.
- **Auto-progression.** `scheduleAutoProgression` keeps its timers in `autoProgressionTimers`; any `updateStatus` call
  that carries a user (partner or staff) cancels the rest, and the timers' own calls (no user) do not. They still start
  at assign time (2 / 7 / 17 minutes by default), so a partner who does nothing sees the order move by itself. For real
  partner testing set `AUTO_PROGRESS_PICKUP_MS`, `_TRANSIT_MS` and `_DELIVERED_MS` very high in the delivery-service `.env`.
- **Order service changes** (`order.service.js`, `order.routes.js`): `SYSTEM` may read any order (`validateOrderAccess`)
  and call `PATCH /orders/:id/status`; `OUT_FOR_DELIVERY → DELIVERY_FAILED` is an allowed transition; `changed_by` is
  recorded as null for a SYSTEM caller (it is a BIGINT; "system" made the update fail). Before this the timers' SYSTEM
  token was refused with 403 at the first read, so the simulation never ran.

## Not built yet

- Handover routes for partners (`/handle-orders/.../handover`, `confirm-*` are still staff-only).
- Customer delivery code (issue + verify) for the Confirm screen, slot / due time, distance, payment mode, order total.
- `OPS_STAFF` still cannot move an order through the dispatcher route: the order service's role list has no `OPS_STAFF`.
- `delivery_status_history` has no index on `order_id`; add one if the table grows.

## Deferred (not in this pass, tracked for later)

- **Stale "online"** — online is a manual switch. Nothing sets a partner offline when they log out, close the app or go quiet
  (no heartbeat, `last_location_update_at` is not read), so a partner who forgets stays assignable. Add a heartbeat or an
  idle timeout if that becomes a problem.
- **Handovers** (the "Hand over" / "Confirm receipt" actions and nav tab) — picking a
  *new* partner to hand off to needs a nearby-partner search, which only makes sense with
  the mobile app's GPS. `HandleOrderService.handOver`/`confirmHandover`/`confirmReciept`
  already exist backend-side but `handOver` is currently dispatch-only too; revisit
  when the phone Handover screen is wired (last).
- **Documents section on Profile** — documents live on the partner's onboarding
  application (`delivery_partner_documents`, applicant routes under
  `/delivery-partners/applications/me`); `/me` does not return them.
- **Live route map** — no mapping library is installed in `client/`; the design's map is
  illustrative only. Add when a maps provider is chosen.
