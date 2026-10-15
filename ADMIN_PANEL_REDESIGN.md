# Admin Panel Redesign — Open Items

Tracks what is still **not done** from the [design canvas](https://claude.ai/artifact/J1HCuqYpBWVoVNBUJ8eazx) on branch `feature/admin-panel-redesign`. All 20 artboards are implemented; completed work was removed from this file on 2026-10-06 and is recorded in `task_Logger.md` (tasks) and git history.

**How to use this file:** add an item when something is deferred or left fabricated, and delete it when it is done.

## Open items

### Still fabricated (demo data, marked in the UI)
- **Order detail:** Picked by and Rider (`getDemoFulfilment` in `client/src/lib/orderDemoData.js`). No picker data exists. The rider can come from delivery-service assignments, not wired yet.
- **Dashboard:** needs-attention card (all three numbers fake, in `overviewDemoData.js`). **Deferred, will be done later (decided 2026-10-06).**
- **Settings page:** fabricated except the Profile card. `config-service` is built now (`GET /config`, `PATCH /config/:group` for `general` and `orderRules`; see `BACKEND_REQUIREMENTS.md` #13) but the page is not wired to it. The Notifications tab has no backend (per-admin prefs, `notification-service` is empty). order-service still hard-codes its 15-minute timers, so the order-rule values are not read anywhere yet.

### Buttons that only show a "not wired up yet" toast
- Orders: **Export** (also Customers). Plan in `ORDERS_API_PLAN.md` §4.
- Order detail: **Invoice** (no invoice endpoint) and **Issue refund** (the endpoint `POST /orders/:orderId/payment/refund` exists for admin roles; whether the button should call it is undecided).
- Products: **Import CSV**. Product detail: **Preview**. Dashboard: Staff accounts shortcut. (Its Partner applications card now links to the Delivery partners page; the count is still demo data.)

### Backend gaps

- **Notifications:** `notification-service` is an empty folder. Plan in `ORDERS_API_PLAN.md` §4.
- **Delivery partners:** all 20 screens of the Freshly Delivery Partner UI canvas are built on demo data (`client/src/lib/partnerDemoData.js`, each page says so): admin pages under `/dashboard/delivery-partners` (list with Applications / Partners tabs, review with the six-tick checklist, partner detail, add partner), the partner phone app at `/partner/*` (phone-only; the desktop workspace was removed) and self sign-up at `/partner/apply/*`. The partner routes have no login guard yet. Buttons that need new endpoints show a "not wired up yet" toast. Backend work is items 16–28 in `BACKEND_REQUIREMENTS.md`.
- **Staff & admins:** no backend and no design artboard. The sidebar item stays disabled with a "Soon" tag.
- **Customers page:** the **Repeat** filter is not built (needs order data to filter and paginate; the list lives in auth-service, orders in order-service). Block / Unblock is built. Known limit: a blocked customer's access token (15 min) keeps working in the other services until it expires, because they verify the JWT locally.
- **Image upload:** `product-service` has no file-upload endpoint, so the Brands logo and the Product images tab take a URL, not an upload. Drag-to-reorder images is not built (no sort-order saving).
- **Refresh cookie:** `/auth/refresh-token` always reissues the 7-day cookie, so a "don't remember me" login becomes persistent after its first silent refresh. A full fix needs a `remembered` flag on each refresh-token record. Minor.
- Other gaps found while building the later pages are listed in `BACKEND_REQUIREMENTS.md`.

### Later improvements
- **Dashboard load time:** the admin dashboard is still the heaviest first load (about 237 kB gzip), mostly chart code. Lazy-load the chart separately with `React.lazy` and its own `Suspense` skeleton. Optional: `manualChunks` for vendor libraries, preload the next route on sidebar hover, a Lighthouse before/after run.
- **Orders stats:** no per-warehouse breakdown yet.

### Decided, not building
- **Zone ↔ warehouse link:** a delivery zone will not get a `warehouse_id` (decided 2026-10-06). The Zones table has no Warehouse column.
- **Variants page:** the global, warehouse-scoped Variants artboard will not be built. The per-product "pick a product, manage its variants" page stays.

### Unused files left in the codebase
Kept on purpose, delete when you are sure they are not needed: `OrderStatusBoard.jsx` (old Kanban board, would return a 400 now that orders need a warehouse), `SalesChart.jsx`, `RecentOrders.jsx`, `LowStockAlert.jsx`, `StatCard.jsx`.
