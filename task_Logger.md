# Task Logger

**Rule:** whenever anything is done in this directory (code, docs, config, bugfix, command), add an entry here. Newest at the bottom. Conclusions only. Leave out any line that doesn't apply (no "None", no empty fields).

**Fields (use only what applies):** Status · Instruction · Done · Files (created / edited, count + names) · Bug · Decision · Permission

---

## Task 1 — Create this logger
- **Status:** ✅ Done
- **Instruction:** Keep `task_Logger.md` in root; log tasks, bugs, decisions, instructions, permissions and file counts; short; write Task 1 first.
- **Done:** Created the logger with a fixed format.
- **Files:** 1 created — `task_Logger.md`
- **Decision:** Log starts from this task; earlier work not back-filled.
- **Permission:** Create/maintain `task_Logger.md`. No git actions.

## Task 2 — Make format simpler + add the logging rule here
- **Status:** ✅ Done
- **Instruction:** Put the "log everything done in the directory" rule in `task_Logger.md` (not in `ADMIN_PANEL_REDESIGN.md`); keep it simple; don't write fields that don't apply.
- **Done:** Added the rule at the top; changed tables to short bullet lists; dropped empty fields.
- **Files:** 1 edited — `task_Logger.md`
- **Decision:** My first try edited `ADMIN_PANEL_REDESIGN.md`; you rejected it, so that file is unchanged.
- **Permission:** Edit `task_Logger.md` only. No git actions.

## Task 3 — Review your category pagination/tree changes
- **Status:** ⚠️ Review only, no code changed
- **Instruction:** Check whether the "pagination vs tree" issue is resolved and how close you are.
- **Done:** Read your diffs (controller, service, repository, `categoryApi`, `use-category`, `Categories.jsx`) and called `GET /category`. Direction is right (whole tree, no pagination); ~75% there.
- **Bug:** `category.service.js` still destructures `({ offset, limit })` but the controller now calls it with no argument → TypeError → 500 once rebuilt.
- **Bug:** `useCategory` signature changed, but `CategoryModal` (`1, 10, searchTerm`), `ProductModal`, `ProductDetail`, `Shop`, `PopularCategories` still pass old args → parent search in `CategoryModal` is broken.
- **Bug:** `/category/selection` still defaults to 10 rows; client no longer sends `limit`.
- **Decision:** Did not fix your code (you asked only to check).
- **Files:** 1 edited — `task_Logger.md`
- **Permission:** Read-only code + one `curl` to `/category`. Container still runs old code (not rebuilt).

## Task 4 — Fix the category issues from Task 3
- **Status:** ✅ Done
- **Instruction:** Complete all the edits listed in the Task 3 review.
- **Done:** Service no longer takes `offset/limit` (fixes the 500); controller dead code removed; selection default 10 → 1000; all `useCategory(1, N)` callers updated; `CategoryModal` search fixed; dead pagination removed from `Categories.jsx`; product-service rebuilt; `/category` and `/category/selection` tested OK (200); stale notes in `ADMIN_PANEL_REDESIGN.md` marked resolved.
- **Files:** 0 created, 10 edited
  - `category.service.js`, `category.controller.js` (backend)
  - `Categories.jsx`, `CategoryModal.jsx`, `ProductModal.jsx`, `ProductDetail.jsx`, `Shop.jsx`, `PopularCategories.jsx` (client)
  - `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Removed the response `pagination` for `/category` (nothing uses it now). Kept selection's `pagination` shape unchanged.
- **Permission:** Edit code in repo; run `docker compose up -d --build product-service` and `curl` tests (allowed by your "complete all this edits"). No git actions.

## Task 5 — Check the 3 Brands-page gaps in ADMIN_PANEL_REDESIGN.md
- **Status:** ⚠️ Review only, no code changed
- **Instruction:** Check whether the 3 selected gaps (Draft status, logo upload, "⋯" row menu) are still open.
- **Done:** Checked `Brand.model.js`, backend for upload code, `BrandModal.jsx`, `BrandTable.jsx`, `ui/`. All 3 still open.
- **Decision:** Did not implement (you asked only to check).
- **Files:** 1 edited — `task_Logger.md`
- **Permission:** Read-only search of the repo.

## Task 6 — Record decisions on the 3 Brands-page gaps
- **Status:** ✅ Done (docs only)
- **Instruction:** Drop "Draft" from the design; do logo upload later; no "⋯" menu — keep the two existing buttons.
- **Done:** Updated the 3 notes (and the Categories "Draft" note) in `ADMIN_PANEL_REDESIGN.md` as dropped / deferred / not needed. No code changed.
- **Files:** 0 created, 2 edited — `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Logo upload stays open as a "later" item; the other two are closed.
- **Permission:** Edit the two docs. No git actions.

## Task 7 — Status chips inside grouped Orders tabs (step 3)
- **Status:** ✅ Done (lint + `vite build` pass; not checked in browser — needs admin login)
- **Instruction:** Implement step 3: per-status chips inside grouped tabs.
- **Done:** Payment / In store / With rider / Completed tabs now show chips (All + each status, with counts). A chip queries one status, so it paginates normally. Chips reset when the tab changes. Merged-view hint text updated.
- **Files:** 0 created, 3 edited — `Orders.jsx`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Did only step 3 (not the backend array-`status` change); the group's "All" chip keeps the capped merged view.
- **Permission:** Edit client code and docs; run lint and build. No git actions.

## Task 8 — API: orders list accepts multiple statuses
- **Status:** ✅ Done (backend tested in container; UI not checked in browser — needs admin login)
- **Instruction:** Update the API for the grouped-status tabs.
- **Done:** `GET /orders/admin/all` now takes one status, a comma list, or `status[]=A&status[]=B` → SQL `IN`. Client sends the group's statuses in one request, so all grouped tabs paginate server-side. Removed the merge-and-cap code and the "isn't page-by-page" hint. order-service rebuilt; array and comma input verified against the real DB (`IN ('PLACED','DELIVERED','CONFIRMED')`).
- **Files:** 0 created, 5 edited
  - `order.service.js` (backend)
  - `use-order.js`, `Orders.jsx` (client)
  - `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Used `keepPreviousData` so the table doesn't flash empty when switching pages/tabs. Per-status counts (13 small requests) left as is.
- **Permission:** Edit code, rebuild `order-service` (`docker compose up -d --build`), run a read-only query script inside the container (copied in, then deleted). No git actions.

## Task 9 — warehouse_id on Order, drop Customer column, API plans
- **Status:** ✅ Done (lint OK; Orders page not checked in browser — needs admin login)
- **Instruction:** (1) add warehouse_id to the Order model; (2) remove customer name from the Orders table + plan an efficient API/query for it; (3) say which pages need each piece; (4) plan the remaining APIs.
- **Done:** (1) `orders.warehouse_id` column (nullable, indexed, no FK) + migration with backfill from `inventory_reservations` (8 old orders filled, 2 stay NULL — no reservation); set on order create and payment retry; migration run, order-service rebuilt. (2) Customer column removed from `OrderTable`. (3)(4) Page matrix + plans written in `ORDERS_API_PLAN.md`.
- **Files:** 1 created (migration) + 1 created (plan) = 2 created, 4 edited
  - 📝 `migrations/20261005000000-add-warehouse-id-to-orders.cjs`, `ORDERS_API_PLAN.md`
  - ✏️ `Order.model.js`, `order.service.js`, `OrderTable.jsx`, `task_Logger.md`
- **Decision:** Customer name plan = reuse `order_addresses.full_name/phone` (already stored per order) instead of a cross-service call. Orders table's Warehouse column still shows demo names until the name mapping is built.
- **Permission:** Edit code, create files, rebuild `order-service`, run `sequelize-cli db:migrate` (+ one undo/redo of my own new migration) on the dev DB, read-only `psql` checks. No git actions.

## Task 10 — Orders: pick a warehouse first (popup + required filter)
- **Status:** ✅ Done (backend tested; lint/build OK; UI not checked in browser — needs admin login)
- **Instruction:** Super admin has no linked warehouse, so a warehouse must be selected first (popup). Plan first, then "go".
- **Done:** API `GET /orders/admin/all` requires `warehouse_id` (400 otherwise). Client: remembered selection hook, blocking "Select a warehouse" popup, dropdown on Orders + Dashboard, counts/chips/list per warehouse, Warehouse column removed from Orders table. order-service rebuilt; tested in container: none/invalid → 400, wh=1 → 8 orders, wh=2 → 0.
- **Bug:** list totals counted order × item rows (wh=1 showed 11, real 8) → fixed with `distinct: true`.
- **Files:** 2 created, 10 edited
  - 📝 `use-selected-warehouse.js`, `WarehousePicker.jsx`
  - ✏️ `order.service.js`, `order.repository.js` (backend); `orderApi.js`, `use-order.js`, `Orders.jsx`, `OrderTable.jsx`, `Dashboard.jsx` (client); `ORDERS_API_PLAN.md`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Popup can't be closed until a warehouse is picked; no "All" option; Dashboard follows the same warehouse. `OrderStatusBoard.jsx` (unused) left untouched — it would get 400 if ever used.
- **Permission:** Plan approved with "go". Edit code/docs, rebuild `order-service`, run read-only test script inside container (copied in, then deleted). No git actions.

## Task 11 — Warehouse dropdown styled like the other dropdowns
- **Status:** ✅ Done (lint OK; not checked in browser — needs admin login)
- **Instruction:** Make the warehouse dropdown like the other dropdowns.
- **Done:** Replaced the plain `<select>` with the shared shadcn `Select` (same as the Products page filters), in the Orders page and the Dashboard header.
- **Files:** 0 created, 2 edited — `WarehousePicker.jsx`, `task_Logger.md`
- **Decision:** Copied the Products-page `Select` pattern (`min-w-37.5 py-2.5`); the popup's button list unchanged.
- **Permission:** Edit client code. No git actions.

## Task 12 — Modern scrollbar in the admin sidebar
- **Status:** ✅ Done (build OK; not checked in browser — needs admin login)
- **Instruction:** Use a modern scroll bar in the sidebar.
- **Done:** Slim 6px rounded scrollbar with a transparent track; the thumb appears (white, 30%) only while hovering the menu, brighter on hover. Firefox + Chrome/Edge/Safari.
- **Files:** 0 created, 3 edited — `index.css`, `FreshlySidebar.jsx`, `task_Logger.md`
- **Decision:** Plain CSS class `.sidebar-scroll` (no new package); colors are white-on-green to suit the dark sidebar.
- **Permission:** Edit client code. No git actions.

## Task 13 — Orders stats API + artifact explaining it
- **Status:** ✅ Done (backend tested against real DB; lint/build OK; UI not checked in browser — needs admin login)
- **Instruction:** Implement the stats endpoint; create an artifact on how stats APIs are created and designed.
- **Done:** `GET /orders/admin/stats` (today, byStatus, perDay, cancelRate, avgDeliveryMinutes; optional warehouse, `days`, `tz`; 30 s cache; 4 indexes). Client uses it for the Orders "Orders today" card, status counts (13 requests → 1) and Dashboard cards + chart. Private artifact published: https://claude.ai/artifact/VbDtNuDLWAjX6dyFzGiD3W
- **Tests:** per-day orders/revenue and status counts match raw SQL; bad `warehouse_id` / `tz` → 400; `days=999` → 90; cache hit <1 ms.
- **Files:** 1 created, 11 edited (artifact source file is outside the repo, not counted)
  - 📝 `migrations/20261005000001-add-stats-indexes.cjs`; scratchpad `orders-stats-api.html` (artifact source, not in repo) → repo count: 1 created
  - ✏️ `order.repository.js`, `order.service.js`, `order.controller.js`, `order.routes.js` (backend); `orderApi.js`, `use-order.js`, `Orders.jsx`, `Dashboard.jsx` (client); `ORDERS_API_PLAN.md`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** `warehouse_id` optional for stats (aggregate is cheap), required for the list. Revenue = paid, not cancelled, minus refunds. Delivery time = PICKED_UP → DELIVERED. COD counts as paid at placement (existing order-service behaviour) — noted in the artifact. In-memory cache (per instance).
- **Permission:** Edit code/docs; rebuild `order-service`; run migration + read-only test scripts in the container; publish a private artifact (your request).

## Task 14 — Explain Order-detail gaps + fix the cheap ones
- **Status:** ✅ Done (lint OK; not checked in browser — needs admin login)
- **Instruction:** Explain the 3 "remaining backend gaps" lines, then "continue".
- **Done:** Explained them in chat. Continued with the plan's cheap steps: Order detail now shows the real warehouse name and the customer name/phone from the order's own address.
- **Bug:** The doc said "no manual-refund endpoint", but `POST /orders/:orderId/payment/refund` exists → note corrected.
- **Files:** 0 created, 3 edited — `AdminOrderDetail.jsx`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Picker/rider left as sample data (no picker data; rider wiring is a separate task). No auth-service call needed for the name.
- **Permission:** "continue" taken as: do the next small steps in `ORDERS_API_PLAN.md`. Edit client + docs only. No git actions.

## Task 15 — Add Order-detail gap status to BACKEND_REQUIREMENTS.md
- **Status:** ✅ Done
- **Instruction:** "add this in this" (with `BACKEND_REQUIREMENTS.md` open) → took "this" as the Order-detail gap status.
- **Done:** Marked Orders items 1–4 as done / partly done (warehouse, name/phone from address, stats, per-day series, multi-status filter); fixed the header line that said nothing is implemented.
- **Files:** 0 created, 2 edited — `BACKEND_REQUIREMENTS.md`, `task_Logger.md`
- **Decision:** Kept the original wording after "Original note:" so history isn't lost.

## Task 16 — Products: server-side category / brand / search filters
- **Status:** ✅ Done (API tested against DB; client lint + build OK; UI not checked in browser)
- **Instruction:** "implement it and create artifact for this" (after the product-filter explanation).
- **Done:** `GET /product` now takes `category_id`, `brand_id`, `search` and returns `brand` + `productType`; Products page uses it instead of filtering the loaded page.
- **Bug:** Total count included product × variant rows → `distinct: true`.
- **Files:** 0 created, 9 edited — `product.repository.js`, `product.service.js`, `product.controller.js`, `productApi.js`, `use-product.js`, `Products.jsx`, `ProductTable.jsx`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Status counts above the table stay global (not narrowed by category/brand). Search = name contains, case-insensitive.
- **Permission:** Edit backend + client; rebuilt `product-service` container; no git actions.

## Task 17 — Indexes on products (category_id, brand_id, status) + explain
- **Status:** ✅ Done (migrated; `GET /product` still returns the same results)
- **Instruction:** "for product table create index on category id, brand id, status and /easy-explain how index implemented".
- **Done:** New migration `20261005000002` adds `products_category_id_idx` and `products_status_idx`. The `brand_id` index already existed as an untracked, un-run migration (`20260930010000`), so I ran it instead of making a duplicate. Explained indexes in chat.
- **Files:** 1 created (`20261005000002-add-index-products-category-status.cjs`), 1 edited (`task_Logger.md`)
- **Decision:** Three separate single-column indexes, as asked. Rebuilt `product-service` and ran `npx sequelize-cli db:migrate` in it (applied both pending migrations).
- **Note:** `20260930010000-...brand-id.cjs` is still untracked in git.
- **Permission:** Create migration, rebuild container, run migration on the local DB. No git actions.

## Task 18 — Remove "Out of stock everywhere" card from Products
- **Status:** ✅ Done (lint OK; not checked in browser)
- **Instruction:** Remove the out-of-stock card (a product can't be tracked per variant across warehouses); also asked whether the tab counts are page-based or all-product counts.
- **Done:** Card and its demo value removed; stat row now 3 cards. Answered: counts are totals across all products, not the current page.
- **Files:** 0 created, 4 edited — `Products.jsx`, `productDemoData.js`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** "612 variants" caption left (still demo, marked) — not asked to remove.

## Task 19 — Remove "612 variants" caption from Products
- **Status:** ✅ Done (lint OK)
- **Instruction:** "remove variant count caption".
- **Done:** Caption, its demo constant and the unused caption markup removed.
- **Files:** 0 created, 4 edited — `Products.jsx`, `productDemoData.js`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`

## Task 20 — Fix placeholder overlapping search icon in warehouse selector
- **Status:** ✅ Done (class merge verified in node; lint OK; not checked in browser)
- **Instruction:** Screenshot of Variant Stock modal: placeholder text overlaps the search icon.
- **Bug:** `StockModal.jsx` passes `px-3` in `className`; `tailwind-merge` let it replace the selector's `pl-9 pr-9`, so text started under the icon.
- **Done:** `SearchableSelector.jsx` now applies `pl-9 pr-9` after the caller's `className`, so every caller is covered.
- **Files:** 0 created, 2 edited — `SearchableSelector.jsx`, `task_Logger.md`

## Task 21 — Product detail save: send `id` in payload
- **Status:** ✅ Done (validator checked in container; not tested end to end — needs admin login)
- **Instruction:** "in product detail page when we save changes we need id in payload".
- **Bug:** `updateProductSchema` (product-service `validate.js`) requires `id` in the body; the form values have no `id`, so saving returned 400 `"id" is required`.
- **Done:** `ProductDetail.jsx` now sends `{ ...data, id: Number(productId) }` (same as the Products list edit).
- **Files:** 0 created, 2 edited — `ProductDetail.jsx`, `task_Logger.md`
- **Note:** Lint reports an existing `stockSummary` unused-variable error at `ProductDetail.jsx:216`, not from this change.

## Task 22 — Remove unused demo stock summary from ProductDetail
- **Status:** ✅ Done (lint + build below)
- **Instruction:** "yes remove it" (the unused `stockSummary` and its demo helper).
- **Done:** Removed the unused `stockSummary` line and its import, deleted `getDemoStockSummary` and the now-empty `client/src/lib/productDemoData.js`, updated the doc note. Fixes the lint error at `ProductDetail.jsx:216`.
- **Files:** 0 created, 1 deleted (`productDemoData.js`), 3 edited — `ProductDetail.jsx`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`

## Task 23 — Server-side search/filters for Units and Product attributes
- **Status:** ✅ Done (API tested against DB; client lint + build OK; UI not checked in browser)
- **Instruction:** "implement it" (the `GET /product-attribute` and `GET /units` filter gap, `ADMIN_PANEL_REDESIGN.md` line 140).
- **Done:** `GET /units` takes `search`, `category`; `GET /product-attribute` takes `search`, `product_id`, `is_filterable`. Both pages send them to the server (debounced search, page resets on filter change) instead of filtering the loaded page.
- **Decision:** Invalid `category` or non-numeric `product_id` returns 400, not a database 500. No new indexes (tables are tiny).
- **Files:** 0 created, 14 edited — `measurementUnit.controller.js`, `measurementUnit.service.js`, `measurementUnit.repository.js`, `productAttribute.controller.js`, `productAttribute.service.js`, `productAttribute.repository.js`, `unitsApi.js`, `productAttributeApi.js`, `use-units.js`, `use-productAttribute.js`, `UnitsPage.jsx`, `ProductAttributePage.jsx`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md` (+ rebuilt `product-service` container)

## Task 24 — Only the main page area scrolls (sidebar/header stay fixed)
- **Status:** ✅ Done (lint OK; tested on a static copy of the layout in a browser; real dashboard not opened — needs admin login)
- **Instruction:** "sidebar is scrolled up when I'm scrolling down, I want only the main page area to scroll".
- **Done:** `DashboardLayout.jsx` is now a fixed-height shell (`h-dvh overflow-hidden`); `<main>` is the only scroller (`flex-1 overflow-y-auto`). Sidebar and header no longer move.
- **Test:** Static page with the same classes and the built CSS, 3000 px tall content: after scrolling, sidebar top 0, header top 0, content moved -836 px, window scroll 0.
- **Files:** 0 created, 2 edited — `DashboardLayout.jsx`, `task_Logger.md`
- **Decision:** Did not mint a login token from the JWT secret to open the real dashboard (no credentials given). Test files stayed in the scratchpad; stray screenshot and `.playwright-mcp` folder removed from the repo.

## Task 25 — Variants page: keep the per-product model
- **Status:** ✅ Done (decision only, no code)
- **Instruction:** Explained why the global `Variants.dc.html` page wasn't built; user answered "no, I use my old method for this".
- **Decision:** Keep the "pick a product, manage its variants" page. The global variants-with-stock page is dropped, not deferred.
- **Files:** 0 created, 2 edited — `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`

## Task 26 — Remove completed entries from ADMIN_PANEL_REDESIGN.md
- **Status:** ✅ Done
- **Instruction:** "now remove all logs which are done and completed from admin redesign .md".
- **Done:** Cut the file from 254 to 42 lines. Removed every finished changelog entry and the all-"Done" pending-pages table. Kept only open items: decisions waiting, still-fabricated data, "not wired up" buttons, backend gaps, later improvements, the Variants decision, unused files.
- **Files:** 0 created, 2 edited — `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Retitled the file "Open Items". History is not in git (most entries were never committed), so a full copy was saved to the session scratchpad first.

## Task 27 — Login lockout time: 2 hours → 15 minutes
- **Status:** ✅ Done (value confirmed inside the rebuilt container; lockout itself not exercised — needs a real account)
- **Instruction:** "change it to 15 minutes".
- **Done:** `LOCK_TIME` set to `900000` ms in `auth-service/.env`, in the Joi default in `src/config/env.js`, and in the `|| 7200000` fallback in `auth.service.js`. Rebuilt `auth-service`; container shows `LOCK_TIME=900000` and the service is up. Removed the open item from `ADMIN_PANEL_REDESIGN.md`.
- **Files:** 0 created, 5 edited — `auth-service/.env`, `env.js`, `auth.service.js`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Note:** Accounts already locked keep their old lock time. Other services' `.env` still list `LOCK_TIME=7200000` but never read it.

## Task 28 — Dashboard "Latest orders": real customer name
- **Status:** ✅ Done (query checked in the container; client lint + build OK; page not opened in browser — needs admin login)
- **Instruction:** "implement it also" (the Dashboard "Latest orders" demo customer name).
- **Done:** The order list query (`getOrderHistory`) now includes the order's address with `full_name` only. Dashboard shows `order.address.full_name`, or `Customer #<id>` when there is none. Deleted `getDemoCustomerName` and its name list.
- **Test:** In the rebuilt `order-service` container, the list returned the same counts as before (8 for warehouse 1, 10 in total) and real names ("Pardeep Sahani", "Pardeep Kumar") on every row.
- **Files:** 0 created, 5 edited — `order.repository.js`, `Dashboard.jsx`, `orderDemoData.js`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Only `full_name` is fetched, not phone or address. The change is in the shared list query, so the customer's own "my orders" list also gets the recipient name on their own orders.

## Task 29 — Admin login copy: lockout says 15 minutes
- **Status:** ✅ Done (lint OK)
- **Instruction:** "yes change it" (login page wording, after the lockout moved to 15 minutes in Task 27).
- **Done:** `AdminLogin.jsx` now says "5 incorrect attempts will lock this account for 15 minutes."
- **Files:** 0 created, 2 edited — `AdminLogin.jsx`, `task_Logger.md`
- **Note:** The server error "Account is temporarily locked. Try again later." is unchanged; accounts locked before Task 27 may still be locked longer than 15 minutes.

## Task 30 — Explain Dashboard warehouse-ops and needs-attention cards
- **Status:** ✅ Done (explanation only, no code)
- **Instruction:** "explain it and we work later on need attention tab".
- **Decision:** Needs-attention card is deferred to later; marked in `ADMIN_PANEL_REDESIGN.md`.
- **Files:** 0 created, 2 edited — `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`

## Task 31 — Warehouse operational status; drop order count and pick+pack time
- **Status:** ✅ Done (migrated, API and validators tested; client lint + build OK; pages not opened in browser — needs admin login)
- **Instruction:** "remove order count and pick pack time and add operational status in warehouse table".
- **Done:**
  - New column `warehouses.operational_status` (OPEN / PAUSED / MAINTENANCE / SETTING_UP, default OPEN), migration `20261006000000`. Existing warehouses: inactive one → PAUSED, active → OPEN. Model and create/update validators accept it.
  - Warehouse form has an "Operational status" select; Warehouses table has a new column.
  - Dashboard Warehouses card shows the real status; the fake "142 orders · 9 min pick+pack" line is gone, replaced by the warehouse city. Deleted the demo profiles.
- **Bug:** Saving a warehouse from the form was rejected: validators expected latitude/longitude/`is_active` as strings but the form sends numbers and a boolean (400 "latitude must be a string"). Changed to `number` / `boolean`.
- **Files:** 2 created (migration `20261006000000`, client `warehouseStatus.js`), 9 edited — `Warehouse.model.js`, `validate.js` (inventory), `WarehouseModal.jsx`, `WarehousesTable.jsx`, `Dashboard.jsx`, `overviewDemoData.js`, `BACKEND_REQUIREMENTS.md`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md` (+ rebuilt `inventory-service`, ran migration)
- **Decision:** Kept `is_active` as well; the two are separate (Active toggle vs Open/Paused/…). Nothing enforces yet that a non-Open warehouse stops taking orders.

## Task 32 — Zones table: remove fake Warehouse column
- **Status:** ✅ Done (client only; lint + build OK)
- **Instruction:** "Warehouse ID cannot be attached to the zone table or the deliveryzone."
- **Done:** Removed the fabricated Warehouse column from `ZoneTable.jsx` and deleted the now-unused `getDemoWarehouse`. The open item and backend item #9 are marked dropped.
- **Files:** 0 created, 5 edited — `ZoneTable.jsx`, `orderDemoData.js`, `ADMIN_PANEL_REDESIGN.md`, `BACKEND_REQUIREMENTS.md`, `task_Logger.md`
- **Decision:** No `warehouse_id` on `DeliveryZone`; no backend change.

## Task 33 — Customers API (admin customer list + order stats)
- **Status:** ✅ Done (service logic tested in the rebuilt containers and checked by hand against the DB; route guards return 401 without a token; client lint + build OK; page not opened in browser, needs admin login; the role check with a real admin token was not run)
- **Instruction:** "Create an API for this." (Customers page), then "yes, go ahead" after the plan.
- **Done:**
  - auth-service `GET /auth/admin/users` (ADMIN / SUPER_ADMIN): search name/phone/email, `status=active|blocked`, `joined_days`, pagination, `counts` for the stat cards, addresses. Bad `status` / `joined_days` return 400.
  - order-service `GET /orders/admin/customer-stats?user_ids=`: orders, spent, last order and 3 recent orders per customer, plus store-wide `summary`. Max 100 ids; bad ids or `tz` return 400. Spent = paid, not cancelled, minus refunds; unpaid / failed / expired orders are not counted.
  - Customers page now uses both (debounced search, server filters, pagination); `customersDemoData.js` deleted. The Repeat filter pill was removed.
- **Test:** user 2 shows 5 orders / ₹350 / last 24 Sep, matching the DB by hand; user 3 shows 0. Search, status, joined_days, paging and the 400 cases pass.
- **Files:** 6 created (auth `roles.js`, `adminUser.{service,controller,routes}.js`; client `customerApi.js`, `use-customer.js`), 12 edited (auth `app.js`, `user.repository.js`; order `order.routes.js`, `order.controller.js`, `order.service.js`, `order.repository.js`; client `Customers.jsx`, `CustomerTable.jsx`, `CustomerDetailPanel.jsx`; `ADMIN_PANEL_REDESIGN.md`, `BACKEND_REQUIREMENTS.md`, `task_Logger.md`), 1 deleted (`customersDemoData.js`) (+ rebuilt `auth-service`, `order-service`)
- **Decision:** No new migration or index: `orders` already has an index starting with `user_id`. The phone is shown in full to admins (the demo masked it). Block button and Repeat filter left out (offered as follow-ups).

## Task 34 — Block / Unblock customer
- **Status:** ✅ Done (service logic tested in the rebuilt container with a throwaway customer, then deleted; client lint + build OK; page not opened in browser, needs admin login; the admin-only role check with a real admin token was not run)
- **Instruction:** "yes add it" (Block / Unblock button on the Customers page).
- **Done:**
  - auth-service `PATCH /auth/admin/users/:id/status` with `{ is_active }` (ADMIN / SUPER_ADMIN). Customers only: an admin id returns 404. Blocking revokes the customer's refresh tokens and sessions and writes an audit row (`ACCOUNT_LOCKED` / `ACCOUNT_UNLOCKED`, reason `ADMIN_BLOCK` / `ADMIN_UNBLOCK`). Repeating the same state is a no-op.
  - **Bug found and fixed:** `loginWithPassword` never checked `is_active`, so a blocked customer could simply log in again. It now returns 403 "Account is deactivated. Please contact support." (checked after the password, so a wrong password still gets the normal error).
  - Customer detail panel button now works: Block asks for confirmation first, Unblock goes straight through; toasts on success and error; the list and stat cards refresh.
- **Test:** block → token revoked, session revoked, audit row; login blocked → 403; repeat block → no change; unblock → active; bad id / bad `is_active` → 400; unknown id and admin id → 404. Test customer deleted afterwards.
- **Files:** 0 created, 11 edited — auth `adminUser.{service,controller,routes}.js`, `auth.service.js`; client `customerApi.js`, `use-customer.js`, `Customers.jsx`, `CustomerDetailPanel.jsx`; `ADMIN_PANEL_REDESIGN.md`, `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `auth-service`)
- **Decision:** A blocked customer's current access token (15 min) still works in the other services until it expires, because they check the JWT locally. Existing behaviour, not changed.

## Task 35 — Set up config-service
- **Status:** ✅ Done, backend only (unit tests 5/5; tested end to end through the gateway with minted admin and customer tokens; the Settings page is not wired to it yet)
- **Instruction:** "set up config service."
- **Done:**
  - `settings` table (migration `20261006000000-create-settings`, run): one JSONB row per group, holding only the fields an admin saved; defaults are filled in on read.
  - `GET /config` returns `{ general, orderRules }`. `PATCH /config/:group` takes a partial update (validated with Joi, all errors listed) and merges it in one SQL statement, so two admins saving different fields can't overwrite each other. Both ADMIN / SUPER_ADMIN only; JWT checked locally.
  - Registered in the gateway (`/config`) and `docker-compose.yml`; service runs on port 3007 (the old `.env` said 3003, which inventory-service already uses). Rebuilt `config-service` and `api-gateway`.
  - Fixed the global error handler so `AppError` keeps its status code instead of becoming a 500.
- **Test:** no token → 401; customer → 403; defaults; patching one field keeps the others; bad GSTIN / slotLength 0 / unknown key → 400 with every error; empty patch → 400; unknown group → 404. Test rows deleted afterwards.
- **Bug:** The migration could not run from the host: a native Windows `postgres.exe` shares port 5432 with Docker, so `localhost:5432` gave "password authentication failed". Ran it from a throwaway container on the compose network instead. Host tools on `localhost:5432` may hit the wrong database.
- **Files:** 15 created — config-service `.gitignore`, `Dockerfile`, `config/config.json`, migration, `database.js`, `auth.js`, `validate.js`, `Setting.model.js`, `setting.{repository,service,controller,routes}.js`, `AppError.js`, `roles.js`, `tests/validate.test.js`; 11 edited — config-service `app.js`, `server.js`, `package.json`, `models/index.js`; `docker-compose.yml`, gateway `services.config.js`, `backend/CLAUDE.md`, `Settings.jsx` (comment only), `ADMIN_PANEL_REDESIGN.md`, `BACKEND_REQUIREMENTS.md`, `task_Logger.md`; 3 deleted (`.gitkeep`). Not counted (git-ignored): config-service `.env` rewritten, `CONFIG_SERVICE_URL` added to gateway `.env`.
- **Decision:** Notifications tab left out: those are per-admin "email me" prefs, and `notification-service` is empty. Nothing reads the order-rule values yet (order-service still hard-codes 15 min). Customer-facing read endpoint skipped until the customer app needs it.
- **Permission:** Created the table in the dev database, rebuilt/restarted `config-service` and `api-gateway` (compose also touched dependent containers), installed npm deps. No git actions.

## Task 35 — Order detail: customer order count + "View customer" link
- **Status:** ✅ Done (id filter tested in the rebuilt `auth-service`; client lint + build OK; pages not opened in browser, needs admin login)
- **Instruction:** "add it" (after the explanation of the open item "Customer on an order").
- **Done:**
  - Order detail's Customer card now shows "N orders · ₹X spent" (from `GET /orders/admin/customer-stats`) and a **View customer** button.
  - The button opens `/dashboard/customers?customer=<id>`: the Customers page shows only that customer (with a "Show all customers" bar) and opens their panel.
  - auth-service `GET /auth/admin/users` got an `id` filter (400 on a non-positive or non-numeric id).
- **Test:** `id=2` returns 1 customer; unknown id returns 0; `abc`, `0`, `-3`, `1.5` return 400.
- **Files:** 0 created, 9 edited — auth `adminUser.service.js`, `user.repository.js`; client `AdminOrderDetail.jsx`, `Customers.jsx`, `use-customer.js`, `customerApi.js`; `ADMIN_PANEL_REDESIGN.md`, `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `auth-service`)
- **Decision:** The link uses the customer id, not a phone search. The order only stores the recipient's phone, which can differ from the account phone, so a search could miss. This needed the small backend `id` filter, so it was not purely client work as first said.

## Task 36 — Customers "View orders" now shows only that customer's orders
- **Status:** ✅ Done (backend tested in the rebuilt `order-service` and checked against the DB; client lint + build OK; pages not opened in browser, needs admin login)
- **Instruction:** "when I see customer details and click on 'See orders', it goes to the order page, but it does not filter that user's orders only."
- **Cause:** the button opened the plain Orders page, which shows one warehouse at a time and had no way to filter by customer.
- **Done:**
  - Button opens `/dashboard/orders?customer=<id>`. The Orders page shows only that customer's orders (status tabs and search still work), with a "Showing orders of customer #N only · Show all orders" bar.
  - In that view the warehouse picker, warehouse select, stat cards and tab counts are hidden, because those numbers are per warehouse and would be wrong for one customer.
  - order-service `GET /orders/admin/all`: `warehouse_id` is now optional when `user_id` is given (one customer's orders across warehouses). `user_id` and `warehouse_id` are validated (400 if not a positive number). Without both, it still returns 400 "warehouse_id is required".
- **Test:** customer 2 returns 7 orders without a warehouse (5 in warehouse 1, 2 with none) and matches the DB; with warehouse 1 it returns 5; unknown customer returns 0; warehouse-only view still returns 8; bad ids and the missing-both case return 400.
- **Files:** 0 created, 7 edited — `order.service.js` (order), `orderApi.js`, `use-order.js`, `Orders.jsx`, `CustomerDetailPanel.jsx`, `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `order-service`)
- **Decision:** The customer view spans all warehouses (including 2 older orders with no warehouse) because a per-warehouse view would hide some of the customer's orders. The "one warehouse at a time" rule stays for everything else.

## Task 37 — Fix: customer's orders came back empty on the Orders page
- **Status:** ✅ Done (cause confirmed in the code; client lint + build OK; page not opened in browser, needs admin login)
- **Instruction:** "/admin/all in we are not getting any order of a customer" (after Task 36).
- **Cause:** my mistake in Task 36. In customer mode `Orders.jsx` still sent the admin's remembered warehouse (`warehouse_id`) along with `user_id`, so the server filtered by both. If the remembered warehouse was not the customer's (for example warehouse 2 for a customer who ordered from warehouse 1), the list was empty. My backend test even showed "user 2 + warehouse 2 → 0" and I missed it.
- **Done:** in customer mode the page no longer sends `warehouse_id`, only `user_id`.
- **Files:** 0 created, 2 edited — `Orders.jsx`, `task_Logger.md`
- **Note:** No backend change. The same request (`user_id` only) already returned all 7 of customer 2's orders in the Task 36 test.

## Task 38 — Status filter for `GET /stock-reservations`
- **Status:** ✅ Done (backend tested in the container; client lint + build OK; page not opened in browser, needs admin login)
- **Instruction:** "completethis" on BACKEND_REQUIREMENTS.md item 6 (reservations have no status filter).
- **Done:**
  - inventory-service `GET /stock-reservations?status=` filters on the server (case-insensitive; anything else returns 400). The response also carries `statusCounts` for the whole table.
  - New migration adds an index on `(status, created_at)` (applied).
  - Reservations page: status pills ask the server and reset to page 1; stat cards use `statusCounts` instead of counting a 1000-row batch. "Release expired now" now fetches only ACTIVE reservations.
- **Test:** ACTIVE 7, CONFIRMED 1, RELEASED 3, EXPIRED 0, matching the DB; ACTIVE page 2 (limit 5) works; `status=bogus` and an injection-style value return 400.
- **Files:** 1 created, 8 edited — migration `20261006010000-add-index-reservations-status-created-at.cjs`; `stockReservation.repository.js`, `.service.js`, `.controller.js`; `stockReservationApi.js`, `use-stockReservation.js`, `StockReservationPage.jsx`; `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `inventory-service`)
- **Note:** The warehouse and search filters on the Reservations page are still page-only. `GET /stock-reservations` still has no auth (as before).

## Task 36 — Stock-movements type / warehouse filters
- **Status:** ✅ Done (checked through the gateway against the DB; client lint + build OK; page not opened in browser, needs admin login)
- **Instruction:** "implement this" (`BACKEND_REQUIREMENTS.md` #7: `GET /stock-movements` has no type/warehouse filter).
- **Done:**
  - inventory-service `GET /stock-movements` accepts `type` and `warehouse_id` (combinable with `page` / `limit`); pagination totals reflect the filter. Unknown type or non-positive / non-numeric `warehouse_id` returns 400 instead of a Postgres 500. Empty values are treated as "no filter".
  - Movements page now sends the type pills and warehouse select to the server and goes back to page 1 when they change; the old client-side type/warehouse filtering is gone. Search stays client-side (variant names live in product-service), with a note shown only for search.
- **Test:** 3 movements in the DB; no filter 3, `type=STOCK_IN` 2, `warehouse_id=2` 1, both 1, `ADJUSTMENT` + wh 2 → 0, `SALE` → 0, `limit=1&page=2` → total 2 / 2 pages, empty values → 3, `REFUND` / `abc` / `0` → 400. Unit test 2/2.
- **Files:** 1 created (`tests/stockMovementFilters.test.js` in inventory-service), 10 edited — inventory `validate.js`, `stockMovement.{routes,controller,service,repository}.js`; client `stockMovementApi.js`, `use-stockMovement.js`, `StockMovementPage.jsx`; `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `inventory-service` only, `--no-deps`)
- **Decision:** No date filter: the page has no date control, so it would be unused. `validate()` in inventory-service now takes an optional second argument (`"query"`) so it can check query strings; body validation is unchanged. The hook's unused third parameter `searchTerm` became `filters` (its only caller passed two arguments).

## Task 39 — Delivery partner pages (all 20 canvas screens) + backend requirements
- **Status:** ✅ Done (client lint + build OK; all 17 partner routes and the 4 admin pages opened in a browser with no render errors; no backend changes)
- **Instruction:** "create the deliverypartner page and create all pages of delivery partner and add backend requirement in BACKEND_REQUIREMENTS.md" (from the "Freshly Delivery Partner UI" design canvas).
- **Done:**
  - Admin: Delivery partners list (Applications / Partners tabs, 4 stat cards, zone and status filters), Review application (6-tick checklist, "Approve & activate" locked until all ticked, document picker), Partner detail, Add partner. The sidebar item is enabled and the Dashboard "Partner applications to review" card now links to the page.
  - Partner phone app `/partner/*` (9 screens: sign-in with OTP boxes, Home with online toggle, Pickup, Deliver, Confirm with 4-digit code and done state, Failed with reasons, Handover in / out, History, Profile).
  - Partner desktop `/partner/web/*` (Today, Orders, History, Profile) and self sign-up `/partner/apply/*` (Details, Documents, Status).
  - `BACKEND_REQUIREMENTS.md`: stale item 16 rewritten (the delivery-service model and admin endpoints do exist) and items 17–28 added (admin list, counts, applications, checklist, documents, partner login / role, "me" endpoints, partner orders, delivery code, failed attempts, handovers, history / stats). `ADMIN_PANEL_REDESIGN.md` updated.
- **Files:** 24 created — `partnerDemoData.js`, `components/partner/{PartnerBits,MobileShell,WebShell}.jsx`, 4 admin pages, 9 phone pages, 4 desktop pages, 3 sign-up pages; 8 edited — `App.jsx`, `FreshlySidebar.jsx`, `DashboardLayout.jsx`, `Dashboard.jsx`, `notify.js` (new `notify.notWired`), `BACKEND_REQUIREMENTS.md`, `ADMIN_PANEL_REDESIGN.md`, `task_Logger.md`
- **Decision:** Everything runs on demo data (no partner list, application, document, OTP or partner-order endpoints exist) and each page says so. Buttons that need new endpoints show the "not wired up yet" toast. Partner routes have no login guard (no partner role exists yet). Used the existing Tailwind tokens and shadcn parts instead of the canvas's inline styles. Handovers on the desktop sidebar is a toast only (the canvas has no page for it).
- **Bug:** the log numbering has duplicates (two Task 35 and two Task 36) from parallel sessions; this entry continues from the highest number, 38.
- **Permission:** started a temporary Vite dev server on port 5199 and a browser to check the pages (stopped afterwards); the test used a fake unsigned admin token set only in that browser, nothing stored in the repo.

## Task 40 — Commit and push
- **Status:** ✅ Done — commit `11798e8` (201 files) pushed to `origin/feature/admin-panel-redesign`, upstream set (new remote branch).
- **Instruction:** "commit and push it".
- **Decision:** You chose "all admin-panel work, minus secrets". The commit holds everything uncommitted from Tasks 1–39, not only the delivery-partner pages, because the shared files mix them. Left out on purpose: `backend/services/auth-service/.env` (tracked, modified), `backend/node_modules/.package-lock.json`, and the untracked `.agents/` and `.claude/skills/` folders. A scan of the staged changes found no credential patterns.
- **Files:** 0 created, 1 edited — `task_Logger.md` (this entry is after the commit, so it is not pushed yet)
- **Permission:** pushed to GitHub after you confirmed the scope.

## Task 41 — Ignore the four files left out of the commit
- **Status:** ✅ Done (not committed)
- **Instruction:** "add all four in gitignore".
- **Done:** added `backend/services/auth-service/.env`, `backend/node_modules/.package-lock.json`, `.agents/` and `.claude/skills/` to the root `.gitignore`. The two folders now disappear from `git status`.
- **Files:** 0 created, 2 edited — `.gitignore`, `task_Logger.md`
- **Note:** `auth-service/.env` and `.package-lock.json` are already tracked, so `.gitignore` does not hide them; they still show as modified. Stopping that needs `git rm --cached` on both (keeps the local files, removes them from the repo on the next commit). Not done, since you only asked for `.gitignore`.

## Task 42 — Stop tracking auth-service `.env`
- **Status:** ✅ Done (staged, not committed)
- **Instruction:** "this tracked till now add it also in gitignore" (`backend/services/auth-service/.env`).
- **Done:** ran `git rm --cached` on `backend/services/auth-service/.env`. The local file is untouched. It is now ignored, so it no longer shows as modified. `backend/.gitignore` already ignored `.env`; the file was only tracked because it was committed earlier. The root `.gitignore` entry from Task 41 is redundant but harmless.
- **Files:** 0 created, 1 edited — `task_Logger.md` (plus 1 staged removal from the index: `auth-service/.env`)
- **Note:** earlier commits, including ones already pushed, still contain this file's old values. If it holds real secrets, rotate them. `backend/node_modules/.package-lock.json` is still tracked and still shows as modified.

## Task 43 — Untracking didn't stick; redone for both files
- **Status:** ✅ Done (staged, not committed)
- **Instruction:** "not solved".
- **Bug:** after Task 42, `auth-service/.env` was tracked and showing as modified again — the staged removal had been undone outside this session (likely unstaged in the IDE). `backend/node_modules/.package-lock.json` was still tracked as well.
- **Done:** ran `git rm --cached` on both files again. Both are staged as deleted from the repo; the local files are untouched and ignored.
- **Files:** 0 created, 1 edited — `task_Logger.md` (plus 2 staged removals from the index)
- **Note:** a staged removal can be undone with one click in the IDE; committing it makes it permanent.

## Task 44 — Reservations: warehouse + search filters on the server, and auth on the list
- **Status:** ✅ Done (backend tested in the containers with real tokens; client lint + build OK; page not opened in browser, needs admin login)
- **Instruction:** "complete both limits" (Task 38's two open limits: warehouse/search were page-only, and `GET /stock-reservations` had no auth).
- **Done:**
  - inventory-service `GET /stock-reservations?warehouse_id=&search=`. `search` matches the order id or the product name (asks product-service). `statusCounts` now counts within the warehouse/search filter. Bad `warehouse_id` returns 400; a typed % or _ is literal.
  - product-service `GET /product-variant/variants/search` was broken (queried a column that does not exist, called a repository method that does not exist). Now returns the variants whose product name matches (max 200).
  - Auth: the reservation list is ADMIN / SUPER_ADMIN / OPS_STAFF only; the three other reads need a login. `req.user` is now the full token payload (per backend/CLAUDE.md), `requireRole` works, roles live in a new `constants/roles.js`.
  - Reservations page: warehouse and search (400 ms debounce) go to the server and reset to page 1; the client-side filtering and the "page-only" footnote are gone.
- **Test:** no token 401; CUSTOMER and DELIVERY_PARTNER 403 on the list; ADMIN / SUPER_ADMIN / OPS_STAFF 200; CUSTOMER 200 on `/order/9` (what order-service uses). Warehouse 1 returns 11 (all), warehouse 2 returns 0. Search "9" returns order 9 only; "10" + ACTIVE returns 2; "pota" returns the 8 reservations of variant 1 and "test" the 3 of variant 3 (match the DB); "zzzz", "%" and "_" return 0.
- **Files:** 1 created, 13 edited — created `inventory-service/src/constants/roles.js`; edited inventory `middleware/auth.js`, `stockReservation.routes.js`, `.controller.js`, `.service.js`, `stockReservation.repository.js`, `stockMovement.controller.js`; product `variant.repository.js`, `productVariant.service.js`; client `stockReservationApi.js`, `use-stockReservation.js`, `StockReservationPage.jsx`; `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `inventory-service`, `product-service`)
- **Note:** `createStockMovement` read `req.user` as the id; it now reads `req.user.user_id` (same value). inventory-service `authenticateToken` still lets every role through (see item 6), because customers' orders create reservations with their own token. Search does not cover the "500 g" part of a variant name.

## Task 45 — Check docker "orphan container zookeeper" warning
- **Status:** ✅ Checked (nothing changed)
- **Instruction:** "check it" (compose warning: found orphan containers ([zookeeper])).
- **Done:** zookeeper is a stopped container (exited 2 months ago) from this same compose project (`backend`). `docker-compose.yml` no longer defines it, because kafka and zookeeper are commented out. Services use RabbitMQ (`messaging/index.js`), so nothing needs zookeeper.
- **Decision:** warning is harmless. Fix is `docker rm zookeeper` or `docker compose up -d --remove-orphans`. Not run, since it deletes a container (it has 3 volumes mounted) and you only asked to check.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Note:** at check time the app containers were only "Created", and postgres and rabbitmq had exited (137) 16 min ago. Nothing is running; `docker compose up -d` is needed.

## Task 46 — Plan: partner summary counts (BACKEND_REQUIREMENTS item 18)
- **Status:** 📝 Plan only — nothing built, waiting for the go-ahead
- **Instruction:** "create plan for this" (item 18, `GET /delivery-partners/admin/summary`: the four stat cards, sidebar badge, Overview card).
- **Findings:** Active, online and in-progress numbers can be real now (`status`, `is_online`, ACTIVE assignments). "Suspended this week" needs a suspension date that nothing stores. "Waiting for review" and the oldest age need the applications table from item 19, which does not exist.
- **Plan:** Phase A now: migration adds `suspended_at`, a `GET /delivery-partners/summary` with 3 real cards, and the client wires cards 2-4 (card 1 stays demo). Phase B with item 19: add the applications numbers, then the card, tab count, sidebar badge and Dashboard card.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Note:** The delivery-service files the plan touches already have uncommitted changes from the item 17 list work (`/list`, name/phone/online). Start after those are committed.

## Task 47 — Delivery partner list (BACKEND_REQUIREMENTS item 17)
- **Status:** ✅ Done (backend tested in the containers with real tokens; the 3 changed client files lint clean, build OK with the committed `index.css` put back for one run; whole-project `npm run lint` fails on 55 errors in other files, none in mine; delivery-service has no lint, changed files pass `node --check`; Partners tab not opened in a browser, needs admin login). Not committed.
- **Instruction:** "create plan for this" (item 17), then "create artifact for this". Plan approved, then built. Plan page: https://claude.ai/artifact/ELn3dagS5cbW7Nq1SnG4nv (private).
- **Decision:** you corrected the plan: delivery-service lists delivery partners, so the route is `GET /delivery-partners/list`, not `/admin`. You chose: name/phone copied onto the partner row, real `is_online` columns, dashboard staff only.
- **Done:**
  - delivery-service `GET /delivery-partners/list?search=&zone_id=&status=&online=&page=&limit=` returns name, masked phone, zone, vehicle, online flag, active/max orders, delivered today, status, pagination. Bad `status`, `online` or `zone_id` return 400.
  - New migration adds `name`, `phone`, `is_online`, `online_since` to `delivery_partners` (run on the dev DB). `POST` and `PATCH /delivery-partners` accept `name` and `phone`.
  - The model's default scope hides `name`/`phone` from `GET /:id`, `/zone` and the available-partners list, which have no login check.
  - Partners tab reads the list: debounced search, zone and status filters, pagination.
  - `BACKEND_REQUIREMENTS.md` item 17 marked done.
- **Test:** no token, CUSTOMER and DELIVERY_PARTNER get 401; ADMIN, SUPER_ADMIN and OPS_STAFF get 200. Status, zone, online, search (name, phone, vehicle; `%` and `_` literal), paging and combined filters match three test partners. Delivered today was 2 and 1 (yesterday's and an ACTIVE assignment not counted). `PATCH` with name/phone shows in the list; a 21-digit phone is rejected. Logged-out `GET /:id` and `/zone` show no name or phone. Test rows deleted afterwards.
- **Files:** 1 created, 13 edited — created `delivery-service/migrations/20261007000000-add-partner-identity-and-online.cjs`; edited delivery-service `DeliveryPartner.model.js`, `validate.js`, `deliveryPartner.controller.js`, `.routes.js`, `.service.js`, `deliveryPartner.repository.js`, `deliveryAssignment.repository.js`, `utils/helper.js`; client `deliveryApi.js`, `use-delivery.js`, `DeliveryPartners.jsx`; `BACKEND_REQUIREMENTS.md`, `task_Logger.md` (+ rebuilt `delivery-service`)
- **Bug:** `POST /delivery-partners` still fails: `authenticateToken` sets `req.user = decoded.user`, which is `undefined` (the token is flat). Not fixed, since the list does not use `req.user`. Test rows were inserted with SQL instead.
- **Note:**
  - `is_online` is never set until partner sign-in exists (item 23), so every partner shows Offline. Existing partner rows have no name or phone until edited.
  - "View" opens the demo profile of the first demo partner for a real id (detail page is item 28).
  - `client/src/index.css` shows as deleted and `client/index.css` as new, from outside this task. The build failed on it, so I put the committed copy back for one build and removed it again. Nothing of that is in this task's file count.
  - Another entry also took "Task 46" (partner summary plan), so this one is 47.

## Task 48 — Delivery partner onboarding: HLD + LLD with review process
- **Status:** 📝 Design only — no code or database changes; nothing committed
- **Instruction:** "design hld lld for delivery partner onboarding around my existing delivery service … and i want review process like all functionality."
- **Done:** wrote `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` (repo root): decisions, HLD (context, roles, state machine, flows), the review process (queue, claim, documents, six checks, three decisions, approval gates, edge cases), LLD (4 tables, API, approval transaction, SMS texts, code layout, client wiring), build phases, test plan, open questions. It sits inside delivery-service as one new module (items 19–22).
- **Decision:** applicant is an auth user with role `DELIVERY_PARTNER` from sign-up; "active partner" means a `delivery_partners` row with status ACTIVE. ADMIN / SUPER_ADMIN approve and reject, OPS_STAFF prepare (confirm), and the person who added an application cannot approve it. Files go on a private encrypted volume with 2-minute signed URLs; Aadhaar stored as last 4 only.
- **Bug (found while reading, not fixed):**
  - delivery-service `authenticateToken` sets `req.user = decoded.user` (`undefined`), so `requireRole` always returns 401; an ADMIN token on `POST /handle-orders/assignments/assign` got 401. It also admits staff roles only.
  - `delivery_partners.user_id` is UUID but auth user ids are BIGINT.
  - OTP / SMS cannot be delivered: `emitEvent` and `TOPICS` are not imported in auth-service, the `providers/` folder is missing, and `notification-service` is empty.
  - `POST /delivery-partners` creates an active partner with no review.
  - These are Phase 0 in the design.
- **Files:** 1 created, 1 edited — created `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`; edited `task_Logger.md`
- **Note:** 7 open questions are in section 11 (SMS vendor, can a customer's phone become a partner, can OPS_STAFF approve, file storage, Aadhaar storage rule, reapply cooldown, background check). (Corrected in Task 50: `client/src/index.css` is back in place; the "still missing" claim here was not re-checked when written.)

## Task 49 — Artifact page for the partner onboarding design
- **Status:** ✅ Published (private): https://claude.ai/artifact/GpTKemjTrCice8gthjhi39. Checked once in a browser at desktop width, all 8 figures; phone width and dark mode not looked at.
- **Instruction:** "create artifact of this which some visuals so i understand the architecture better".
- **Done:** page built from `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` with 8 hand-drawn diagrams: system context, application states, journey by actor, review checks to approve gate, approval transaction, upload and file-view paths, data model, auth today vs after Phase 0. Also the roles table, build order and the 7 open questions.
- **Fix during check:** the "create" label in the states figure touched a box, and the data-model arrow into `delivery_zones` started inside the partners table. Both fixed before publishing.
- **Files:** 0 created, 1 edited — `task_Logger.md`. The page source (generator, CSS, HTML) is in the session scratchpad, not in the repo.
- **Note:** the page is a view of the design file, not a second source. If the design changes, republish.

## Task 50 — Check whether index.css is back in place
- **Status:** ✅ Checked (nothing changed in the app); no build run, you confirmed it resolves
- **Instruction:** "index.css is now at right place you did not check it?"
- **Done:** `client/src/index.css` exists, matches the committed copy (not in `git status`), `client/index.css` is gone, and `main.jsx` imports `./index.css`. The earlier build failure is fixed.
- **Bug:** my Task 48 note said the file was still missing and the dev server failed. I wrote that from an earlier look and did not re-check. Corrected in that entry.
- **Files:** 0 created, 1 edited — `task_Logger.md`

## Task 51 — SMS decision: console while building, Message Central at launch
- **Status:** 📝 Design updated, no code or database changes; artifact republished (version 2, same link); not committed
- **Instruction:** "While building: don't send real SMS. In development, print the OTP to the console. At launch: use Message Central."
- **Decision:** one `sms.send()` in auth-service and delivery-service, picked by `SMS_PROVIDER` (`console` | `messagecentral`). Console prints through the winston logger, and the service refuses to start with it when `NODE_ENV=production`. Message Central's VerifyNow is not used: it makes and checks the OTP itself and takes no custom text, so it would replace the local OTP check and still could not send the six status texts. The plain SMS API is used instead.
- **Done:** design file gets D11, new §6.8 (providers; Errors is now §6.9), DLT note under the templates, P0.3 rewritten (console first), a before-launch line, an SMS test row, Q1 answered, new Q8 (DLT entity/sender/templates) and Q9 (plan includes the plain SMS API). Artifact gets an SMS section and figure, a new SMS box in the context figure, and the updated Phase 0 and question rows.
- **Found while checking:** with `NODE_ENV=development` the sign-up, login and forgot-password responses already return the OTP (`auth.service.js` lines 119, 199, 826), so testing works today. `sms.service.js` still imports a `providers/provider.factory.js` that does not exist.
- **Not verified:** Message Central details (token call, `/verification/v3/send` fields, DLT `templateId` + `entityId`) come from their public pages read through a summariser. Check them against your account. Token lifetime and rate limits are not stated there.
- **Files:** 0 created, 2 edited — `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`

## Task 52 — P0.1 delivery-service "second door" (role check on staff routes)
- **Status:** ✅ Done and checked against the running service (rebuilt container); not committed
- **Instruction:** "I understand wrong. We have to implement the second door, which protects routes from the delivery partner role."
- **Done:**
  - `authenticateToken` ([auth.js](backend/services/delivery-service/src/middleware/auth.js)) now sets `req.user = decoded` and lets any valid token with a role through. Before, it let only staff in and set `req.user = decoded.user`, which is `undefined`, so every `requireRole` call returned 401 and the dispatch routes never worked.
  - New `src/constants/roles.js` with `ROLES` and `STAFF_ROLES`.
  - `requireRole(STAFF_ROLES)` added to all 21 routes behind `authenticateToken` in the delivery, deliveryPartner, deliveryZone, deliveryPartnerZone and handleOrder route files. The inline role list in `handleOrder.routes.js` now uses the constant.
  - Design doc P0.1 row marked done, with the one difference below.
- **Checked:** `docker compose exec -T delivery-service node auth.check.js` → "auth check passed: 21 protected routes x 7 probes". It finds every route that uses `authenticateToken` and asserts: no token, bad token and token without a role → 401; CUSTOMER and DELIVERY_PARTNER → 403; ADMIN, SUPER_ADMIN and OPS_STAFF → not 401/403. I proved it can fail: removed the door from `DELETE /delivery-zones/:id` inside the container, the check failed on that route (CUSTOMER got 404, not 403), then I rebuilt to restore it and it passed again. Spot checks: ADMIN `POST /handle-orders/assignments/assign` was 401 and is now 400 `"order_id" is required` (past auth); OPS_STAFF `GET /delivery-partners/list` 200, CUSTOMER 403.
- **Mistake:** a blanket find-and-replace also hit the import lines of four route files and put `staffOnly` into `import { ... } from auth.js`, an export that does not exist, which would have stopped the service from starting. Caught by grep, fixed, and the service rebuilt and started cleanly. Nothing was left broken.
- **Not done / limits:**
  - The two `partner/handover/.../confirm-*` routes are staff-only, not partner-accessible. `requireActivePartner` needs P0.2 (`delivery_partners.user_id` UUID → BIGINT).
  - Routes with no auth at all are unchanged: every GET in these modules, and all of `deliverySlot`. `GET /delivery-zones` still answers without a token.
  - `POST /delivery-partners` with a valid body is untested. It now reaches the controller for staff (it used to stop at the 401) and stores the caller's own `user_id`, which will clash with the UUID column until P0.2. The check only sent `{}` and got a validation error.
  - The published artifact (figure 8, Phase 0 text) still shows the original P0.1; not republished.
- **Files:** 2 created — `delivery-service/src/constants/roles.js`, `delivery-service/auth.check.js`; 8 edited — `auth.js`, the 5 route files, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`

## Task 53 — P0.2 migration: delivery user-id columns UUID → BIGINT
- **Status:** ✅ Migration written and applied to the dev database only; checked; not committed
- **Instruction:** "create migration for both and dont check on production i confirmed its empty" (`user_id` and `assigned_by`)
- **Done:**
  - New migration `20261007010000-change-delivery-user-ids-to-bigint.cjs`. It changes three columns, not two: `delivery_partners.user_id`, `delivery_assignments.assigned_by`, and `delivery_assignment_history.changed_by`. I added `changed_by` because the code writes the caller's `user_id` there too (re-assign, confirm-receipt) and it was UUID in the database, so it would fail the same way.
  - It runs in one transaction. It refuses to run if any of the three columns holds a value, because a UUID cannot become a BIGINT; that guard is the only data protection, since production was not checked, as you said.
  - `DeliveryPartner.model.js` `user_id` is now BIGINT (the other two models already said BIGINT). The two `assigned_by` rules in `validate.js` now take a positive integer instead of a UUID.
- **Checked on dev (tables were empty):**
  - Applied up, undone, applied again: all three columns uuid → bigint → uuid → bigint, and the unique key on `user_id` survived.
  - Guard: with one test row in `delivery_partners` the run refused with a clear message, columns unchanged, nothing recorded as applied. With a value only in the third table, the first two ALTERs were rolled back. Test rows deleted; all three tables are back to 0 rows.
  - End to end: an ADMIN `POST /delivery-partners` returned 201 and stored a numeric `user_id`; a second call returned 409; `/delivery-partners/list` showed it with the phone masked. The row was deleted. This also covers the "POST with a valid body is untested" gap noted in Task 52.
  - `auth.check.js` re-run: passed, 21 routes x 7 probes.
- **Mistake caught:** my first guard test proved nothing. The container has no `dotenv` (the image installs production dependencies only), so the migration never ran and I read "columns unchanged" as "guard worked". I noticed because my grep had hidden the output, re-ran with full output, and ran the CLI as `npx sequelize-cli@6.6.3` inside the container (not added to the image or `package.json`). There is no documented way to run migrations in this repo.
- **Found, not fixed (corrected after you told me):** the model is right and the database is wrong. History is append-only on purpose, so the model sets `updatedAt: false`; I wrongly offered "let the model write it" as a fix, and that would defeat your intent. The leftover is the database column `delivery_assignment_history.updated_at`, which is NOT NULL with no default, so every insert through the model fails: "null value in column updated_at violates not-null constraint" (confirmed with the real model). That breaks assign, re-assign and confirm-receipt at the history write. `delivery_handovers.updated_at` has the same shape (model `updatedAt: false`, column NOT NULL), which I inferred and did not run. The right fix is a migration that drops those columns. Not done, waiting for your go-ahead. `delivery_status_history` and `delivery_partner_zones` also set `updatedAt: false` but have no `updated_at` column in the dev DB, so they are fine.
- **Not touched:** `order_id` is also UUID in five delivery tables; the 20260716 migration says it has the same mismatch with the order service. Not changed or checked.
- **Not done:** the two `confirm-*` routes are still staff-only; switching them to `requireActivePartner` is unblocked now but was not asked for. The migration has not been applied anywhere except dev.
- **Files:** 1 created — `migrations/20261007010000-change-delivery-user-ids-to-bigint.cjs`; 4 edited — `DeliveryPartner.model.js`, `validate.js`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`

## Task 54 — Drop `updated_at` from the two append-only history tables
- **Status:** ✅ Migration written and applied to the dev database only; checked; not committed
- **Instruction:** "write migration for drop update add from DeliveryAssignmentHistory table and DeliveryHandover table."
- **Done:** new migration `20261007020000-drop-updated-at-from-delivery-history-tables.cjs`. It drops `updated_at` from `delivery_assignment_history` and `delivery_handovers` in one transaction. Their models set `updatedAt: false` on purpose (history is append-only), but the columns were `NOT NULL` with no default, so every insert failed. `down` adds the column back, fills it from `created_at` (rows are never changed after insert, so that is the true value), then makes it required again. No model or code change was needed.
- **Checked on dev (both tables were empty):**
  - Up: the column is gone from both tables.
  - The exact test that failed in Task 53 now passes: a history row created through the real model succeeds, with `changed_by = 1` going into the new BIGINT column. A handover row inserted with SQL also succeeds. Both inside a transaction that was rolled back.
  - Down with a row in each table: the column came back as `NOT NULL` with `updated_at` equal to `created_at`. Test rows deleted, then the migration applied again. Final dev state: columns dropped, both tables at 0 rows.
- **Not done / limits:**
  - Applied to dev only; production not touched.
  - The handover insert was tested with SQL, not the model: the model declares `order_id` as BIGINT, but the database column is UUID, so the model cannot insert a handover in dev. This is the `order_id` mismatch from Task 53, still unfixed. Handover creation and confirm-receipt will still fail until it is fixed.
  - Task 53's note on this bug is corrected to match your explanation (model right, database wrong); this task is its fix.
- **Files:** 1 created — `migrations/20261007020000-drop-updated-at-from-delivery-history-tables.cjs`; 1 edited — `task_Logger.md`

## Task 55 — Look at the `order_id` mismatch (investigation only)
- **Status:** 🔍 Investigated, nothing changed; waiting for your go-ahead on the fix
- **Instruction:** "look at the order_id mismatch"
- **Found:**
  - The order service is the source of truth: `orders.id` is BIGINT (model and database), and so is every other `order_id` outside delivery (`order_items`, `order_addresses`, `order_status_history`, `payments`, `inventory_reservations`).
  - The five delivery tables all store `order_id` as UUID in the database: `delivery_assignments` (required), `delivery_assignment_history`, `delivery_attempts`, `delivery_handovers`, `delivery_status_history`. No constraints on them, only plain indexes. All five are empty in dev.
  - The delivery models disagree with their own tables: Assignment, Assignment history and Handover say BIGINT (correct); Attempt and Status history say UUID.
  - The validators demand a UUID: `assignOrderSchema.order_id` (required), plus `createDeliverySchema` and `updateDeliverySchema`.
- **Effect (run against the live service):** `POST /handle-orders/assignments/assign` with a numeric order id such as 42 gets 400 `"order_id" must be a string`, since the validator wants a UUID string. Even without the validator, a numeric id could not be stored in the UUID column. So no real order can be assigned today. The dashboard has an assign call and hook but no page uses it yet, so nothing sends an id.
- **Separate blocker found on the way:** the order lookup at the top of `assignOrder` (`handleOrder.service.js` line 32) sends no Authorization header, and the order service answers that URL with 401 "Authentication token is required". So the lookup reports "order not found" for any id, valid or not. A UUID call returned 404 for this reason, so that 404 does not prove the id type is the cause. Not fixed.
- **Proposed fix (not done):** one migration, same pattern as Task 53 (one transaction, refuses to run if any of the five columns holds a value, `down` restores UUID), changing the five columns to BIGINT; Attempt and Status history models to BIGINT; the three validators to a positive integer. Orders cannot go to UUID: six tables across services reference them as BIGINT.
- **Files:** 0 created, 1 edited — `task_Logger.md`

## Task 56 — Fix the `order_id` type: delivery tables UUID → BIGINT (audit + migration)
- **Status:** ✅ Migration written and applied to the dev database only; checked; not committed. One related problem found and left open (`zone_id`, below).
- **Instruction:** "check it model and database table have bigint or uuid, if uuid in db so create migration and update table to store bigint user id" — read as: audit every delivery model against its table, and fix each external id column that is UUID in the database. The user-id columns were already done in Task 53, so what remained was `order_id`.
- **Audit (every model column vs its real table column):** one real difference left after the fix. Every other UUID column in the delivery tables is the service's own primary key or a foreign key to a delivery table, so they stay UUID. (`start_time`/`end_time` showed up as differences only because my type map lacked `time`.)
- **Done:**
  - New migration `20261007030000-change-delivery-order-ids-to-bigint.cjs`: `order_id` becomes BIGINT in `delivery_assignments`, `delivery_assignment_history`, `delivery_attempts`, `delivery_handovers`, `delivery_status_history`. One transaction; refuses to run if any of the five holds a value; `down` restores UUID.
  - `DeliveryAttempt` and `DeliveryStatusHistory` models: `order_id` UUID → BIGINT (the other three models already said BIGINT).
  - `validate.js`: `order_id` in `assignOrderSchema` (required) and the create/update delivery schemas now takes a positive integer instead of a UUID.
- **Checked on dev (all five tables empty):**
  - Value only in the last table: refused, and all five stayed UUID (the first four changes rolled back), nothing recorded as applied. Test row deleted.
  - Up → all five bigint, order_id indexes kept; down → all uuid; up again (final state: bigint).
  - Created a row with `order_id = 42` through the real model in a rolled-back transaction: OK for history, attempts, handovers and status history. Handover creation, which could not be tested in Task 54, now works. All tables back to 0 rows.
  - Validator on the live service: assign with `order_id` 42 passes it; a UUID gets 400 "must be a number"; 0 gets 400 "must be a positive number". `auth.check.js`: passed, 21 routes x 7 probes.
- **Open, not fixed — assignments still cannot be created:**
  - `DeliveryAssignment` fails with `column "zone_id" does not exist`. The model has `belongsTo(DeliveryZone, { foreignKey: "zone_id" })`, which makes Sequelize expect that column. No migration ever created it, nothing writes it, nothing includes the `deliveryZone` association, and `DeliveryZone` has no matching `hasMany`. It breaks every assignment insert and select. Two ways out, a decision for the owner: delete the unused association (nothing uses it), or add a nullable `zone_id BIGINT` column if assignments should record their zone.
  - The order lookup in `assignOrder` (`handleOrder.service.js` line 32) still sends no Authorization header, so `assign` with order 42 returns 404 "order not found" (see Task 55). Not fixed.
- **Not touched:** production. Not checked for these five tables; the migration's refusal guard is the protection.
- **Files:** 1 created — `migrations/20261007030000-change-delivery-order-ids-to-bigint.cjs`; 4 edited — `DeliveryAttempt.model.js`, `DeliveryStatusHistory.model.js`, `validate.js`, `task_Logger.md`

## Task 57 — Add `zone_id` to `delivery_assignments`
- **Status:** ✅ Migration written and applied to the dev database only; checked; not committed
- **Instruction:** "add zone id" (your choice of the two options in Task 56: add the column instead of deleting the unused association)
- **Done:** new migration `20261007040000-add-zone-id-to-delivery-assignments.cjs`. It adds `zone_id` as a nullable BIGINT with a foreign key to `delivery_zones(id)`, `ON DELETE SET NULL`, `ON UPDATE CASCADE`. I used SET NULL, not the CASCADE that `delivery_partner_zones` uses, because the zone is only a record on the assignment: deleting a zone must not delete delivery history. Nullable, so it is safe on any table that already has rows. No index (marked `ponytail:` in the file); add one with the first per-zone assignment query. No model change needed, since the association in the model already expected the column.
- **Checked on dev:**
  - Foreign key behaviour with real partner, slot and assignment rows in a rolled-back transaction: deleting zone 1 left the assignment in place with `zone_id` NULL; inserting zone 999 was refused by the foreign key. Rolled back, so dev still has zone 1 and 0 assignments.
  - Assignment insert and read through the real model, the exact test that failed in Task 56: OK with `zone_id` 1 and without it (`order_id` 42, `assigned_by` 7 stored).
  - Model-vs-table audit of every delivery model: 0 differences.
  - Down removes the column, up adds it again; final state has the column. `auth.check.js`: passed, 21 routes x 7 probes.
- **Not done / still open:**
  - Nothing sets `zone_id` yet, so it stays NULL. `assignOrder` already fetches the warehouse, and the partner lookup already uses `warehouse.data.zone_id`, so recording it would be one line in `handleOrder.service.js`. Not changed because you asked only for the column.
  - `assign` still cannot succeed end to end: the order lookup at the top of `assignOrder` sends no Authorization header (Task 55), so any order id returns 404 "order not found".
  - Production not touched.
- **Files:** 1 created — `migrations/20261007040000-add-zone-id-to-delivery-assignments.cjs`; 1 edited — `task_Logger.md`

## Task 58 — Make `assign` work end to end (order lookup token, warehouse URL, `zone_id`)
- **Status:** ✅ Full assign path verified on dev; `confirm-*` guard and re-assign deliberately NOT changed (reasons below); not committed
- **Instruction:** "fix it also". Read as the open items from the last two replies (the order-lookup token and recording `zone_id`) plus the `confirm-*` line you had selected.
- **Done:**
  - `handleOrder.service.js`: the order lookups in `assignOrder`, `handOver` and `updateStatus` now send the caller's Authorization header. They sent none, and the order service answered 401, so every lookup said "order not found". `assignOrder` also records `zone_id: warehouse.data.zone_id` on the new assignment.
  - Found by testing, not by reading: the warehouse lookup was also failing for a real warehouse. `delivery-service/.env` had `INVENTORY_SERVICE_WAREHOUSE_URL=http://api-gateway:4000/warehouse`, but the inventory service mounts `/warehouses` (plural; the dashboard uses it too), so the gateway returned "Cannot GET /warehouse/1" with or without a token. Changed to `/warehouses` and recreated the container. This also feeds the available-partners lookup (`deliveryPartner.service.js` line 57).
- **Checked on dev:** with a disposable order 900001, slot and partner (created through the API as an ADMIN token, all deleted afterwards): assign returned 201. The assignment row has `order_id` 900001 (BIGINT), `zone_id` 1, `assigned_by` 7, customer details copied from the order address; the `ASSIGNED` history row was written (impossible before Tasks 54 and 56); the partner's active count went to 1; the order service moved the order to ASSIGNED. Before that, the live chain failed at the right step each time: fake order → "order not found", fake warehouse → "warehose not found", real order and warehouse with a random slot → "Delivery slot not found". Everything cleaned up; order 9 (`READY_FOR_ASSIGNMENT`) was never touched. `auth.check.js`: passed.
- **Not done, on purpose — the `confirm-*` routes stay staff-only:** switching them to `requireActivePartner` now would open a hole and still not work.
  - Nothing checks that the caller is the handover's old partner (confirm-handover) or new partner (confirm-receipt), so any active partner could confirm anyone's handover.
  - The order service lets only ADMIN, SUPER_ADMIN and SUPPORT change an order, and read one unless it is the caller's own. Checked live: reading order 9 gives ADMIN 200, but OPS_STAFF, the `SYSTEM` token and DELIVERY_PARTNER all get 403. A partner's token would fail at the order step.
  - `confirmHandover` never awaits its transaction; `confirmReciept` creates the new assignment and the history row outside the transaction and does not await the history. A design note was added to the P0.1 row in the design doc.
- **Still broken, found while reading (not fixed, not asked):**
  - `reAssignOrder` is broken throughout: `ORDER_SERVICE_URL` is undefined (missing `env.`), the controller never passes it the caller's token, `order.succses` is a typo, `throw new ("order not found", 404)` throws a TypeError, the transaction is not awaited, and `updateById` is called with the wrong arguments.
  - The auto-progression timers (`PICKED_UP` → `OUT_FOR_DELIVERY` → `DELIVERED`) send a `SYSTEM` token, which the order service refuses (403, above), so they cannot move an order. They are scheduled after every assign and will log "Auto-progression ... failed" when they fire.
  - OPS_STAFF passes the delivery routes but is refused by the order service, so an OPS_STAFF user cannot assign an order (their lookup is 403, reported as "order not found"). Only ADMIN and SUPER_ADMIN can, in practice.
  - The `.env` fix is local: the file is gitignored and there is no example file, so any other environment needs the same one-word change.
- **Files:** 0 created; 3 edited — `handleOrder.service.js`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`; plus the local, untracked `delivery-service/.env` (one line).

## Task 59 — Keep all `.env` files locally, never push them
- **Status:** ✅ Done (staged, not committed)
- **Instruction:** "i want env files but add them also in gitignore so when we commit on github it not pushed".
- **Done:** root `.gitignore` now has `.env` (matches at any depth, so `client/` is covered too; it replaces the auth-service-only line). Ran `git rm --cached` on `backend/.env` and `client/.env`; `auth-service/.env` was already staged from Task 43. All 11 `.env` files are still on disk and `git check-ignore` reports all 11 as ignored; no `.env` is tracked any more.
- **Files:** 0 created, 2 edited — `.gitignore`, `task_Logger.md` (plus 2 more staged removals from the index)
- **Note:** these files are still in older commits already on GitHub; rotate any real secrets. After this is committed, anyone who pulls it has their own copy of `backend/.env` and `client/.env` deleted, so keep a copy of the values elsewhere. A `.env.example` per service would help; not made.

## Task 60 — Check `POST /delivery-partners` is SUPER_ADMIN only
- **Status:** ✅ Done
- **Instruction:** "this api can access by super admin only check it in server.js".
- **Done:** `server.js` only boots the app; the route is mounted in `app.js` and gated in `deliveryPartner.routes.js`. Line 10 called `requireRole(ROLES.SUPER_ADMIN)` with a string, but `requireRole` only accepts an array, so every caller (SUPER_ADMIN included) got 403 "Invalid role configuration". Changed it to `requireRole([ROLES.SUPER_ADMIN])`.
- **Files:** 0 created, 2 edited — `deliveryPartner.routes.js`, `task_Logger.md`
- **Bug:** string passed to `requireRole`; fixed. Every other `requireRole` call in delivery-service already passes an array.

## Task 61 — Mark P0.5 done in the onboarding design
- **Status:** ✅ Done
- **Instruction:** "mark its done".
- **Done:** `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` P0.5 now reads `**DONE 2026-10-08.**`, same style as P0.1 / P0.2.
- **Files:** 0 created, 2 edited — `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`
- **Decision:** Wrote "Not yet tested with a live token" in the row, since the fix has not been run.

## Task 62 — Explain P0.4 (auth-service prerequisites)
- **Status:** ✅ Done
- **Instruction:** "explain it" (about P0.4 in `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`).
- **Done:** Explained the three P0.4 items against the current auth-service code. Read-only; nothing changed.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Bug:** Found, not fixed: there is no OTP login for a returning user. `auth.service.js` `verify()` handles only `SIGNUP` and `FORGOT_PASSWORD` and returns an onboarding token, not access tokens; `signup()` returns 409 for an already-verified phone; `/auth/login` only returns an `action`. Real login today is `/auth/login/password`.

## Task 63 — Explain P0.4 item 1 (returning-user OTP login)
- **Status:** ✅ Done
- **Instruction:** "expalin first one".
- **Done:** Explained the current sign-up / login paths in auth-service and what is missing. Read-only; nothing changed.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Decision (open):** Password login (`/auth/login/password`) already works for returning users; OTP login would be new code. Recommended keeping password login and correcting the design doc wording. Waiting on your choice.

## Task 64 — Keep password login; update the onboarding design
- **Status:** ✅ Done
- **Instruction:** "keep password fro login".
- **Done:** `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` now says partners sign up with OTP then log in with phone + password. Edited: gap row (§1), auth-service role row, sign-up sequence diagram (verify returns an onboarding token, `/auth/register` issues the access token), on-behalf paragraph, invite SMS ("Sign up with this number"), §6.4 login bullet, `Apply.jsx` row, P0.4.
- **Files:** 0 created, 2 edited — `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`
- **Bug:** Found, not fixed (code untouched): `AuthService.login()` returns undefined for an existing unverified user, so `auth.controller.js` login throws and answers 500. A staff-created partner hits this. Fix is in P0.4.
- **Decision:** No OTP login; the invite SMS now says sign up, not sign in, because a staff-created partner has no password yet.

## Task 65 — Explain the `/auth/login` bug with examples
- **Status:** ✅ Done
- **Instruction:** "expalin the bug with examples".
- **Done:** Explained why `AuthService.login()` returns undefined for an unverified user and the controller answers 500; gave 3 examples (staff-created partner, abandoned sign-up, normal paths). Read-only; nothing changed.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Bug:** The same bug affects customers today, not only staff-created partners: `signup()` creates the user row (phone only) before the OTP is verified, so anyone who abandons sign-up and later calls `/auth/login` gets a 500.
- **Note:** The IDE showed the old P0.4 text on line 426; the file on disk is correct, the editor view was stale.

## Task 66 — Plan a root-cause fix for the `/auth/login` 500
- **Status:** ✅ Done (plan only, no code changed; waiting on approval)
- **Instruction:** "craeet a good plan for this bug and find root solution for it not the patch fix".
- **Done:** Traced every reader of `phone_verified` / `profile_complete` in auth-service and the client consumer (`PhoneLoginPage.jsx`). Plan: one exhaustive `accountState()` + action map used by `login()`, controller always responds, `loginWithPassword` guards a missing password hash, `register` null-check reorder, one `accountState.check.js`.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Bug:** Same class as the login 500, found while tracing, not fixed: `loginWithPassword` throws (500) on a user with no `password_hash` or a missing `password`; `register()` reads `existingUser.profile_complete` before its null check (TypeError, 500, when the user is missing); `auth.controller.js` `login` has no response path when `result.data` is falsy.
- **Decision (open):** Password-login guard must test `password_hash`, not account state: the seeded super admin (`phone_verified` true, `profile_complete` unset) logs in by password and must keep working.
- **Note:** `auth-service/tests/auth.test.js` is CommonJS in a `"type": "module"` package, so it can't run as is; the repo's working pattern is a `*.check.js` script (as in delivery-service).

## Task 67 — Check the account lifecycle is followed in auth-service
- **Status:** ✅ Done (read-only; nothing changed, nothing run)
- **Instruction:** Check the lifecycle (create → `phone_verified=false`, `profile_complete=false` → OTP → `phone_verified=true` → complete profile → `profile_complete=true`) is followed; "if yes we have only three situation combination only".
- **Done:** Yes on the normal path: only `signup()` creates users (phone only), only `verify()` SIGNUP sets `phone_verified`, only `register()` sets `profile_complete`; nothing resets either. So three flag combinations: (F,F), (T,F), (T,T). The bug state (F,F) is the first state after sign-up. Corrected my earlier "four combinations": it is three, plus "no row".
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Bug:** Found, not fixed (from reading the code; not run). (1) SECURITY: `register()` uses the phone in the request body, never compares it to the token's user (`req.user`) and never checks `phone_verified`, so any logged-in user can complete another person's incomplete account: set its password, flip `profile_complete`, receive its refresh cookie. This also creates the impossible (F,T) state. Staff-created partners sit at (F,F) until they sign up. (2) `verify()` FORGOT_PASSWORD branch returns without commit or rollback: a DB connection stays checked out and the OTP is never marked used. (3) `forgotPassword`/`resetPassword` never touch the flags, so an unverified user can end up with a password. (4) Seeded super admin is (T,F), outside the lifecycle.
- **Decision (open):** Plan step 1 simplifies to an if-chain that cannot fall through; `register()` fix becomes "bind to `req.user`, require `phone_verified`". Waiting on approval.

## Task 68 — Implement plan step 1: `accountState()` + `NEXT_ACTION`
- **Status:** ✅ Done (step 1 only; `login()` is not wired to it yet)
- **Instruction:** "implement step 1 /ponytail:ponytail".
- **Done:** New pure module `accountState.js` (a ternary chain that always ends in a value, plus the state → login action map). Added `accountState.check.js` (all four flag combinations + missing user); it passes, and fails when `UNVERIFIED` has no action.
- **Files:** 2 created — `backend/services/auth-service/src/modules/auth/accountState.js`, `backend/services/auth-service/accountState.check.js`; 1 edited — `task_Logger.md`
- **Decision:** Dropped the `ACCOUNT_STATE` constants object from the plan (YAGNI): state names are plain strings and the map keys them. Added the check file with step 1 because it is the only test of this logic.
- **Note:** `auth.service.js`, `auth.controller.js` untouched, so the `/auth/login` 500 is still live until step 2.

## Task 69 — Implement plan step 2: `login()` uses `accountState()`
- **Status:** ✅ Done (not tested live: auth-service is not running here)
- **Instruction:** "implemeny step 2 /ponytail:ponytail".
- **Done:** `AuthService.login()` is now `NEXT_ACTION[accountState(user)]` with a message per action; the 3 `if` branches (which fell through to `undefined` for an unverified user) are gone, so a number that exists but never verified its OTP now gets `SIGNUP` instead of a 500. `user_id` is still returned for `COMPLETE_REGISTRATION` and `LOGIN` only. The controller's `if (result.data)` can no longer hang, since `login()` always returns data.
- **Files:** 0 created, 2 edited — `auth-service/src/modules/auth/auth.service.js` (import, `LOGIN_MESSAGE`, `login()`), `task_Logger.md`
- **Decision:** `SIGNUP` message changed from "User Not Found." to "No verified account for this number. Please sign up." — it now covers an unverified number too; the client does not read these messages.
- **Note:** `auth.service.js` is CRLF throughout; the edit kept CRLF (856/856 lines). `node --check` and `accountState.check.js` pass. The file also holds earlier uncommitted work (the `sendOtp` swap) that is not part of this task. Needs an auth-service restart to take effect.

## Task 70 — Implement plan step 5: `register()` bound to the token's user
- **Status:** ✅ Done (not tested live: auth-service is not running here, and importing `auth.service.js` opens Redis/DB connections so a standalone script cannot call it)
- **Instruction:** "how are you going to fix and implement step 510? First, then implement it." (read as step 5; there is no step 10)
- **Done:** `register()` in `auth.service.js` now loads the account with `findById(req.user.id)` and ignores the `phone` in the body, so a logged-in user can no longer finish someone else's sign-up. Guards use `accountState()`: `UNVERIFIED` → 403, `ACTIVE` → 400 "profile is completed", only `VERIFIED_INCOMPLETE` goes on. Not-found (404) check you had already moved is kept.
- **Files:** 0 created, 2 edited — `auth-service/src/modules/auth/auth.service.js`, `task_Logger.md`
- **Bug:** Fixed on the way (needed for register to ever succeed): `savedUser`, `accessToken`, `rawRefresh` were `const` inside the `try` but returned after it, so `register()` threw a ReferenceError after committing; the return and log now sit inside the `try`. Making that return reachable would have sent the whole user row (incl. `password_hash`) to the client, since `User.model.js` has no `toJSON`/default scope; the response now carries the same fields as `getProfile`.
- **Bug:** Found, not fixed: (1) `client/src/components/freshly/OtpPage.jsx:97` saves `response.data.accessToken` as the token, but `verify()` returns `onBoardToken`, so the stored token is the string "undefined" and the next call to `/auth/register` is a 401 — the sign-up flow cannot finish from the client until it stores `onBoardToken`. (2) A verified-but-incomplete user (`COMPLETE_REGISTRATION` from `/auth/login`) has no token after the 10-minute onboarding token expires, and `signup()` returns 409 for a verified phone, so they cannot complete. (3) `verify()` FORGOT_PASSWORD branch still never commits. (4) `req.headers["user_agent"]` in `register()` should be `"user-agent"`.
- **Note:** The edit tool rewrote the file as LF; restored CRLF (863/863 lines) to match the working copy. The file still holds earlier uncommitted work (the `sendOtp` swap, step 2).

## Task 71 — Fix the bugs found while doing step 5
- **Status:** ✅ Done (not run: auth-service and the client are not running here; `node --check` and `accountState.check.js` pass)
- **Instruction:** "fix new found bugs."
- **Done:**
  - **Client token (`OtpPage.jsx`):** stores `onBoardToken` (via `setToken`) and `resetToken` only when the response has them. Before, it saved `accessToken`, which `verify()` never returns, so sign-up's `/auth/register` call got a 401. It also saved the string "undefined" over a logged-in user's token on every Profile → change-password OTP.
  - **`SignUp.jsx`:** `OtpPage` now gets `type="SIGNUP"`; without it the verify call carried no `type` and could not find an OTP.
  - **Stuck verified-but-incomplete user:** `NEXT_ACTION` maps `VERIFIED_INCOMPLETE` to `SIGNUP`; `signup()` now refuses only an `ACTIVE` account (409) and re-sends the OTP otherwise, so `verify()` issues a fresh onboarding token and `register` can finish. `COMPLETE_REGISTRATION` is no longer returned by `/auth/login`; `LOGIN_MESSAGE` and `accountState.check.js` updated.
  - **`verify()` FORGOT_PASSWORD:** now commits, so the DB connection is released and the OTP is saved as used. Also removed a duplicate rollback in the "Unsupported OTP type" branch, which threw and turned the 400 into a 500.
  - **`register()`:** reads the `user-agent` header (was `user_agent`, always undefined).
  - **Design doc:** gap row, §6.4 login bullet and P0.4 updated (login part done; `role` allowlist and `INTERNAL_API_KEY` still to do).
- **Files:** 0 created, 7 edited — `auth.service.js`, `accountState.js`, `accountState.check.js`, `OtpPage.jsx`, `SignUp.jsx`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md` 
- **Decision:** A verified-but-incomplete user redoes the OTP instead of getting a "complete profile" shortcut: no token exists for them, and the OTP re-proves the phone.
- **Note:** `PhoneLoginPage.jsx` still has a `COMPLETE_REGISTRATION` branch that can no longer be reached; left in place. The register response does not return the access token, so the client keeps the 10-minute onboarding token until the refresh cookie takes over. All touched files kept CRLF (OtpPage's missing final newline preserved).

## Task 72 — P0.3: SMS console provider in auth-service
- **Status:** ✅ Done and checked on dev (auth-service only; delivery-service deliberately not done, see Note)
- **Instruction:** "complete this" (design doc row P0.3).
- **Done:**
  - New `auth-service/src/utils/sms/index.js` (`send({ to, text, kind })`, provider chosen from `SMS_PROVIDER`) and `console.provider.js` (writes `[sms:console] to=… kind=OTP text="…"` through the winston logger).
  - `modules/sms/sms.service.js`: the missing `GetProvider` import is gone; `sendOtp({ phone, otp })` calls `send` and still only logs on failure (a failed text never fails the request).
  - Replaced the three `emitEvent(TOPICS.OTP_REQUESTED, …)` calls in `auth.service.js` (sign-up new user, sign-up existing user, forgot-password) with `await sendOtp(...)`; the try/catch around the first two was dead and went. Wired the fourth place, the commented-out send in `otp.service.js` `resendOtp`.
  - `config/env.js`: `SMS_PROVIDER` (only `console` for now, default `console`). The service exits at startup with `console` and `NODE_ENV=production`. No `.env` change needed.
- **Checked:** rebuilt auth-service and ran every path with fake phones. Sign-up (new and existing), forgot-password and resend each wrote the `[sms:console]` line, and the codes matched what the API returned. An unknown phone sent nothing. Resend's response is still `data: null`, so there its OTP shows only in the log. `NODE_ENV=production` → exit 1 with the message; `SMS_PROVIDER=messagecentral` → exit 1 ("must be [console]"). Test users, OTPs and audit rows deleted; user and OTP counts back to baseline. One extra `auth_audit_logs` row is a real `LOGIN_SUCCESS` for user 1 made through the app during the test, not mine.
- **Files:** 2 created (`utils/sms/index.js`, `utils/sms/console.provider.js`), 6 edited — `config/env.js`, `modules/sms/sms.service.js`, `modules/auth/auth.service.js`, `modules/otp/otp.service.js`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` (P0.3 row), `task_Logger.md`.
- **Note:** **Do not deploy auth-service to production until a Message Central provider exists** — the production guard means it will not start. delivery-service was not given the module: nothing there calls SMS until Phase 1, and the same guard would stop its next production deploy for no gain; copy the two files and the guard when Phase 1 needs them. `auth.service.js` also holds other uncommitted work from Tasks 69–71; my part is the import and the three `sendOtp` lines. Per "leave env", the three `.env` files (`backend/`, `auth-service/`, `client/`) are tracked in git again after the Task 59 removal was un-staged outside the session; I left them alone, so a commit and push would include them.

## Task 72 — Explain the rest of P0.4 (`role` allowlist, `INTERNAL_API_KEY`, internal partner route)
- **Status:** ✅ Done (read-only; nothing changed, waiting on go-ahead)
- **Instruction:** "explain how we do this." (the `role` allowlist on `/auth/signup`, `INTERNAL_API_KEY` and the internal partner route)
- **Done:** Traced the gateway, auth-service `app.js`/`env.js`/validation and docker-compose, and wrote up the approach.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Decision (open):** Mount the internal route at `/internal/partners`, not `/auth/internal/partners` as the design doc says: the gateway proxies every `/auth/*` path (`services.config.js` lists `/auth`, `proxy.register.js` mounts by prefix), so the doc's path would be reachable from outside; `/internal` is not in the gateway list. Design doc to be corrected when this is built.
- **Note:** A `role` in the sign-up body is rejected today (Joi rejects unknown keys on the `signUp` schema), so there is no live privilege hole; the work adds the feature with a fixed list. delivery-service already has unused `AUTH_SERVICE_URL` / `AUTH_CREATE_USER_PATH` (default `/auth/register`, stale) in its env schema.

## Task 73 — Is the `role` allowlist on `/auth/signup` needed?
- **Status:** ✅ Done (discussion only; nothing changed, waiting on your confirmation)
- **Instruction:** "i think role allow list is irelevent for signup".
- **Done:** Checked the design doc. The role is used in D2 (applicant identity), §6.1 (applicant routes gated by role `DELIVERY_PARTNER`), the sign-up diagram, Q2 (existing customer cannot apply) and the internal route (creates a `DELIVERY_PARTNER` user). D3 already says operational routes use an ACTIVE `delivery_partners` row, not the role. Conclusion: you are right that it is not needed; dropping it also removes the Q2 limit.
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Decision (open):** Drop the sign-up role (no code change: `signup` already rejects `role`), reverse D2 in the design doc, make the internal route "find or create a user by phone". Needs your OK before the doc is edited.

## Task 74 — Explain the no-role trade-off and the internal API with examples
- **Status:** ✅ Done (read-only; nothing changed, waiting on go-ahead)
- **Instruction:** "explain tradeoff with example and tell internal api implementation and usage with example".
- **Done:** Explained, with examples: (1) what the old 409 caught that the no-role model does not (a mistyped number landing on a real customer), and the cheap guard (the route returns `created` and `phone_verified` so the dashboard can ask staff to confirm); (2) the internal route as `POST /internal/users` (find or create a user by phone), the key middleware, and the on-behalf call from delivery-service with `fetch` (the same way it already calls the order and inventory services).
- **Files:** 0 created, 1 edited — `task_Logger.md`
- **Decision (open):** Name the route `/internal/users`, not `/internal/partners`, since no partner role is involved any more. Race ceiling noted: two simultaneous calls for the same new phone can hit the unique constraint; a retry fixes it.

## Task 75 — `role` allowlist on `/auth/signup`, one role per number
- **Status:** ✅ Done (checks pass; the 409 rule is not run live: auth-service is not running here)
- **Instruction:** "implement role list check for signup and user cant have two role or customer cant become delivery partner".
- **Done:** `POST /auth/signup` accepts an optional `role` that must be `CUSTOMER` or `DELIVERY_PARTNER`; anything else (`SUPER_ADMIN`, `ADMIN`, `OPS_STAFF`, wrong case, empty) is a 400 from the existing Joi middleware. `signup()` defaults the role to `CUSTOMER` and creates the user with it. For an existing number the role is never changed: asking for a different role returns 409 "already registered for a different account type, use another number", checked before the "already exists" 409. So a customer number cannot become a delivery partner and a partner number cannot become a customer; staff numbers cannot be reused either (the storefront default is `CUSTOMER`).
- **Files:** 1 created — `auth-service/signupRole.check.js`; 5 edited — `auth-service/src/constants/roles.js` (reused the existing file: `SIGNUP_ROLES`, `DEFAULT_SIGNUP_ROLE`), `src/middleware/validation.js`, `src/modules/auth/auth.service.js`, plus `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` and `task_Logger.md`
- **Decision:** This keeps the original design (D2, Q2). I had suggested dropping the sign-up role; you chose to keep it. `signup()` is the only code that writes `role`, so the rule lives there only.
- **Note:** The rule applies to unverified rows too: a person who started a customer sign-up and never verified is still blocked from a partner sign-up with that number. The internal partner route (still to build) must apply the same rule, and `/auth/internal/partners` in the doc is reachable through the gateway (it proxies all of `/auth/*`); use `/internal/...` when it is built. Checks: `node signupRole.check.js` (validation only) and `accountState.check.js`.

## Task 76 — `INTERNAL_API_KEY` and the internal partner route (P0.4)
- **Status:** ✅ Done (middleware, validation and HTTP status codes verified; the create path needs the database, so it is not run live)
- **Instruction:** "yes do it" (build the internal key and the internal partner route).
- **Done:** auth-service has `POST /internal/partners` (body `{ phone, name }`). It is guarded by `requireInternalKey`: header `x-internal-key` is compared with `INTERNAL_API_KEY` in constant time (both sides hashed first); key not configured = 503 (fails closed), missing or wrong header = 401. Body is validated with Joi (10-digit phone, name 2–50), then `findOrCreatePartnerUser`: an existing `DELIVERY_PARTNER` row returns its `user_id` (idempotent); a number that belongs to any other role returns 409 (same one-role rule as `/auth/signup`); a new number creates a `DELIVERY_PARTNER` user (phone unverified) and returns its `user_id`. The route is mounted at `/internal`, which is not in the gateway's `services.config.js`, so it is unreachable from outside. HTTP probe with a stub server: no key 401, wrong key 401, right key with a bad body 400.
- **Files:** 5 created — `auth-service/src/middleware/internalKey.js`, `src/modules/internal/internal.{routes,controller,service}.js`, `auth-service/internalKey.check.js`; 4 edited — `src/config/env.js` (optional `INTERNAL_API_KEY`, min 32), `src/middleware/validation.js` (`internalPartner` schema), `src/app.js` (mount), `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` (path is `/internal/partners`, P0.4 done), plus `task_Logger.md`
- **Decision:** Route lives at `/internal/partners`, not `/auth/internal/partners`: the gateway proxies every `/auth/*` path, so the old path would have been public. Layering follows `adminUser/` (routes → controller → service → repository).
- **Note:** The key is in `delivery-service/.env` (gitignored). I did NOT put it in `auth-service/.env`: that file is tracked by git, so the secret would go into your next commit. Copy the `INTERNAL_API_KEY=` line from `delivery-service/.env` into `auth-service/.env` yourself (or untrack that file); until then the route answers 503. Race ceiling: two simultaneous calls for the same new phone can hit the unique index and return 409; retry in the caller. Checks: `node internalKey.check.js`.
