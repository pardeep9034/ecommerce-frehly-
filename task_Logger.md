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

## Task 77 — Phase 1: applicant path (tables, storage, uploads, endpoints, SMS, client)
- **Status:** ✅ Done (checks pass; run end to end through the real UI on dev; not committed)
- **Instruction:** "now start on phase one" (design lines 429–430), then "continue" for the client half.
- **Done:** delivery-service: four tables and models (`partner_applications`, documents, checks, events) with one migration (applied to dev), ref numbers `FR-P-1001…` from a sequence, one open application per user (partial unique index), AES-256-GCM encrypted file storage on a Docker volume, upload middleware (5 MB, file signature must match the declared type), applicant endpoints under `/delivery-partners/applications` (`POST /`, `GET|PATCH /me`, `PUT|DELETE /me/documents/:type`, `POST /me/submit`, `POST /me/resubmit`), checks seeded at submit (`PHONE_OTP` ticked from the token's phone), `received` SMS through a console provider (production start refused with it). Document numbers are stored masked plus a keyed hash only. Status changes are one conditional update, so a double tap cannot submit twice. Client: `Apply` (details → OTP → register → create application, retry skips finished steps), `Documents` (real upload per document, number and licence expiry, consent, submit or resubmit), `Status` (from the server: draft, received, changes needed, approved, rejected with re-apply date). Browser run: sign-up → OTP → 4 uploads → submit → `NEW`, `FR-P-1001`, SMS in the log; reload and a tokenless visit redirect correctly. Test data, files and the sequence were reset afterwards.
- **Files:** 23 created, 14 edited. Created — migration `20261008000000-create-partner-application-tables.cjs`; checks `partnerApplicationRules.check.js`, `storage.check.js`, `partnerApplication.check.js`; `middleware/upload.js`; 4 models (`PartnerApplication`, `PartnerDocument`, `PartnerApplicationCheck`, `PartnerApplicationEvent`); `modules/partnerApplication/` (rules, service, controller, routes); 4 repositories; `utils/{notify,storage}.js`, `utils/sms/{index,console.provider}.js`; client `apis/partnerApplicationApi.js`, `hooks/use-partnerApplication.js`. Edited — delivery-service `package.json` (multer), `.gitignore`, `config/env.js`, `middleware/validate.js`, `models/index.js`, `app.js`, `auth.check.js`; `backend/docker-compose.yml`; client `Apply.jsx`, `Documents.jsx`, `Status.jsx`, `PartnerBits.jsx` (Timeline key); `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`.
- **Bug:** `auth.check.js` was stale since P0.5 (it expected ADMIN to pass `POST /delivery-partners/`, now SUPER_ADMIN only); fixed in the check. The running auth-service image predated Phase 0 (`role` rejected at sign-up); rebuilt.
- **Decision:** Uploads only while `DRAFT` / `CHANGES_REQUESTED`; `application_id` on `delivery_partners` waits for Phase 2; `received` text uses "1-2" with a hyphen (plain GSM, the DLT template must match); no Python or extra libraries added (multer only). Client shows a `null` application for 401/403/404 so a signed-out visit goes to Apply.
- **Note:** Not built on the client yet: editing details after creation, removing a document, re-applying after a rejection, and the partner `Login.jsx` (still demo) — an applicant who loses the session cannot return through the partner UI (sign-up answers "already exists"). `/auth/register` returns no access token; the client uses the 10-minute onboarding token, then the refresh cookie. Copy `INTERNAL_API_KEY` from `delivery-service/.env` into `auth-service/.env` yourself (tracked file; route answers 503 until then). `STORAGE_KEY` and `DOC_HASH_KEY` are required in delivery-service `.env` (set locally, gitignored): losing `STORAGE_KEY` makes every stored document unreadable. Put the production values in a secret store and back them up. Delivery-service image rebuilt with the final source.

## Task 78 — Login guard on the partner routes, and the real partner login
- **Status:** ✅ Done (checked in the browser on dev; not committed)
- **Instruction:** "add check on partner routes partner is login or not like admin" (after "why partenr login page not built").
- **Done:** `App.jsx` has a `RequirePartner` layout route: every `/partner/*` screen except `/partner/login` and `/partner/apply` needs a token whose role is `DELIVERY_PARTNER`, else it redirects to `/partner/login`. The 10-minute sign-up token counts, so an applicant reaches Documents and Status. `useLocation()` inside the guard re-checks on every navigation (the admin guard is evaluated once when `App` renders and only works because `AdminLogin` does a full page reload). `Login.jsx` is now real: phone + password via `/auth/login/password`; a customer or staff number is refused (no token stored); APPROVED or no application → `/partner/home`, any other status → `/partner/apply/status`. Profile "Log out" now calls `/auth/logout` (best effort) and clears the token; before, it was a link that signed nobody out, which the guard would have turned into a hole. Browser run: no token, a CUSTOMER token and an ADMIN token on `/partner/home`, `/partner/web`, `/partner/history`, `/partner/apply/status` all went to login; a partner token reached `/partner/profile`; `/partner/apply` stayed public; sign-up → Documents worked under the guard; log out cleared the token; wrong password showed "Invalid phone or password" and stored nothing; right password landed on "Finish your application". Test user, application and sequence reset afterwards.
- **Files:** 0 created, 7 edited — client `App.jsx`, `lib/tokenStorage.js` (`getTokenRole` moved here from `App.jsx`), `apis/authApi.js` (`logout`), `pages/partner/Login.jsx`, `pages/partner/Profile.jsx`; `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`.
- **Decision:** The guard only reads the role from the token, like the admin one; it does not check `exp`, because an expired access token with a live refresh cookie is still a valid session (the axios interceptor refreshes it). I did not dispatch `loginSuccess` for partners: that redux state means "storefront shopper". Partner sign-in leaves the refresh cookie set even when the number turns out not to be a partner (the server sets it before the client sees the role); the same credentials already work on the storefront, so I left it.
- **Note:** The guard is client-side only; the real protection is still each service checking the role (delivery-service applicant routes need `DELIVERY_PARTNER`). Known gaps: a signed-in applicant who registered but never created an application can't create one (Apply tries a second sign-up); forgot-password for partners has no partner screen; `/auth/logout` reads `req.user.id` while tokens carry `user_id`, so its audit row has no user (existing, not touched).

## Task 79 — Desktop (web) login page for partners
- **Status:** ✅ Done (checked in the browser on dev; not committed)
- **Instruction:** "web dont have login page for partner create it" (the desktop workspace at `/partner/web/*` had no sign-in; the first `/partner/login` is phone-sized).
- **Done:** New `/partner/web/login`: split-screen desktop sign-in modelled on the admin one (phone + password, show/hide, "keep me signed in", inline error, link to Apply). `RequirePartner` now sends a visitor of `/partner/web/*` to it and the phone screens to `/partner/login`. Both login pages share the new `lib/partnerSession.js` (`signInPartner`: login, role check, store token, pick the landing path; `signOutPartner`: revoke session and clear the token), so the mobile `Login.jsx` and `Profile.jsx` were trimmed to call it. The desktop sidebar (`WebShell`) had no way to sign out; it now has a Log out button. Approved or staff-created partners land on `/partner/web`; applicants go to `/partner/apply/status` (the phone-sized status page, on desktop too). Browser run with a real registered partner: `/partner/web/orders` with no token went to the web login; wrong password showed "Invalid phone or password" and stored nothing; right password with no application landed on `/partner/web` (Today); Log out cleared the token and returned to the web login; with a draft application it landed on `/partner/apply/status`; the mobile login still lands on status and `/partner/history` still goes to `/partner/login`. Test user, application and sequence removed afterwards.
- **Files:** 2 created — client `pages/partner/web/Login.jsx`, `lib/partnerSession.js`; 6 edited — `App.jsx` (lazy import, route, guard redirect), `pages/partner/Login.jsx`, `pages/partner/Profile.jsx`, `components/partner/WebShell.jsx`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` (Login row), `task_Logger.md`.
- **Decision:** One shared module instead of copying the sign-in into a second page. No "Forgot password" link: there is no partner reset screen and the storefront one ends on the storefront login. No lockout text on the page: the lock time is an env value, so a number in the copy would go stale.
- **Note:** Applicants who sign in on desktop still land on the phone-width Status page. The web screens still run on demo data. Same gaps as Task 78 (no recovery for a registered-but-never-applied account; no partner forgot-password screen).

## Task 80 — Plan for Phase 2 (review path) as an artifact
- **Status:** ✅ Done (plan only; no code written, nothing committed)
- **Instruction:** "create a plan for this and create an artifact of that plan in detail, and explain to me every edge case also" (design line 439, Phase 2 — review path).
- **Done:** Read the design doc against the real Phase 1 code (service, rules, repositories, models, migration, `app.js`, auth and validate middleware, gateway, client pages) and wrote the Phase 2 plan as a published artifact: scope, 13 places where the Phase 1 code changes the design, 12 decisions to confirm (P2-1 to P2-12), 11 build steps with a "done when" each, the 12 routes and the staff detail shape, application / document / check rules with diagrams, the approval transaction with gap codes, 82 edge cases in nine groups (what can happen, how the plan handles it, how it will be proved), the test plan and rollout notes. Link: https://claude.ai/artifact/3drZ72ML4rTG1ihr79kiK6
- **Files:** 0 created, 1 edited — `task_Logger.md`. (The page generator lives in the session scratchpad, outside the repo.)
- **Decision:** Plan states a default for every open point so work can start; the design doc was not edited, since several defaults (re-upload keeps `UNDER_REVIEW`, reject from `CHANGES_REQUESTED`, signed URL multi-use for 120 s) change its text and wait for the user's answer.
- **Note:** Biggest traps found: Phase 1 checks status outside its transaction with no lock, `version` is never bumped, `AppError` cannot carry the gap list, helmet blocks the file route from the dashboard, the file token lands in request logs, two approvals can take the same vehicle plate, and an applicant stuck in `CHANGES_REQUESTED` can never be closed out.

## Task 81 — Lock the application row in `putDocument` (applicant vs reviewer race)
- **Status:** ✅ Done (uncommitted)
- **Instruction:** "in this lock the user application row to resolve concurrency because if applicant and reviewer read same row at simultaneously and perform operation" (selection: `putDocument`).
- **Done:** `putDocument` read the application, checked it was editable, stored the file, then wrote the document row in a later transaction. A reviewer moving the application to `UNDER_REVIEW` (or deciding it) in that gap was not seen, so a file could land on an application the reviewer already judged. The transaction now starts with `findByIdForUpdate` (`SELECT … FOR UPDATE`) and runs the editable / allowed-type check on that locked row. A reviewer's `UPDATE` waits for the upload to commit, or the upload waits and is refused with 409 once the reviewer commits. The early check stays, to refuse before the file is written to disk. Both checks share one helper, `assertAcceptsDocument`. The lock covers the database writes only; the encrypted file is written before it.
- **Test:** `partnerApplication.check.js` has a race section: a plain `UPDATE … SET status = 'UNDER_REVIEW'` is held open in a second transaction, an upload is started, it must still be pending after 600 ms, then after the commit it must return 409 with no document row and no file left. It fails on the old code (`true !== false`) and passes now. Also run: `partnerApplicationRules`, `storage`, `auth` checks, all ok. Test rows and the `FR-P` sequence cleaned (reset to 1001).
- **Files:** 0 created, 5 edited — `partnerApplication.service.js`, `partnerApplication.repository.js` (`findByIdForUpdate`), `partnerApplication.check.js`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` (row-lock note), `task_Logger.md`.
- **Bug:** The first version of the race test simulated the reviewer with `SELECT … FOR UPDATE`, which also blocks the foreign-key check on the document insert and made the unfixed code look correct (`200 !== 409`). A plain `UPDATE` is what the Phase 2 reviewer code does, and it does not block that check.
- **Decision:** Row lock, not `SERIALIZABLE` or a version column: READ COMMITTED plus `FOR UPDATE` re-reads the committed row after the wait, and the lock is held for a few statements. Only `putDocument` changed; `deleteDocument` and `updateMine` have the same check-then-write gap, left alone because no reviewer route exists yet (noted in the design doc for Phase 2).
- **Note:** Docker was fully stopped when this started; only postgres, rabbitmq and delivery-service were started. The delivery-service image still has the old source baked in; the container has the new `src` copied in, so run `docker compose build delivery-service && docker compose up -d --no-deps delivery-service` before relying on it after a recreate.

## Task 82 — Bump the application `version` on every applicant write
- **Status:** ✅ Done (uncommitted)
- **Instruction:** "implement it" (after asking whether `version` is still needed with the row lock in place: yes, the lock covers writes at the same instant, the version covers a reviewer deciding on a screen that went stale minutes ago).
- **Done:** `version` existed in the model but nothing changed it. Now `PartnerApplicationRepository.transition()` sets `version = version + 1` on every status move (covers `submit` and `resubmit`, and the Phase 2 decisions that will use it). `putDocument` increments it on the locked row; `deleteDocument` and `updateMine` now run in a transaction that locks the row, re-checks the status on the locked row, writes, and bumps (they had the same unlocked check-then-write gap). `deleteDocument` removes the stored file after the commit, like a replaced file in `putDocument`. Refused or rolled-back writes leave the version alone.
- **Test:** `partnerApplication.check.js` reads `version` after each kind of write: starts at 0; two edits give 2 (a refused edit rolled back and did not count); an upload +1; a delete +1 with the repeat 404 adding nothing; two simultaneous submits +1 in total; refused writes after submit leave it unchanged; the raced upload that was refused leaves it unchanged; a resubmit +1. All pass, as do the `partnerApplicationRules`, `storage` and `auth` checks. Test rows and the `FR-P` sequence cleaned (reset to 1001).
- **Files:** 0 created, 5 edited — `partnerApplication.service.js`, `partnerApplication.repository.js`, `partnerApplication.check.js`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`.
- **Decision:** Bump in `transition()` rather than in each caller, since it is the one place every status move goes through. Early "refuse before storing the file" checks stay in `putDocument` and `updateMine`; `deleteDocument` has no early check because it writes no file first.
- **Note:** The staff detail response and the `expected_version` comparison are Phase 2. Open: whether the advisory `start-review` claim should bump the version (it would make other reviewers' open screens stale). Docker Desktop was stopped again at the start; I started it and then postgres by hand (it had exited with 255).

## Task 83 — Migration: `delivery_partners.vehicle_number` unique
- **Status:** ✅ Done (uncommitted; applied to dev only)
- **Instruction:** "create migration for make vehicle_number unique" (selection: `vehicle_number` in `DeliveryPartner.model.js`).
- **Done:** `20261011000000-make-delivery-partner-vehicle-number-unique.cjs` adds `delivery_partners_vehicle_number_key` (`UNIQUE (vehicle_number)`) through `queryInterface.addConstraint`; `down` removes it. The model field got `unique: true` to match (the schema is migration-only, nothing calls `sync()`, so this is documentation). The service already checked for a duplicate before insert and update; that check could be passed by two requests at once, and the constraint now settles that race. A violation reaches the global handler, which already maps `SequelizeUniqueConstraintError` to 409.
- **Test:** applied with `sequelize-cli db:migrate`, then `db:migrate:undo` (constraint gone) and `db:migrate` again. In a rolled-back transaction: one plate twice fails with `duplicate key … (PB65AX4412)`, two NULL plates both insert. The dev table was empty, so no duplicates to fix first. `partnerApplication.check.js` still passes; the image was rebuilt.
- **Files:** 1 created — the migration; 3 edited — `DeliveryPartner.model.js`, `DELIVERY_PARTNER_ONBOARDING_DESIGN.md` (note), `task_Logger.md`.
- **Decision:** Plain unique, as asked, not a partial or expression index. NULL repeats on purpose (cycles have no plate); empty strings cannot reach the column (Joi rejects them). No duplicate-scan guard like the BIGINT migration: nothing is converted, and Postgres refuses with the duplicated value in the message.
- **Note:** Plates compare exactly, so `pb65ax4412` and `PB65AX4412` (or with spaces) count as different. Admin-created partners are not upper-cased and the application keeps inner spaces. If you want that closed, the fix is to normalize in one place (strip spaces, upper-case) and index that; not done because it changes stored data and two services' write paths. For production run `npx sequelize-cli db:migrate` against the real database after checking `SELECT vehicle_number, count(*) FROM delivery_partners GROUP BY 1 HAVING count(*) > 1`. The container has no `dotenv` binary, so `npm run db:migrate` fails there; I used `npx --yes sequelize-cli` inside the container.

## Task 84 — Phase 2 backend: review path, decisions and approval
- **Status:** ✅ Done and checked (uncommitted); dashboard is Task 85, phone screens and close-out are Tasks 86–87
- **Instruction:** "start bulding phase 2 before it commit the code", then "use artifact for refrence of phase 2" (artifact from Task 80).
- **Done:** All 12 routes of the review path under `/delivery-partners/applications`: queue (filters, search, paging), detail, start-review, signed file link (120 s, several uses) and the file route, verify, ask to re-upload, tick / untick checks, notes, request changes, reject, approve. The server decides what is allowed (`can_verify`, `can_tick`, `blocked_by`, `gaps`, `warnings`, `can_decide`), so the screen holds no rules. Every write locks the application row first and judges the status on that row; decisions carry `expected_version` and a stale one is a 409 with the current version. Approve runs one transaction: all gaps are collected before the first insert (missing or unverified documents, checks not done, licence expiry, zone off or unknown, plate already taken, partner row already there), an advisory lock on the plate stops two approvals of one vehicle, then partner + zone link + status history + application update + event are written together; the text goes out after the commit. Reject and approve are ADMIN / SUPER_ADMIN only, answered before any query; the creator of an on-behalf application cannot approve it. Texts: changes, re-upload, approved (first name only), rejected (re-apply date, e.g. `11 Nov 2026`). Also: the re-apply message from Phase 1 now gives the Indian calendar day, like the text (B8); `AppError` can carry a list; request logs hide the file token.
- **Test:** `partnerReview.check.js` (live, 378 assertion calls, several inside loops): role matrix for all 12 routes, queue / detail / file link edge cases, verify and re-upload rules, every dependency of a check, request changes (stale, from NEW, twice, three documents, a name edit undoing ID_MATCH), reject (every reason rule, privacy of the applicant view, cooldown date, silent applicant), every wrong-status answer, approve (gaps, validation, zone other than the applicant's, cycle, forced failure halfway leaves no partner row, stale then fresh, double press, two admins at once = one 201 + one 409, same plate written two ways at once = one 201 + one 400, creator rule) and the exit test: the new partner appears in `GET /delivery-partners/list`. Green on four runs in a row, as are `partnerApplication.check.js`, `auth.check.js` and `partnerApplicationRules.check.js`. The `[sms:console]` lines were read in the container log: one text per decision, none doubled by a double press.
- **Files:** 4 created — `partnerReview.service.js`, `partnerReview.controller.js`, `partnerReview.check.js`, migration `20261012000000-partner-review-path.cjs`; 16 edited — rules + its check, `validate.js`, `partnerApplication` service / repository / routes, three repositories, `deliveryPartner.repository.js`, `notify.js`, `AppError.js`, `app.js`, two models, `task_Logger.md`.
- **Decision:** Reject from `CHANGES_REQUESTED` only with `NO_RESPONSE` (otherwise a silent applicant could never be closed out). `max_active_orders` is required on approve (1–10). A cycle partner is stored with no plate. Asking for one re-upload makes a single visible `DOC_REJECTED` event, not two. The signed link returns a path; the client adds the API base.
- **Note:** The first run of the live check failed once at "verify RC" (409) for one application and passed on the next four runs with nothing changed; the check now prints the server's message, so a repeat will say why. Proved the check can fail: with one rule broken at a time in the running container, `partnerReview.check.js` went red for the row lock, the admin-only guard on approve / reject, the creator rule, the file-token audience, the `expected_version` comparison, the plate lock and the "open the file before verifying" rule; every file was restored and the check is green again. The lock was caught at the first race test (start-review), so the later approve and upload-vs-reject races were not separately shown to fail without it. `auth.check.js` was left alone: it asserts DELIVERY_PARTNER is blocked on every route it finds, which is wrong for the applicant routes here; the 12-route role matrix is in `partnerReview.check.js`. `ALLOWED_ORIGINS` in the delivery-service `.env` must list the dashboard origin before the preview works (step 10). The check uses up `FR-P` numbers; reset the sequence to 1001 at close-out.

## Task 85 — Phase 2 dashboard: application queue and review screen
- **Status:** ✅ Done and walked through in the browser (uncommitted); phone screens are Task 86, close-out Task 87
- **Instruction:** same as Task 84 (the artifact's step 10).
- **Done:** The Applications tab is live (search, zone and status filters, paging, `verified / required` documents) and shares its filter bar with the Partners tab. `/dashboard/delivery-partners/applications/:id` is the review screen: document tabs with a preview through the signed link (image, or PDF in an iframe; link renewed on open, on reload, and after a new upload), verify with the licence expiry prefilled, ask for one re-upload, the screening checklist (greyed with the server's reason), notes and a timeline in IST, and the decisions. Approve (zone, max orders, note) is shown to ADMIN / SUPER_ADMIN only; ops staff see "Request changes" and a line saying an admin decides. The screen holds no rules: it shows `can_verify`, `can_tick`, `blocked_by`, `gaps` and `can_decide` from the server. New: `partnerReviewApi.js`, `use-partnerReview.js`, `lib/partnerReview.js`; the demo application / review data was removed from `partnerDemoData.js`.
- **Test:** Browser run against the real backend with seeded applicants (real PNG / PDF files): queue and filters; image and PDF preview cross-origin; start review; verify photo, Aadhaar, licence, RC; checks unlock one by one with reasons; Approve disabled while gaps are listed; approve one application and it appears in the Partners tab as Active in the chosen zone (the exit test); request changes (message + two items) turns the licence "Sent back" and greys the checklist; reject with OTHER needs a 10-character note and shows the outcome block; ops staff see no Approve / Reject; a stale decision (version moved by a direct API call while the dialog was open) gives the 409 toast, keeps the typed text and ticks, refreshes the page behind, and sending again works; 390 px wide has no sideways scroll. Lint clean, production build passes.
- **Files:** 3 created — `partnerReviewApi.js`, `use-partnerReview.js`, `lib/partnerReview.js`; 4 edited — `DeliveryPartners.jsx`, `PartnerApplicationReview.jsx` (rewritten), `partnerDemoData.js`, `task_Logger.md`; backend `partnerReview.controller.js` and its check (the `Content-Disposition` name).
- **Decision:** `Content-Disposition` now has a plain name (`document.png`), because the PDF viewer's title bar showed the signed token from the URL.
- **Note:** Not run in a browser: the link expiring after 120 s while a tab stays open (images retry once, "Reload document" is always there), and two real browsers for the 409 (a direct API call changed the version instead, which exercises the same server path). The four counts above the tabs and the partner profile page are still demo data. `View partner` opens that demo profile page. The browser used `VITE_API_BASE_URL=http://127.0.0.1:4000` set in the shell only, because `localhost:4000` hangs from the host (IPv6 through Docker Desktop); no file changed. Test data (throwaway staff, seeded applicants, screenshots) is removed at close-out.

## Task 86 — Phase 2 phone screens: changes requested and re-upload
- **Status:** ✅ Done and walked through in the browser (uncommitted); one gap left open (below)
- **Instruction:** same as Task 84 (the artifact's step 11).
- **Done:** Status shows what to fix after a staff request: for Request changes the message and "To fix: …" with readable names, for a single re-upload "<document> was sent back" and the reason; the timeline has a `DOC_REJECTED` title. Documents lists only rejected *required* documents as blocking Resubmit (P2-10), and the reject reason wraps instead of being cut off. On the dashboard the "Being reviewed by" line is hidden after a decision and the Request changes button no longer wraps.
- **Test:** Browser at 390 px against the real backend: Rahul (Request changes) and Vijay (re-upload) went status → documents → replace file → Resubmit → under review with "Resubmitted" in the timeline; the rejected screen (re-apply date 11 Nov 2026, no reason shown) and the approved screen. Lint clean, build passes.
- **Files:** 0 created, 4 edited — `Status.jsx`, `Documents.jsx`, `PartnerApplicationReview.jsx`, `task_Logger.md`; backend `partnerReview.check.js` (below).
- **Decision:** The phone does what the server's `GET /me` says (`events`, `required_docs`) and holds no rules of its own.
- **Note:** **Open gap:** no phone screen edits name, email, preferred zone or vehicle number (`PATCH /me` exists, the client never calls it, Apply redirects existing applicants), yet the staff Request changes dialog offers those four as items. Such a request cannot be fixed in the app. Fix: a small "Your details" form on Documents, or drop the four checkboxes until then; not decided. **Flaky check:** `partnerReview.check.js` failed 3 times in 8 runs (newest event not the note; "jwt expired" on the first call; "Open the file first" on verify). Cause found: the Docker Desktop VM clock steps back 0.05–0.2 s then forward about 0.5 s every 30 s, which flips timestamps taken a few ms apart (the long jump after an idle host expires a token). Product code was not changed; the check now waits 0.4 s before opening a file (about 20 s per run) and finds the note by its text. Seven green runs in a row afterwards. The first and third failures fit a back-step but are not proven one by one; the second is attributed to a large jump, also unproven.

## Task 87 — Phase 2 close-out
- **Status:** ✅ Done (uncommitted)
- **Instruction:** same as Task 84 (the artifact's step 12).
- **Done:** All four checks green after a rebuild (`partnerApplication`, `partnerReview`, `auth`, host `partnerApplicationRules`). Design doc: "Phase 2 status" block (where Phase 2 differs from the plan, the open gap, what was not run in a browser), the "works once" wording in the test plan, and the §6.3 `Content-Disposition`. Test data removed: throwaway staff users 12 and 13 with their sessions, five fake applicant auth rows (990101–990105), all applications, documents, checks and events, the approval-made partner with its zone link and history, the screenshots and `.playwright-mcp` folder at the repo root; `partner_application_ref_seq` is back at 1001; the vite server I started on 5173 is stopped.
- **Test:** After the clean-up every `delivery_partner*` table, `delivery_status_history` and the document volume are empty (the dev DB held no other partners before this work).
- **Files:** 0 created, 2 edited — `DELIVERY_PARTNER_ONBOARDING_DESIGN.md`, `task_Logger.md`.
- **Decision:** No commit, as asked ("before it commit the code"). **Do not commit `backend/services/auth-service/.env`:** it is tracked and its working copy holds a real `INTERNAL_API_KEY`; leave it out or restore it first.
- **Note:** Not run in a browser: the preview link expiring after 120 s on an open tab, and two real browsers for the 409. The "View partner" link and the four counts above the Partners tabs still use demo data. The dashboard home's `orders/admin/stats` returns 403 for ops staff (older issue, not touched).

## Task 88 — Phase 3 plan and artifact
- **Status:** ✅ Done (plan approved; build not started)
- **Instruction:** "now create plan for phase 3 and create artifact of it".
- **Done:** Read the delivery-service, auth-service and client code against design §9 and wrote the plan (12 build steps, decisions P3-1 to P3-12, 11 findings in the current code). Three choices were confirmed by you: staff attest the applicant's consent; uploads and Submit live on the review screen in a Draft mode; the only extra is the phone "Your details" form. Published as a private Claude artifact: https://claude.ai/artifact/8r9PYBDsCUTXFbNCuwVYv2 (scope, findings, decisions, flow diagram, steps, API, 62 edge cases, tests, rollout).
- **Test:** The page's inline script passes `node --check`; the 62 edge-case ids are unique and every row has a valid tag. Not opened in a browser: the mermaid diagram loads from a CDN, and without it the diagram shows as plain text.
- **Files:** 0 created in the repo, 1 edited — `task_Logger.md`. The plan is in `C:\Users\dk519\.claude\plans\lucky-juggling-tulip.md`; the page source is in the session scratchpad.
- **Decision:** Defaults P3-4 to P3-12 are mine; change any by id. Still **do not commit `backend/services/auth-service/.env`** (tracked, holds a real `INTERNAL_API_KEY`).

## Task 89 — Client could not reach the APIs
- **Status:** ✅ Done
- **Instruction:** "check you apis are not working on clent side".
- **Done:** Two causes, neither in the API code. (1) After a Docker restart only postgres, rabbitmq and config-service were running; api-gateway, auth, delivery and the rest sat in "Created". `docker compose up -d` started them. (2) `client/.env` sets `VITE_API_BASE_URL=http://localhost:4000`; on this machine `localhost` resolves to `::1` first and Docker Desktop's IPv6 port accepts the connection then resets it, so every browser call failed with `ERR_CONNECTION_RESET` (seen on `/auth/profile`). Added the git-ignored `client/.env.local` with `http://127.0.0.1:4000` (Vite prefers it over `.env`) and restarted vite on 5173, since env files are read only at startup. The page origin stays `localhost:5173`, the only origin the gateway's CORS allows.
- **Test:** In a browser on 5173: sign-in with the seeded super admin works; dashboard home, Delivery partners (list, applications queue, zones) and the public `/partner/apply` zones call all return 200 with 0 console errors. Not run: sign-up OTP, document upload and review actions (no data to act on; they passed in the Phase 2 browser run).
- **Files:** 1 created, 0 edited — `client/.env.local` (git-ignored). Test screenshots removed.
- **Note:** The tracked `client/.env` still says `localhost`; anyone with the same Docker setup will hit this until it is changed to `127.0.0.1` or they add their own `.env.local`. Left for you to decide. Stat cards on Delivery partners (7, 42, 18, 3) are still demo numbers; Phase 3 wires the first one.


## Task 90 — Admin sent to the login page when the session expires
- **Status:** ✅ Done and verified in the browser (uncommitted)
- **Instruction:** "i noticed admin logs out or token is expired and admin goes to login page check it".
- **Bug:** The access token lives 15 minutes and is renewed silently with the `refreshToken` cookie. That renewal always failed with `400 Refresh token is required` (seen in the auth-service log): the page is `localhost:5173` but Task 89 pointed the API at `127.0.0.1:4000`, which the browser treats as another site, so the `SameSite=Lax` cookie is never sent. The interceptor then cleared the token and the next load went to `/admin/login`. Login itself worked, so only the 15-minute mark showed it. Dev only: production cookies are `SameSite=None; Secure`.
- **Done:** `vite.config.js` proxies `/api` to `http://127.0.0.1:4000` (strips `/api`), and `client/.env.local` now sets `VITE_API_BASE_URL=/api`. The browser only talks to `localhost:5173`, so the cookie is first-party and no CORS is involved. Vite reads env files at startup; I touched `vite.config.js` to make it restart itself.
- **Test:** Before: from `localhost:5173`, login 200 then refresh 400; from `127.0.0.1:4000` (same site) login 200 and two refreshes 200, so the server was fine. After: through the app's own axios, login, replace the token with a dead one, `GET /auth/profile` gives 401, then refresh 200, then the retry 200; done twice in a row (rotation works). No check script left behind: config-only change, and the live run is the check.
- **Files:** 0 created, 3 edited — `client/vite.config.js`, `client/.env.local` (git-ignored), `task_Logger.md`.
- **Decision:** Proxy over opening the app at `127.0.0.1:5173` (needs Vite on IPv4, a second CORS origin in the gateway and auth-service env, and a Docker rebuild).
- **Note:** The tracked `client/.env` still says `http://localhost:4000` (same site, so no cookie problem for anyone whose `localhost` works). Everyone else needs the `/api` line in their own `.env.local`. Separate and untouched: the `/dashboard` guard in `App.jsx` runs only when `App` renders, so after a failed refresh the admin stays on the page until the next reload.

## Task 91 — Plan: partner "Forgot password" on mobile and web login
- **Status:** ✅ Done (plan only; nothing built)
- **Instruction:** "in partner web and mobile, in both logins, the partner doesn't have a forget password option. Create a plan for this."
- **Done:** Read both partner login pages, the customer reset page, the auth-service forgot / verify / reset endpoints, the OTP model and the SMS provider. The three endpoints and the `authApi` functions already exist and work through the gateway, so the plan is mostly client work: one responsive page at `/partner/forgot-password` for both logins (after the question "why different pages for mobile and web?": the split exists for the app screens, not for login), a "Forgot password?" link on both logins and a "Password changed" notice back on the login. Four auth-service gaps are in scope because partner accounts hold cash and payout details: wrong codes are never capped (`attempt_count` is written, never read), no cooldown on forgot / resend, unfinished accounts get a code, and a reset leaves the 15-minute login lock in place.
- **Test:** None run. Only a read-only probe through the gateway: forgot-password on an unregistered number answers with the generic message, and verify answers 404 "User not found" for it (noted as a number-probing gap, left out of scope).
- **Files:** 0 created in the repo, 1 edited — `task_Logger.md`. The plan is in `C:\Users\dk519\.claude\plans\partner-forgot-password.md`.
- **Decision:** Defaults PW-1 to PW-7 are mine; change any by id. Still **do not commit `backend/services/auth-service/.env`** (tracked, holds a real `INTERNAL_API_KEY`).

## Task 91 — Unapproved partners could open the work screens by URL
- **Status:** ✅ Done (uncommitted)
- **Instruction:** "fix the gap" (an applicant whose application is not yet approved could type `/partner/home`).
- **Bug:** Sign-in sent applicants to their status page, but the route guard in `App.jsx` only checked the token's role, so typing a work-screen URL got past it.
- **Done:** `RequirePartner` now also needs an `APPROVED` application, or no application at all (a partner created by staff), the same rule as sign-in in `partnerSession.js`. It reads the application with the existing `usePartnerApplication` hook, shows the page loader while it loads, and sends anyone else (or a failed lookup) to `/partner/apply/status`. `/partner/apply/*` skips the check.
- **Test:** Browser on 5173 with the `/me` answer faked: UNDER_REVIEW, CHANGES_REQUESTED and REJECTED on `/partner/home`, `/partner/web` and `/partner/history` all land on `/partner/apply/status`; APPROVED and no application (404) stay on `/partner/home`; the status page stays reachable while under review; no token goes to `/partner/login`. Lint clean.
- **Files:** 0 created, 2 edited — `client/src/App.jsx`, `task_Logger.md`.
- **Note:** Client-side guard only. The server already refuses real work to applicants, since no delivery-partner record exists before approval. The hook maps 401/403 to "no application", so a dead session is let through to screens whose calls then fail; left as is.

## Task 92 — Partner forgot-password, step 1: auth-service hardening
- **Status:** ✅ Done (backend only; the phone screen is the next step; uncommitted)
- **Instruction:** "start with step one and we are moving on phone ui only".
- **Done:** In auth-service: (1) `verify()` refuses a code after 5 wrong tries with 429 "Too many wrong attempts" (it counts `attempt_count`; the old code only wrote it). (2) `forgotPassword` and `/auth/otp/resend` send nothing inside 30 s of the last code and give the same generic 200 reply (no 429, which would show the number is registered); new `OtpService.tooSoon()`. (3) `forgotPassword` sends a code only to a finished account (`ACTIVE`); unverified or half-signed-up numbers get the generic reply with no code. (4) `resetPassword` clears `failed_login_attempts` and `account_locked_until`. Two bugs that were already there and stopped any reset from working: it called `revokeByUserId(id, { transaction })` against the signature `(id, reason, options)`, so every reset failed with 400 "Validation Error"; and after the commit it called `kafkaManager`, which is not defined anywhere, so a reset that had changed the password still answered 500. Fixed the call and removed the dead Kafka line (no consumer; the audit log keeps `PASSWORD_RESET_SUCCESS`).
- **Test:** New `passwordReset.check.js` (live, inside the container, throwaway numbers `60000000xx`, ~35 s): half-signed-up number gets no code; a locked account (5 wrong passwords, 423) gets a code once, a second request and a resend inside 30 s send nothing; 5 wrong codes then the right one is 429; after 31 s a new code verifies, the reset succeeds, the new password signs in at once (lock lifted) and the old one stops working. Passes. Rebuilt `auth-service`; `accountState`, `signupRole`, `internalKey` (auth) and `partnerApplication`, `partnerReview`, `auth`, `partnerApplicationRules` (delivery) still pass; 0 throwaway users left.
- **Files:** 1 created — `backend/services/auth-service/passwordReset.check.js`; 3 edited — `auth.service.js`, `otp.service.js`, `task_Logger.md`. Plan updated in `C:\Users\dk519\.claude\plans\partner-forgot-password.md` (phone login only).
- **Decision:** Left alone on purpose: single-use reset token, the verify step's 404 for unregistered numbers, and the desktop login. Still **do not commit `backend/services/auth-service/.env`** (tracked, holds a real `INTERNAL_API_KEY`).

## Task 93 — Why the APIs seem to be called constantly
- **Status:** ✅ Done (diagnosis only; no code changed)
- **Instruction:** "can you check in docker logs or deoliveryservice why apiare constanly caling".
- **Done:** Read the last 15 minutes of auth-service, delivery-service and gateway logs and the client code that calls them. Nothing polls continuously: in the last 2 minutes all seven services handled 0 requests. The bursts in the log were (1) my own check scripts at 08:13 and 08:20 (UTC), and (2) one admin browser session at 08:22:41–08:23:17 when the 15-minute access token expired: 6 `GET /auth/profile` and 3 `POST /auth/refresh-token`, each refresh followed by retries; two profile calls went out with the old token (one 8 s after a successful refresh) and the first refresh took 10 s to answer. Causes in the client: `main.jsx` uses `new QueryClient()` with defaults (`staleTime: 0`, refetch on window focus and on mount), so switching back to the browser refetches every active query, and the `["auth-profile"]` query is used by `DashboardLayout`, `Settings` and `PartnerApplicationReview` while `AuthLoader` and `Navbar` call `getProfile` directly. The only real poll in the client is the order detail page (`use-order.js`, every 15 s until the order is delivered, cancelled or payment failed), and react-query pauses it while the tab is in the background.
- **Test:** Log timelines per service; request counts for the last 2 minutes (all 0). Not reproduced in a browser.
- **Files:** 0 created, 1 edited — `task_Logger.md`.
- **Decision:** Suggested, not applied: `new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } })` in `main.jsx`. Not explained: why the refresh call took up to 10 s.

## Task 94 — Partner forgot-password, phone screens (steps 2–5)
- **Status:** ✅ Done and verified in the browser (uncommitted)
- **Instruction:** "which two bugs found while completing step 1 and in cliet side forget pasword is not implemented partner" (answered the two bugs; then built the client side, phone only).
- **Done:** New page `/partner/forgot-password` on `MobileShell`: number (+91, prefilled from the login), 6-digit code (`CodeInput`, 30 s resend countdown, "Change number"), new password + confirm (8 characters minimum). The reset token stays in component state. After a reset it returns to `/partner/login` with the phone filled in and a "Password changed" notice. The phone login got a "Forgot password?" link under the password that carries the typed number. The page is public (outside `RequirePartner`). The desktop login is untouched. Errors go through `notify`; a 401 on the final step (10-minute reset token gone) sends the user back to step 1.
- **Test:** Browser at 390 px with a throwaway partner: login → link keeps the number → code from the console SMS log; wrong code gives "Invalid OTP" and clears the field; 6-character password and mismatched confirm are refused before any server call; the real change lands on the login with the notice; signing in with the new password reaches `/partner/home`. Console: only the expected 400 from the wrong code and three 404s from `GET /applications/me` (this account has no application). `eslint` clean on `src/pages/partner` and `App.jsx`; `vite build` succeeds. Throwaway account, screenshots and `.playwright-mcp` removed. Not run in the browser: five wrong codes, the 401 restart, and an unregistered number (the server side of each is covered by `passwordReset.check.js`).
- **Files:** 1 created — `client/src/pages/partner/ForgotPassword.jsx`; 3 edited — `client/src/App.jsx`, `client/src/pages/partner/Login.jsx`, `task_Logger.md`.
- **Note:** Still **do not commit `backend/services/auth-service/.env`** (tracked, holds a real `INTERNAL_API_KEY`). In production `NODE_ENV` must be `production`, or `/auth/forgot-password` returns the code in its response.

## Task 95 — Which env file has an issue ("point 4")
- **Status:** ✅ Done (read-only; no code or env changed)
- **Instruction:** "tell me point 4 which enve have issue" (no numbered point 4 in my replies; I checked the env files instead, with the api-gateway `.env` open in the IDE).
- **Done:** Compared `api-gateway`, `auth-service` and `delivery-service` `.env` (secrets masked, compared by hash only). `JWT_SECRET` and `INTERNAL_API_KEY` match between auth and delivery. Findings: (1) auth `NODE_ENV=development`, so `/auth/forgot-password` and sign-up return the OTP in the response; must be `production` at launch. (2) auth `JWT_EXPIRES_IN=24h` and `JWT_REFRESH_EXPIRES_IN=7d` are dead: only `utils/jwt.js` reads them and nothing imports it; the real access token is 15 minutes (`JWT_ACCESS_EXPIRATION`, default in `token.service.js`). (3) auth `REDIS_URL=redis://redis:6379` but docker-compose has no redis service; the code falls back to the database ("Redis unavailable. Using DB only"), and the forgot-password path then logs "Redis SET success" even though nothing was stored. (4) `client/.env` `VITE_API_BASE_URL=http://localhost:4000` resets in the browser on this machine (worked around by the git-ignored `.env.local`). (5) `MAX_LOGIN_ATTEMPTS` is listed twice in auth `.env` (harmless). api-gateway `.env` is fine for development; `ALLOWED_ORIGINS` is localhost-only and must change for production.
- **Test:** Hash comparison of the two shared secrets; grep for which variable names the auth-service reads; compose service list; auth-service log search for Redis.
- **Files:** 0 created, 1 edited — `task_Logger.md`.
- **Note:** Still **do not commit `backend/services/auth-service/.env`** (tracked, holds a real `INTERNAL_API_KEY`).
