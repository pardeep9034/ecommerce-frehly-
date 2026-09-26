# Admin Warehouses & Staff Module

Branch: `feature/store-operations-module`. Tracks progress against the
[Admin Warehouses & Staff design canvas](https://claude.ai/artifact/VJC2BbHPBRS9bnWTXN4L7B) —
the module [[STORE_OPERATIONS_MODULE]] queued as "next" in its Deferred section.

## What's done (frontend only, no backend changes)

All 6 boards of the design are built. Real data is used wherever an endpoint exists;
everything else falls back to **demo data** from `client/src/lib/demoData.js` and is
labelled with a yellow "Demo data" chip (`DemoBadge`). Saving to an endpoint that doesn't
exist yet shows a warning toast ("needs the backend API") instead of a generic error.

| Board | Screen | Real today | Demo / not saved yet |
|---|---|---|---|
| 1 | Warehouses list (`WarehousePage`, `WarehousesTable`) | warehouses, zones, status from `is_active` | manager, staff count (demo staff), orders today |
| 2 | Add warehouse, 4 steps (`WarehouseNewPage`, `/dashboard/warehouses/new`, `?draft=id` to finish a draft) | create/update warehouse, draft = `is_active:false` | pincode, hours, pack-by, capacity, racks, auto-assign, team |
| 3 | Warehouse detail (`WarehouseDetailPage`): Overview / Location / Team / Settings | location edit, deactivate | overview metrics, team (derived from staff), store status, hours, label printer |
| 4 | Assign staff dialog (`AssignStaffModal`, also "Change manager" single-select) | — | assign/remove |
| 5 | Staff & admins list (`StaffPage`, `StaffTable`) + reset password / move / disable dialogs | — | whole list (15 demo users from the design) |
| 6 | Add user (`StaffNewPage`): set password now **or** SMS link, strength meter, success screen; `?edit=id` | — | create (shows an "unsaved preview" success screen) |

Shared pieces: `SummaryTile`, `StatusPill`, `UnderlineTabs`, `FormField`, `StaffCheckRow`,
`ConfirmDialog`, `WarehouseLocationFields`; `lib/{formStyles,warehouseForm,warehouseStatus,staffRole,password,formatTime,demoData}.js`.
Sidebar: Warehouses moved to Management, next to "Staff & admins". Header titles fall back to
the closest parent path (`/dashboard/warehouses/12` → "Warehouses").

To remove the demo layer once the APIs below ship: the hooks set `isDemo` only when an
endpoint 404s, so real data takes over automatically; then delete `DEMO_STAFF`,
`DEMO_WAREHOUSE_METRICS` and `demoOrdersToday` from `demoData.js`.

## APIs needed

### auth-service — admin user management (new, under the existing `/auth` gateway prefix)

None of this exists today. `auth-service` has no admin-facing user list/create endpoint at
all — `POST /auth/register` is the self-signup flow and shouldn't be reused here (it has no
`role`/`warehouse_id` input and isn't gated). Auth: `Authorization: Bearer <JWT>`, role
`SUPER_ADMIN` only (see backend change #3 — only super admins create/manage staff, per the
artifact's own copy: "Super admins... Creates all users").

#### `GET /auth/admin/users?role=&search=&page=&limit=`
Lists non-customer users (`role != CUSTOMER`), paginated.
```json
{ "success": true, "data": {
  "users": [ {
    "id": 12, "first_name": "Suresh", "last_name": "Bansal", "phone": "+91...",
    "email": null, "role": "ADMIN", "warehouse_id": 2, "warehouse_name": "TEST",
    "is_active": true, "account_locked_until": null, "last_login_at": "2026-09-20T...",
    "failed_login_attempts": 0, "must_change_password": false, "invite_pending": false, "on_shift": true, "shift": "MORNING"
  } ],
  "pagination": { "totalItems": 4, "totalPages": 1 },
  "summary": { "total": 4, "super_admin": 1, "admin": 1, "admin_unassigned": 0, "ops_staff": 2, "on_shift": 1, "locked": 0, "first_login_pending": 0, "attention": 0 }
}}
```
`warehouse_name` is a convenience join against the `warehouse_staff` table below (backend
change #1) — the frontend does **not** re-derive it itself. `summary` counts are over the
whole filtered set, not just the current page.

#### `GET /auth/admin/users/:id`
Single user, same shape as one row above — used to prefill the Edit User form.

#### `POST /auth/admin/users`
Creates an admin/ops-staff account.
```json
{
  "first_name": "Suresh", "last_name": "Bansal", "phone": "+91...", "email": null,
  "role": "ADMIN",
  "warehouse_id": 2,
  "shift": "MORNING",
  "password_method": "set",
  "password": "TempPass123",
  "must_change_password": true
}
```
`warehouse_id` is optional for `ADMIN`/`OPS_STAFF` (the list shows "Not assigned"), rejected (or ignored) when
`role == SUPER_ADMIN`. When `password_method` is `"set"`, hash `password` the same way
`User.model.js`'s `beforeCreate` hook already does; when `"link"`, generate a random
password server-side (never left blank/null) and send a set-password SMS instead — see
backend change #2 for why a `notification-service` call is required either way. Response:
```json
{ "success": true, "message": "User created", "data": {
  "id": 41, "phone": "+91...",
  "temporary_password": "TempPass123",
  "invite_sent": false
} }
```
`temporary_password` is echoed back **only in this one response** — it's a plaintext value
derived from a one-way hash, unrecoverable afterwards, which is exactly why the frontend's
success screen (`StaffNewPage.jsx`) says so and why "Resend login details" (below) can't
just "show it again".

#### `PUT /auth/admin/users/:id`
Body: `{ first_name, last_name, phone, email, role, warehouse_id }` — no password fields;
`StaffNewPage.jsx`'s edit mode deliberately excludes them, editing is a separate concern
handled by reset-password below.

#### `PATCH /auth/admin/users/:id/status`
Body: `{ "is_active": false }`. Disables/enables login without deleting the account —
reuses the existing `is_active` column, no migration needed for this one.

#### `POST /auth/admin/users/:id/reset-password`
Body: same `password_method`/`password` shape as create. Returns a fresh
`temporary_password` (method `"set"`) or resends a link (method `"link"`).

#### `POST /auth/admin/users/:id/resend-invite`
No body. Only meaningful while `must_change_password` is still `true` for that user (see
backend change #4) — since the original password can't be recovered, this generates a
**new** temporary password/link and sends it, same response shape as reset-password. If
the user already changed their password, return a 409 telling the caller to use
reset-password instead.

### inventory-service — warehouse team & settings (new, under the existing `/warehouses` gateway prefix)

#### `GET /warehouses/:id/team`
```json
{ "success": true, "data": { "team": [
  { "user_id": 12, "assigned_at": "2026-09-01T..." }
] } }
```
Deliberately **not** enriched with name/phone/role — inventory-service has no user data
and this codebase has no service-to-service call convention (confirmed: nothing in any
service calls another service over HTTP; everything is either fully decoupled or
duplicated data, e.g. `user-addresses` living in auth-service rather than user-service).
The frontend joins this against `GET /auth/admin/users` (already fetched for the Staff
page) by `user_id` — see `WarehouseDetailPage.jsx`'s `members`. "Manager" vs "staff"
in the Team tab UI is likewise not a stored value: it's derived from whether that
`user_id`'s own `role` is `ADMIN` or `OPS_STAFF`, exactly per [[STORE_OPERATIONS_MODULE]]
backend change #4's `WarehouseStaff` design ("role... derived from the user's existing
`OPS_STAFF`/`ADMIN` role, not a new column") — **this doc reuses that same table**, see
backend change #1.

#### `POST /warehouses/:id/team`
Body: `{ "user_id": 12 }`. Assigns a staff/admin user to this warehouse. Should enforce
"one warehouse per person" (move, not duplicate, if already assigned elsewhere) inside a
transaction — same shape of rule the artifact's own warning banner describes.

#### `DELETE /warehouses/:id/team/:userId`
Unassigns.

#### `PATCH /warehouses/:id/settings`
Body (all optional, all new nullable columns — see backend change #5):
```json
{
  "operational_status": "OPEN",
  "store_open_time": "08:00",
  "store_close_time": "22:00",
  "pack_by_minutes": 15,
  "max_orders_per_slot": 40,
  "auto_assign_riders": false,
  "pincode": "140301",
  "racks": ["A-1", "A-2", "COLD-1"],
  "pause_reason": "Too many orders right now",
  "paused_until": "2026-09-26T12:30:00Z",
  "maintenance_message": "Back tomorrow at 6 AM"
}
```
`paused_until: null` means paused until someone reopens it. `GET /warehouses/:id` should
return these fields so the Settings tab and list show the saved values.

## Backend changes required (none made in this pass)

1. **New `warehouse_staff` join table in inventory-service** — `id`, `user_id` (BIGINT,
   references `auth_users.id` loosely — no cross-service FK, same pattern as
   `DeliveryPartner.user_id`), `warehouse_id` (FK → `warehouses.id`), `assigned_at`. No
   `role`/`role_at_warehouse` column — manager-vs-staff is derived from the assigned
   user's own `role`, exactly as already decided in [[STORE_OPERATIONS_MODULE]] backend
   change #4. **Build this once, shared by both modules** — that doc explicitly says its
   own "Assign staff" screen and this module's should use the same table; don't let two
   branches each invent their own.
   - `user_id` is BIGINT (`auth_users.id`), **not** the `uuid` column — confirmed by
     reading `User.model.js`: `id` is the `BIGINT autoIncrement` primary key, `uuid` is a
     separate unique column. Every JWT payload in `auth.service.js` carries
     `user_id: user.id` (the BIGINT), so resolving `req.user.user_id` against this table
     needs the BIGINT, not the UUID — a mismatch here would silently return no team for
     every warehouse.
   - Unique constraint on `user_id` enforces "one warehouse per person" at the DB level,
     not just in service logic.

2. **No admin-facing user-creation endpoint exists anywhere.** Confirmed by reading
   `auth.routes.js`: only `/signup` (self-serve, OTP-verified, no role/warehouse input) and
   `/register` (authenticated, but same shape) exist. The new `/auth/admin/users*` routes
   above are additive, not a repurpose of either. Creating a user with `password_method:
   "link"`, and resending login details generally, needs an SMS send — reuse whatever
   `notification-service` call `otp.service.js` already makes for OTP delivery rather than
   inventing a second SMS integration.

3. **auth-service has no `requireRole` middleware at all.** Confirmed by reading
   `auth-service/src/middleware/auth.js` — it exports only `authenticateToken`. Every
   other service-specific `middleware/auth.js` (`inventory`, `delivery`, `product`,
   `cart`) has its own `requireRole`; auth-service needs one added, matching the working
   `order-service`/`delivery-service` shape (`roles.includes(req.user.role)`, not the
   `role === "X" || "Y"` bug described next), then wired onto every new
   `/auth/admin/users*` route as `requireRole(["SUPER_ADMIN"])`. Per `backend/CLAUDE.md`,
   factor the role list into a small constants file rather than repeating the literal
   `"SUPER_ADMIN"` string across routes — no shared `Roles` module exists anywhere in the
   repo yet, so this would be the first one; [[STORE_OPERATIONS_MODULE]]'s role checks
   should eventually move to the same module rather than each service growing its own.

4. **`must_change_password` doesn't exist on `AuthUser`.** Needed so the UI can show
   "must change password" status and so `resend-invite` (API #6 above) knows whether the
   original temporary password/link is still outstanding or already superseded. Add as a
   `BOOLEAN NOT NULL DEFAULT false` column + migration; set `true` on admin-created
   accounts with `password_method: "set"`, cleared by whatever login/change-password flow
   already exists for shoppers (check `auth.service.js` around the password-change path
   before adding a second write site for it).

5. **`Warehouse.model.js` has no operational-settings columns.** `store_open_time`,
   `store_close_time`, `pack_by_minutes`, `max_orders_per_slot`, `auto_assign_riders`,
   `operational_status` (`ENUM('OPEN','PAUSED','MAINTENANCE')`, default `'OPEN'`) are all
   new nullable/defaulted columns via migration — purely additive, no existing consumer of
   `Warehouse` needs to change. This is the same "additive columns over a new status
   machine" call [[STORE_OPERATIONS_MODULE]] backend change #3 made for `Order`.

6. **Warehouse write routes have no role gating at all today — and reads have no auth at
   all.** Confirmed by reading `inventory-service/warehouse.routes.js`:
   `GET /warehouses` and `GET /warehouses/:id` have **no middleware whatsoever** (fully
   public, no token required), and `POST`/`PUT`/`DELETE` only call `authenticateToken` —
   never `requireRole` — so today *any* authenticated user of *any* role (including
   `CUSTOMER` or `DELIVERY_PARTNER`) can create, edit or delete a warehouse. This predates
   this module and isn't something the new team/settings routes should copy:
   - New routes (`GET/POST/DELETE .../team`, `PATCH .../settings`) must add
     `authenticateToken` + `requireRole(["SUPER_ADMIN","ADMIN"])` from the start.
   - Recommend also closing the existing gap on `POST`/`PUT`/`DELETE /warehouses` in the
     same pass (add the same `requireRole`) — and separately deciding whether the list/get
     routes should require at least `authenticateToken`, since they currently leak every
     warehouse's address/contact-person/phone to an unauthenticated caller.
   - This is the same class of bug flagged for a *different* service in
     [[STORE_OPERATIONS_MODULE]] backend change #6 (`inventory-service`'s
     `authenticateToken` has an always-true `role === "ADMIN" || "SUPER_ADMIN"`
     condition and sets `req.user` to a bare id instead of the decoded payload) — still
     unfixed as of this doc. Both bugs are in the same file
     (`inventory-service/src/middleware/auth.js`) and must be fixed together before
     `requireRole` on the new warehouse routes will work at all: `requireRole` reads
     `req.user.role`, which is `undefined` while `req.user` is a bare id.

## How this ties into the Store Operations module

[[STORE_OPERATIONS_MODULE]]'s backend change #4 already anticipated this module and asked
for the `warehouse_staff` table to be "shared by both" — this doc is that follow-through,
not a competing design. Once `warehouse_staff` exists, that module's `GET /store/me` can
resolve "my warehouse" from the same table this module's Team tab manages, so a
`SUPER_ADMIN` assigning someone here is the same action as that module's own resolution
path — one table, two UIs.

## Deferred (not in this pass, tracked for later)

- **Operational settings actually changing behaviour** (auto-assign-riders wiring into
  order assignment, pack-by-minutes feeding into SLA timers) — this doc only covers
  persisting the fields; using them is out of scope here, same as
  [[STORE_OPERATIONS_MODULE]]'s own "Deferred" list.
- **Bulk actions** (the artifact's row checkboxes/bulk-disable) — not built; every action
  in `StaffTable.jsx` is single-row.
- **Audit log for staff actions** (who created/disabled which account) — `auth-service`
  already has an `AuditLog` model used elsewhere; extending it to cover admin-user actions
  is straightforward once the endpoints above exist, but isn't required for the UI to
  work and wasn't assumed by any frontend code in this pass.
