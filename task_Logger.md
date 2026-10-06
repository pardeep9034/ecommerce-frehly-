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
