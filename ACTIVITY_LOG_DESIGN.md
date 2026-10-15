Audience: developers who will build the rest of the logging.

# Activity log — what is built, what is not, and how to build the rest

Status: Security, Onboarding and Sources tabs built. System tab and everything in section 3 not built. Date: 2026-10-15.
Covers the admin page `/dashboard/activity-log` (`client/src/pages/dashboard/ActivityLog.jsx`). `SystemTab.jsx` points here.
Out of scope: shipping logs to an outside tool (Datadog, ELK), metrics, alerting, anything customer-facing.
Written from the code only. The dev database was not queried and no container was run. Anything marked "not verified" was not checked. Line numbers are as of this date; search by function name if they moved.
Size key: S = under half a day, M = one to two days, L = more than two days. Rough guesses.

## 1. Status at a glance

| Tab / source | Built? | Data comes from | Who can open it |
|---|---|---|---|
| Security | Yes | auth-service table `auth_audit_logs`, `GET /auth/admin/audit-logs` | ADMIN, SUPER_ADMIN |
| Onboarding | Yes | delivery-service table `delivery_partner_application_events`, `GET /delivery-partners/applications/events` | ADMIN, SUPER_ADMIN |
| System | No. Shows a "not collected yet" note | Nothing. Service warnings and errors go to each container's console, and in production also to `logs/error.log` and `logs/combined.log` (winston `Logger.js`) | Page: ADMIN, SUPER_ADMIN |
| Sources | Yes, for two sources | Live counts from the `meta` of the two endpoints, plus a hand-written table in `SourcesTab.jsx` | Same |
| Order, delivery and stock history | Stored, not on the page | `order_status_history`, `delivery_status_history`, `stock_movements`. Stock movements have their own page (`StockMovementPage`) | Not applicable |

The sidebar item is hidden for other roles (`FreshlySidebar.jsx`, `adminOnly`). The route redirects them (`ActivityLog.jsx`). Both servers answer 403.

## 2. What is built

### 2.1 The two endpoints

| | Security | Onboarding |
|---|---|---|
| URL | `GET /auth/admin/audit-logs` | `GET /delivery-partners/applications/events` |
| Server code | `auth-service/src/modules/auditLog/{auditLog.routes,auditLog.controller,auditLog.service}.js`. Query in `modules/repository/audit.repository.js` (`findPage`, `stats`) | `delivery-service/.../partnerApplication/partnerApplication.routes.js` (`/events`, registered above `/`), `PartnerReviewService.activity`, `PartnerApplicationEventRepository.findActivity` and `stats` |
| Role check | `requireRole(...ADMIN_ROLES)`, from `auth-service/src/constants/roles.js` | `deciderOnly` = ADMIN, SUPER_ADMIN |
| Filter groups | `inout`, `failed`, `password`, `lock` (`GROUPS` in `auditLog.service.js`) | `flow`, `docs`, `checks`, `decisions` (`ACTIVITY_GROUPS` in `partnerApplicationRules.js`) |
| Bad input | `AppError` 400 from the service | Joi `partnerActivityQuerySchema` in `middleware/validate.js` |
| `search` matches | Substring (`iLike`) of phone, email, IP, or the account's own phone. Exact user id when all digits | Substring of applicant name or phone. Reference (`FR-P-1042`, `P1042`, `1042`). Exact staff id when all digits |
| `meta` | `total`, `with_ip`, `with_user_agent`, `with_device`, `oldest_at` | `total`, `latest_at` |

Params for both: `group`, `hours` (1, 24, 168 or 720; default 24), `search` (trimmed, 100 characters at most), `page` (1 or more), `limit` (default 20, at most 100).
Order is newest first, `created_at DESC, id DESC`. The time window is `Date.now() - hours`, computed on the server.

Response goes through `ResponseUtil`: `{ success, message, data: { events, pagination, meta } }`. The client unwraps `response.data.data`.
`pagination` is `{ totalItems, totalPages, currentPage, limit, hasNextPage, hasPrevPage }`.
Security event fields: `id, created_at, event_type, status, user_id, phone, email, name, ip_address, user_agent, device_id, error_message, details`. Phone and email fall back to the account's when the row has none.
Onboarding event fields: `id, created_at, type, actor_id, actor_role, payload, application { id, ref, name, vehicle_type, status, source }`.

### 2.2 Live checks

Dev only. Both refuse to run when `NODE_ENV=production`, need the container up, and delete their own rows before and after.

```
docker compose exec -T auth-service node auditLog.check.js
docker compose exec -T delivery-service node activityLog.check.js
```

`auditLog.check.js` uses throwaway users with phones `60000000(41-43)`. `activityLog.check.js` uses fake applications 993001-993002. If a check fails once and passes unchanged on a rerun, suspect the Docker VM clock (it steps about every 30 seconds in this dev setup; observed, not from code).

### 2.3 Client files

| File | Job |
|---|---|
| `client/src/pages/dashboard/ActivityLog.jsx` | Page, four tabs, range select, refresh. Tab and range live in the URL (`?tab=`, `?hours=`) |
| `client/src/lib/activityLog.js` | Role list `ACTIVITY_ADMIN_ROLES`, ranges, filter chips, event labels and colours, `shortAgent`, IST time helpers |
| `client/src/apis/activityLogApi.js` | `security(params)` and `onboarding(params)` |
| `client/src/hooks/use-activityLog.js` | `useSecurityLog`, `useOnboardingLog`, `useLogFilters` (chip, debounced search, page) |
| `client/src/components/dashboard/activity/` | `SecurityTab`, `OnboardingTab`, `SystemTab`, `SourcesTab`, and `LogParts` (`LogFilters`, `LogTable`, `DetailCard`, `Fields`, `CodeBlock`, `Pill`, `Note`) |

Servers store UTC. The client shows Asia/Kolkata through `fullIST`, `timeIST` and `dayIST`. Nothing on the server is time-zone aware.

## 3. What is not built

### 3.1 Capture IP, user agent and device id in audit rows

**Where it lives.** `auth-service/src/modules/auth/auth.controller.js` (`loginWithPassword`), `auth.service.js` (the `logEvent` calls at lines ~432, 465, 482, 546, 705, 794, 861), `adminUser.service.js` (~101, block and unblock), `auth-service/src/app.js`, `api-gateway/src/proxy/proxy.register.js`.

**What is wrong today (verified in code).**
- `ip_address` is never put on an audit row. The only `req.ip` read in auth-service is in `register()` (~361, for the refresh-token row) and in the unused middleware `src/middleware/auditLog.js`.
- User agent and device id are passed, but only on three sign-in rows: wrong password, deactivated account, success. The "Account locked" row, `LOGOUT`, both password-reset rows and the admin block row carry neither.
- The web client never sends `x-device-id` (no use in `client/src`), so `device_id` is empty for web sign-ins.
- Behind the gateway, `req.ip` is the gateway container. `proxy.register.js` does not set `xfwd`, so no `x-forwarded-for` is added, and no service calls `app.set("trust proxy")`.
- The same cause affects rate limiting. The limiter in `app.js` keys on `req.ip`, so every client appears to share one bucket (inferred from the code, not measured).

**What is needed.** The real client address on every audit row, from one helper.

**How to implement.**
1. Gateway, `proxy.register.js`, in the existing `on` block: `proxyReq: (proxyReq, req) => proxyReq.setHeader("x-forwarded-for", req.ip)`. This overwrites what the caller sent, so it cannot be spoofed. Do not use `xfwd: true`; it appends to a caller-supplied header. The gateway is the public edge (compose publishes port 4000). If a proxy or load balancer is later put in front of it, set `app.set("trust proxy", 1)` in the gateway and recheck.
2. Every service behind the gateway: `app.set("trust proxy", 1)` (one hop). Auth-service first (Express 4, `src/app.js`). Do the other six (product, inventory, delivery, cart, order, config) in the same change. The Express 5 services use `express-rate-limit` 8, which contains the check `ERR_ERL_FORWARDED_HEADER`. By the library's docs it reports an error when `x-forwarded-for` arrives and trust proxy is off (not run here).
3. New `auth-service/src/utils/clientInfo.js`:
   ```js
   export const clientInfo = (req) => ({
     ip_address: req.ip?.replace(/^::ffff:/, "") ?? null,
     user_agent: req.headers["user-agent"]?.slice(0, 500) ?? null,
     device_id: req.headers["x-device-id"]?.slice(0, 100) ?? null,
   });
   ```
   Controllers call it and pass one `client` argument down. Services spread `...client` into `logEvent` and into the refresh-token and session rows (both tables have `ip_address`). This replaces the separate `deviceId, userAgent` parameters of `loginWithPassword`. Cover sign-in, logout, forgot and reset password, and `setCustomerStatus` (there it is the admin's address).
4. The failure-path `logEvent` calls in `loginWithPassword` are awaited with no try/catch (only the success write is wrapped). An insert failure turns a wrong-password 400 into a 500. Put non-transactional audit writes behind one helper that catches and logs a warning. Keep the block/unblock write inside its transaction on purpose.
5. Delete `src/middleware/auditLog.js` (nothing imports it). It stores the whole response body (`error: body`) and the URL with its query string in `details`. Do not wire it up as it is.
6. `SecurityTab.jsx` shows the "IP address is recorded on X of Y" banner while `with_ip < total`. Old rows never get an IP, so the banner stays forever. Change the condition or the wording in the same change.

**How to check it works.** Add to `auditLog.check.js`: a failed password sign-in sent straight to auth-service with `x-forwarded-for: 203.0.113.9`; the newest row's `ip_address` must equal it. By hand through the gateway: `curl -s http://127.0.0.1:4000/auth/login/password -H "x-forwarded-for: 1.2.3.4" ...` must store the socket address, not `1.2.3.4`. In Docker Desktop that address will be a Docker bridge address, not your LAN address (not verified). Expect rate-limit 429s to become per client.

**Size.** M. One real side effect: rate-limit buckets change.

### 3.2 Write the nine event types that are never written

**Where it lives.** Enum in `auth-service/src/models/AuditLog.model.js`. Postgres type `enum_auth_audit_logs_event_type` (migration `20260610171204-created-auditlog-table.cjs`).

**What is wrong today.** The enum has 16 values. Seven are written: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS` (all in `auth.service.js`), `ACCOUNT_LOCKED` and `ACCOUNT_UNLOCKED` (only in `adminUser.service.js`). The admin block path already records the acting admin as `details.by_admin_id`. The Security tab shows it only inside the raw Details JSON.

**Decision per type.**

| Type | Why it is not written | Decision |
|---|---|---|
| `LOGOUT_ALL` | `logoutFromAllDevices` never calls `logEvent`. Worse, the endpoint cannot be reached: `auth.routes.js:23` is `router.post('logout/all', ...)` with no leading slash, and `auth.controller.js:138` names its second parameter `re`, so `res` is undefined | Fix the route and the typo, then write one row |
| `PASSWORD_CHANGE` | No change-password route exists | Keep. Write it when that route is built |
| `ROLE_CHANGE` | No route changes a role | Keep. Write with `details: { from, to, by_admin_id }` when role editing exists. It is the most important audit event on this list |
| `OTP_SENT` | OTPs go out from `signup` (two sends, ~113 and ~157), `forgotPassword` (~792) and `otp.service.js` `resendOtp` (~132); none audit | Write. `details: { purpose }`. Never the code |
| `OTP_VERIFIED` | `verify()` (~202) does not audit | Write on success. Write on a wrong code as `status: "FAILURE"` |
| `TOKEN_REVOKED` | Refresh-token reuse only calls `logger.warn` (~619) | Write on reuse detection only, `status: "FAILURE"`, `details: { family_id }`. This is the theft signal |
| `TOKEN_REFRESH` | Would be one row per user every ~15 minutes: high volume, low value | Never write |
| `SESSION_EXPIRED` | Nothing expires sessions actively; there is no scheduler in auth-service (grep) | Never write |
| `PROFILE_UPDATED` | No edit-profile route (`register()` completes a profile) | Never write until the route exists |

Two gaps inside types that are already written:
- Automatic lockout. After `MAX_LOGIN_ATTEMPTS` (default 5) the code sets `account_locked_until` and writes only a `LOGIN_FAILURE` row with `{ attempt }`. No `ACCOUNT_LOCKED` row, and nothing when the lock expires. Write `ACCOUNT_LOCKED` with `details: { reason: "TOO_MANY_ATTEMPTS", until }` and no admin id.
- Unknown account. `loginWithPassword` throws 404 "User Not Found." before any audit row, so sign-in attempts on numbers that do not exist are invisible. Write `LOGIN_FAILURE` with `user_id: null`, the typed phone or email and `error_message: "Unknown account"`. Do the same for the "Finish sign-up first" branch. (The 404 itself tells a caller which numbers exist. That is a separate issue.)

**How to implement.**
1. Do not remove values from the enum. Postgres has no `DROP VALUE`; removing one means creating a new type, `ALTER COLUMN ... USING event_type::text::new_type`, and dropping the old one. That is cost with no gain. Leave unused values in place and never write them.
2. Adding a value later is a migration: `ALTER TYPE "enum_auth_audit_logs_event_type" ADD VALUE 'NEW_TYPE'`. Update the Sequelize enum in the model in the same change.
3. Update four lists together (section 5): `GROUPS` in `auditLog.service.js`, `SECURITY_GROUPS` and `SECURITY_EVENT` in `client/src/lib/activityLog.js`. `OTP_*` and `TOKEN_REVOKED` fit no current group; add one (for example `otp`) or they show only under "All".
4. Show `by_admin_id` in the `SecurityTab.jsx` detail card as its own field (small client change).

**How to check it works.** Extend `auditLog.check.js` per event: trigger the flow, read the newest row through the endpoint, assert `event_type`, `status`, and that `details` holds no code or token.

**Size.** M (S per event).

### 3.3 Service name and request id on every log line

**Where it lives.** `src/utils/Logger.js` in nine services (api-gateway, auth, cart, config, delivery, inventory, order, product, user; user-service is commented out in compose). `notification-service` and `payment-service` have no logger. Each service's `app.js` request-log middleware. `api-gateway/src/middleware/logger.js`.

**What is wrong today (verified).**
- No line carries a service name or a request id. The dev console format (`consoleLogFormat`) prints only timestamp, level and message, so any metadata object is dropped in development. (In production `json()` prints all fields.)
- The gateway logs `METHOD originalUrl` when the request starts. No status, no duration, no user. `originalUrl` includes the query string and, on the signed-file route, the token (`.../files/<token>`). Delivery-service already hides that token in its own lines (`loggable` in `delivery-service/app.js`); the gateway does not.
- Each service logs `METHOD path` per request and `status | message | METHOD originalUrl` in its error handler. There is no shared package, so every change below is copied per service. The six `Logger.js` copies for auth, cart, delivery, inventory, order and product are byte-identical.

**What is needed.** One id that follows a request across services, and a `service` field on every line.

**How to implement.**
1. `Logger.js` in every service: add `defaultMeta: { service: "<name>" }`. Add a format step that copies `requestId` from the request context into each line. Change `consoleLogFormat` to print `[service] [requestId]` or the dev console will not show them.
2. New `src/utils/requestContext.js` in each service: an `AsyncLocalStorage` from `node:async_hooks` (standard library, no dependency). Deep code then logs the id without receiving `req`.
3. Gateway, new `src/middleware/requestId.js`, registered before `requestLogger`. Reuse an incoming `x-request-id` only if it matches `^[\w-]{8,64}$` (stops log injection); otherwise `crypto.randomUUID()`. Set it on `req.headers` (the proxy forwards request headers) and on the response. Add `exposedHeaders: ["x-request-id"]` to the gateway `cors()` call in `server.js` so a browser can read it.
4. Gateway `requestLogger`: log on `res.on("finish")`: method, `req.path` (no query string), status, duration in ms, user id. The gateway has no JWT secret or library, so user id comes from decoding the token payload without verifying it (`split(".")[1]`, base64url, `JSON.parse`, in a try/catch). Log `user_id` only, mark it unverified, never log the token.
5. Each service's request middleware (replace the existing `logger.info` one): read the header, store it with `als.run`, set it on the response, keep the existing line.
6. Outbound calls: add `x-request-id` from the store in `delivery-service/src/utils/authClient.js`, `delivery-service/src/modules/handleOrder/handleOrder.service.js`, `delivery-service/src/modules/deliveryPartner/deliveryPartner.service.js`, `cart-service/src/modules/addToCart/addToCart.service.js`.
7. Change the error handler in all eight `app.js` files from `logger.error` to `logger.warn` when the status is below 500. Today every `AppError`, including a wrong password (400) or a missing record (404), is logged at error level. The System tab (3.4) would fill with that.

**How to check it works.** `curl -si -H "x-request-id: test-req-0001" http://127.0.0.1:4000/auth/health` returns the same header. `docker compose logs api-gateway auth-service | grep test-req-0001` shows lines from both, each with a service name. `curl` without the header returns a generated id. A header with a newline or 200 characters is replaced.

**Size.** M. Mechanical but touches every service.

### 3.4 System tab data source

**Where it lives.** Nothing exists. Today: `SystemTab.jsx` (static note) and the per-service winston loggers.

**Decisions.**

| # | Decision | Choice | Why |
|---|---|---|---|
| S1 | Owner of the table | auth-service, as a new module `systemLog` next to `auditLog` | It already has the admin route pattern (`requireRole(...ADMIN_ROLES)`), the internal route with `x-internal-key` (`/internal/partners`, `middleware/internalKey.js`), a repository with `findPage` and `stats`, and a check script to copy. `config-service` holds admin settings only (`Setting` key-value model) and has no internal-key code. A twelfth service for logs is more than this needs |
| S2 | How other services send rows | HTTP `POST /internal/system-logs` with `x-internal-key` | All services share one database `freshly` (their `.env` files, checked for seven), so a direct insert would work. It would also break "one service owns its tables" from `backend/CLAUDE.md`. `/internal` is not in the gateway config, so it is unreachable from outside (comment in `app.js`) |
| S3 | What is stored | Level `warn` and `error` only. Never `info`, never `debug` | Volume, and info lines are where request detail and OTPs live |
| S4 | Who can read | ADMIN, SUPER_ADMIN, same as the rest of the page | No stacks are stored, only a redacted message. If stacks are ever added, restrict to SUPER_ADMIN |
| S5 | Logging must never hurt a request | Fire and forget, bounded buffer, errors swallowed | See "Failure mode" |

**Table `system_logs`** (migration in `auth-service/migrations/`, model `SystemLog.model.js`, `createdAt` only):

| Column | Type | Note |
|---|---|---|
| `id` | BIGSERIAL primary key | |
| `created_at` | TIMESTAMPTZ, not null | Time the service wrote the line, not the insert time |
| `level` | VARCHAR(8) | `warn` or `error`. A string with a CHECK, not an enum (see 3.2) |
| `service` | VARCHAR(40), not null | |
| `message` | TEXT | Redacted, cut at 1000 characters |
| `request_id` | VARCHAR(64), null | From 3.3 |
| `route` | VARCHAR(200), null | `METHOD /path`, no query string |
| `status_code` | SMALLINT, null | |
| `user_id` | BIGINT, null | From a verified token inside the service |
| `meta` | JSONB, null | Allowlist only: `name`, `code`, `statusCode` |

Indexes: `(created_at)`, `(service, created_at)`, `(request_id)`.

**Transport.** A class extending `Transport` from `winston-transport` (installed with winston; declare it in `package.json`), added in every service's `Logger.js` with `level: "warn"`. In auth-service it inserts through the repository. In every other service it posts to auth-service. Behaviour:
- Redact first (below), then buffer. Secrets never leave the process.
- Flush every 10 seconds or at 50 rows, in one request of at most 100 rows. Timeout 2 seconds (`AbortSignal.timeout`).
- Buffer limit 500 rows. When full, drop the oldest and count the drops. `unref()` the timer. Best-effort flush on `SIGTERM`.
- On any failure: swallow it. Do not call `logger` from inside the transport (that loops). At most one line a minute to `process.stderr`.
- Receiving route: validate, redact again (anyone with the key can post), insert, answer 202. Mount `/internal` above the rate limiter in `auth-service/src/app.js` (today the limiter runs first, 100 requests per 15 minutes per address; eight shippers would hit it).
- Env: each shipping service needs `INTERNAL_API_KEY` and `AUTH_SERVICE_URL`. Delivery-service already has both. `auth-service/.env` is tracked in git and holds the real key; keep that key out of every commit.

**Redaction** (one function `redact(text)`, copied per service, plus once in auth-service):

| Input | Becomes | Why |
|---|---|---|
| Any record containing `[sms:console]` | Dropped entirely | The console SMS provider logs the whole text, OTP included (`utils/sms/console.provider.js`, in both auth and delivery) |
| `?` and everything after it in a URL or path | `?[query]` | Error lines log `req.originalUrl`; the Activity log's own search sends phone numbers in the query |
| `otp`, `code`, `pin` followed by 4-8 digits | `otp=[redacted]` | |
| `eyJ...` three-part tokens, `Bearer <x>` | `[jwt]`, `Bearer [redacted]` | |
| `/files/<token>` | `/files/[token]` | Same rule as `loggable` in delivery-service |
| `scheme://user:pass@host` | `[url]` | Connection strings |
| `password`, `secret`, `token`, `api_key`, `authorization` followed by `:` or `=` and a value | key kept, value `[redacted]` | |
| 10-digit Indian mobile numbers | `98******10` (first two, last two) | Phone is personal data |
| Emails | `a***@domain` | |

Add `redact.check.js` in the style of the other `*.check.js` files: a table of input and expected output, plain `assert`.

**Endpoint.** `GET /auth/admin/system-logs` (the gateway already forwards `/auth`). Params: `group` (`error`, `warn`), `service`, `hours`, `search` (message substring or exact `request_id`), `page`, `limit`. Answer `{ events, pagination, meta }` with `meta: { total, oldest_at }`. Admin roles only.

**Client.**
1. `activityLogApi.system(params)`, hook `useSystemLog` in `use-activityLog.js`.
2. `SystemTab.jsx` copies the shape of `SecurityTab.jsx`: `LogFilters` (chips All, Errors, Warnings; add a service select next to it), `LogTable`, `DetailCard` with `Fields` (when, service, level, route, status, user, request id) and a `CodeBlock` for `meta`. `useLogFilters` needs one extra argument so a service change resets the page.
3. `lib/activityLog.js`: `SYSTEM_GROUPS`, a level colour map.
4. `ActivityLog.jsx`: show the range select on the System tab (remove `tab !== "system"` from the condition) and pass `hours`. Retention is 14 days, so the 30-day option returns at most 14.
5. `SourcesTab.jsx`: a live count tile, and change the gateway and "Other services" rows from "Text log only" to "Shown in System".

**How to check it works.** New `auth-service/systemLog.check.js`, modelled on `auditLog.check.js`: post a row with the internal key; post one with a wrong key (401); post a message holding a fake OTP, a phone number, a JWT and a URL with a query string and assert the stored text is redacted; read through an admin token; an OPS_STAFF token gets 403; delete own rows. By hand: stop `postgres` for ten seconds and confirm requests still answer and the buffer does not grow past its limit.

**Size.** L. Slices: table, routes and redaction (M); transport copied into eight services (M); client tab (S).

### 3.5 Order, delivery and stock history on the page

**Where it lives.** Order-service `order_status_history` (written at ten places in `order.service.js`; columns `order_id, old_status, new_status, changed_by, remarks, created_at`). Delivery-service `delivery_status_history` (`order_id, delivery_partner_id, status, remarks, created_at`; written in `handleOrder.service.js` ~111 and ~483, and `partnerReview.service.js` ~599 on approval). Inventory-service `stock_movements` (own page).

**What exists.** `GET /orders/:orderId` already returns that one order's `statusHistory` (`order.service.js` ~609). Stock movements are listed at `GET /stock-movements` (`StockMovementPage`, filters `type`, `warehouse_id`). There is no feed across orders or deliveries.

**Delivery history is append-only on purpose** (`updatedAt: false` in `DeliveryStatusHistory.model.js`). Never change the model. Any change is a migration on the column.

**What is needed.** A page-level view across orders and deliveries. Each source answers separately. There is no cross-service join, so a tab never shows a customer name next to an order event (names live in auth-service). Show ids.

**How to implement.**
1. Step one (S): links only. Add rows to `SourcesTab.jsx` linking the order detail page and the stock movement page. Edit the "Stored, not shown" labels.
2. Orders tab (M). Order-service: `GET /orders/admin/status-history`, params as in 2.1, plus `group` by new status. Register it above `/:orderId` in `order.routes.js`, like `/admin/stats`. Use `requireRole("ADMIN", "SUPER_ADMIN")`. The other admin routes in that file also list `SUPPORT`, which is not in the auth role enum (CUSTOMER, ADMIN, SUPER_ADMIN, OPS_STAFF, DELIVERY_PARTNER). Join `orders` for `order_number`. Add an index on `order_status_history(created_at)`; the existing one is `(order_id, new_status)`.
3. Delivery tab (M). Delivery-service: `GET /handle-orders/status-history` with `authenticateToken, deciderOnly`. The gateway already forwards `/handle-orders`. Join `delivery_partners` for the partner name. Add an index on `delivery_status_history(created_at)` as a migration only.
4. Client: a tab per source, the same file shape as `OnboardingTab.jsx`; add API functions, hooks, chip lists and labels.
5. Stock movements stay on their own page. Before linking to it from here: `stockMovement.routes.js` has `authenticateToken` only on `POST`; the three `GET` routes have none. `GET /deliveries` in `delivery.routes.js` is the same. Not part of this work, but fix it first.

**How to check it works.** Each endpoint gets a `*.check.js` like the two existing ones (fake rows, admin token, OPS_STAFF gets 403, cleanup). The dev tables have no rows only because no order or delivery flow ran (not verified); run one order through to see the tab fill.

**Size.** S for links. M per tab.

### 3.6 Retention and volume

**Where it lives.** Nowhere. No table has a delete job. Indexes today (migrations, verified): `auth_audit_logs` has none besides the primary key. `delivery_partner_application_events` has `(application_id, created_at)`, which does not serve a feed ordered by `created_at` alone. `order_status_history` has `(order_id, new_status)`.

**What is needed.**
- An index on `created_at` for every table the page reads. Add them as migrations before the tables grow: `auth_audit_logs(created_at)`, `delivery_partner_application_events(created_at)`, and the two in 3.5. Pagination is already server-side (`limit` and `offset`).
- Retention per table:

| Table | Keep | Why |
|---|---|---|
| `system_logs` | 14 days | Operational noise |
| `auth_audit_logs` | Decide (suggest 1 year); archive, do not delete | Security record |
| `delivery_partner_application_events` | Forever | They are the applicant timeline shown on the partner detail page (`partnerReview.service.js`). Never prune them from here |
| Order and delivery history | Forever | Business records |

**How to implement.** Estimate first: `SELECT date_trunc('day', created_at) d, count(*) FROM auth_audit_logs GROUP BY 1 ORDER BY 1 DESC LIMIT 30;`. Daily rows times about 0.5 KB, times 365, gives a year of storage. As an assumption, not a measurement: 1,000 sign-ins a day is about 2,000 rows a day (each sign-in plus its sign-out or failure), so about 0.7 million rows a year. For `system_logs`, count rows per day per service the same way after one week on.
Retention job for `system_logs`: no scheduler exists in the repo. Use a `setInterval` (every 6 hours, and once at start) in auth-service `server.js` that deletes in batches: `DELETE FROM system_logs WHERE id IN (SELECT id FROM system_logs WHERE created_at < now() - interval '14 days' LIMIT 5000)`, repeated until zero rows. Safe if two instances run, because the delete is repeatable.
Archive `auth_audit_logs` when it passes a few million rows. The step up from a delete job is monthly partitions; then archiving is a detach. Not needed at current volume.

**How to check it works.** Insert a row dated 15 days ago, run the job, assert it is gone and a 13-day-old row is not. Run `EXPLAIN` on the `findPage` query after the index migration and look for an index scan on `created_at`.

**Size.** S for indexes. S for the job.

### 3.7 Access control

**Where it lives.** Server: `ADMIN_ROLES` in `auth-service/src/constants/roles.js`; `deciderOnly` in delivery-service. Client: `ACTIVITY_ADMIN_ROLES` in `lib/activityLog.js`, used by `FreshlySidebar.jsx` and `ActivityLog.jsx`.

**Today.** ADMIN and SUPER_ADMIN only. OPS_STAFF is blocked on the servers (403) and on the client, even though `App.jsx` (`ADMIN_ROLES`, line ~73) lets OPS_STAFF into the rest of the dashboard.

**Keep it that way** unless someone asks. Every new endpoint in this document uses the same two roles.

**If an `AUDITOR` role is wanted** (read the log, change nothing), decide first:
1. Which tabs. The Security tab shows phone numbers and IPs; Onboarding shows applicant names and phones. Is that acceptable for a read-only role?
2. Does the role get the rest of the dashboard? If not, the dashboard gate in `App.jsx` (`ADMIN_ROLES`) must let it in and the sidebar must hide everything else.
Then the work is: a migration `ALTER TYPE "enum_auth_users_role" ADD VALUE 'AUDITOR'` and the model enum; role constants in auth-service and delivery-service (and the other services only if it should reach them); `requireRole(...ACTIVITY_ROLES)` on the activity routes, where `ACTIVITY_ROLES = [...ADMIN_ROLES, "AUDITOR"]`; the same list in `lib/activityLog.js`; a way to assign it (there is no role-editing screen today); a `ROLE_CHANGE` audit row when it is assigned (3.2). **Size.** M.

## 4. Privacy and safety rules

From `backend/CLAUDE.md`, Logging: "Use a structured logger (winston) ... Never `console.log`/`console.error` in a request-handling path, and never log: the request body (`req.body`) — has held passwords and full cart contents in this codebase before; a raw or decoded JWT token; `DATABASE_URL` or any other credential/connection string."

Plus, for anything built from this document:
- No request or response bodies in any log row, audit row or `details`. Store named fields only.
- No tokens: access, refresh, signed file tokens. Store ids (`family_id`), not values.
- OTPs: never in a row, never in `details`, never in an error message. `[sms:console]` lines are for the developer's terminal and must never be stored. Both services refuse `SMS_PROVIDER=console` in production, but the log transport must still drop them.
- Strip query strings before storing a URL. The Activity log search sends phone numbers and user ids in the query.
- IP address is personal data. It stays in the admin-only audit table, is not copied into `system_logs`, and is not exported without a decision on retention.
- Anything exported (CSV, tickets, chat): mask phone numbers (first two and last two digits) and emails.
- Existing violation to fix, not copy: `auth.service.js` ~559 logs `guest_cart` (cart contents) at debug level. It is development-only, because the log level is `debug` only when `NODE_ENV=development`.
- The gateway log line must not gain a body, a header dump or the token (3.3).
- Logging must never break a request: catch, drop, move on (3.1 step 4, 3.4).

## 5. Known limits of what is built

- Search is a substring `iLike` (`%text%`) on up to five columns, one through a join to the user table. A btree index cannot serve a leading wildcard. Fine at current volume. Past about 1 million rows add a `pg_trgm` GIN index on the searched columns, or narrow search to exact phone and user id.
- The `meta` counts cover the whole table and run on every list request (`stats()` sits in the same `Promise.all` as the page query, in both services), so each page change does a full-table count. Cache for about a minute or switch to an estimate past about 1 million rows.
- Offset pagination: deep pages get slower, and rows arriving between page loads shift later pages. The refresh button resets it.
- Event labels live in `client/src/lib/activityLog.js` (`SECURITY_EVENT`, `onboardingDot`). Groups live in three places per source: backend (`GROUPS`, `ACTIVITY_GROUPS`), client chips (`SECURITY_GROUPS`, `ONBOARDING_GROUPS`) and the Joi list. Change them together. An unknown event type still renders (the raw name is the label) but appears only under "All".
- The range list `[1, 24, 168, 720]` is copied in three places: `RANGE_HOURS`, `ACTIVITY_HOURS`, `RANGES` in the client.
- The service table in `SourcesTab.jsx` (`SERVICES`) is static text. Edit it by hand whenever a service starts logging something. It does not read from any service.
- Staff show as `Staff #id · Role` because tokens carry no names (`actorName`). Names need a lookup in auth-service.
- The Security banner about IP stays on while any old row has no IP (3.1 step 6).
- Both checks are dev-only and need running containers.

## 6. Suggested order of work

Smallest risk first. Each step can ship alone.

1. **Indexes on `created_at`** (3.6): one migration each in `auth-service/migrations/` and `delivery-service/migrations/`. No code change.
2. **Client address on audit rows** (3.1): `api-gateway/src/proxy/proxy.register.js`, `app.js` of every service (trust proxy), new `auth-service/src/utils/clientInfo.js`, `auth.controller.js`, `auth.service.js`, `adminUser.service.js`, delete `middleware/auditLog.js`, `SecurityTab.jsx` banner, `auditLog.check.js`. Do this before step 3 so new events carry an address from the start.
3. **Missing audit events** (3.2): `auth.routes.js` and `auth.controller.js` (logout-all fix), `auth.service.js`, `otp.service.js`, `adminUser.service.js`, `auditLog.service.js` (`GROUPS`), `client/src/lib/activityLog.js`, `SecurityTab.jsx`, `auditLog.check.js`.
4. **Request id and service name** (3.3): each `src/utils/Logger.js`, new `requestContext.js` per service, each `app.js` (request middleware, error handler level), `api-gateway/src/middleware/requestId.js`, `api-gateway/src/middleware/logger.js`, `api-gateway/server.js` (CORS header), the outbound call sites listed in 3.3.
5. **Redaction function and its check** (3.4): write and test it alone before anything stores a log line.
6. **System table, routes, auth-service's own transport, retention job** (3.4, 3.6): new migration, `SystemLog.model.js`, `systemLog.repository.js`, `modules/systemLog/`, `internal.routes.js`, `auth-service/src/app.js` (mount order), `server.js` (job), `Logger.js`, `systemLog.check.js`.
7. **System tab in the client** (3.4): `activityLogApi.js`, `use-activityLog.js`, `SystemTab.jsx`, `lib/activityLog.js`, `ActivityLog.jsx`, `SourcesTab.jsx`. At this point the tab shows auth-service only; that is a safe place to stop and look.
8. **Transport in the other services** (3.4): each `Logger.js` and `.env` (`INTERNAL_API_KEY`, `AUTH_SERVICE_URL`), one service at a time, delivery-service first (it already has both values). Gateway last.
9. **Order and delivery history** (3.5): links first (`SourcesTab.jsx`), then the two endpoints, indexes, tabs.
10. **AUDITOR role** (3.7): only if asked.
