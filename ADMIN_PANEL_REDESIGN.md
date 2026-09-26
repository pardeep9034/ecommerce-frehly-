# Admin Panel Redesign — Change Log

Tracks progress against the [design canvas](https://claude.ai/artifact/J1HCuqYpBWVoVNBUJ8eazx) (21 artboards: Login, Overview, Products, ProductDetail, ProductTypes, Categories, Brands, Attributes, Variants, Units, Stock, Movements, Zones, Orders, OrderDetail, Customers, Reservations, Promotions, PromotionDetail, Settings) on branch `feature/admin-panel-redesign`.

**How to use this file:** every time a page from the design gets implemented, add a dated entry under Changelog (frontend done + backend needed, same shape as Login below), then update its row in the Pending table.

## Changelog

### 2026-09-26 — Login page

**Frontend — done** (`client/src/pages/dashboard/AdminLogin.jsx`)
- Two-column layout matching the design: green brand panel (desktop only) + sign-in form. Reuses the existing `--primary` / `--accent` theme tokens, which already match the design's green/yellow exactly — no new colors added.
- Single "Email or mobile" field replaces the phone-only input.
- Password field gets an inline Show/Hide toggle and a "Forgot password?" link. The link points at the existing `/forgot-password` route (customer OTP flow) — no new page was built.
- Added a "Keep me signed in on this device" checkbox (`rememberMe`), sent to the login API. **Not yet honored by the backend** — see below.
- Lockout notice reworded to "5 incorrect attempts will temporarily lock this account" with no duration mentioned. The design's mockup says 15 minutes, but the backend's configured `LOCK_TIME` is 2 hours — changing the copy to lie, or changing the lockout policy just to match a mockup, are both wrong, so this was left as a backend decision (see below).

**Backend — needed, intentionally NOT changed yet** (per your request — you'll pick these up)
- `auth.service.js:440`, `loginWithPassword()` — still calls `UserRepository.findByPhone(phone)`. It needs to call `UserRepository.findByPhoneOrEmail(phone)` instead (that method already exists in `user.repository.js`, just unused) so the new "Email or mobile" field can actually resolve an email. **Until this ships, typing an email on the login page will fail with "User Not Found."**
- `auth.controller.js`, `loginWithPassword()` — the refresh-token cookie (`COOKIE_OPTIONS`) always sets a fixed 7-day `maxAge`, regardless of `rememberMe`. To honor "keep me signed in": when `req.body.rememberMe === false`, set the cookie without `maxAge` (session cookie, cleared on browser close) instead of the 7-day one.
- Decide whether `LOCK_TIME` (currently `7200000` ms / 2h in `.env`) should become 15 minutes to match the design copy, or whether the design copy should change instead. Left untouched — it's a security-policy call.

**Known, accepted frontend limitation**
- The access token still always lives in `localStorage` (`axiosInstance.js`), independent of "remember me" — only the refresh cookie's lifetime is meant to change. Making the access token itself session-scoped would mean switching every reader of `localStorage.getItem("token")` to `sessionStorage` app-wide, which is a much bigger change than the login page alone.
- The design's copy ("For super admins. Store admins and ops staff sign in here too.") is just messaging — `ADMIN`, `SUPER_ADMIN`, and `OPS_STAFF` already share this one login screen and route guard (`ADMIN_ROLES` in `App.jsx`), so no separate "store console" portal was built for this.

### 2026-09-26 — Brands page

**Frontend — done**
- `BrandPage.jsx` / `BrandTable.jsx` / `BrandModal.jsx` (kept the filename; it's no longer a modal)
- Replaced the centered "Add/Edit Brand" modal with the design's persistent split layout: table on the left, an always-visible edit panel on the right (`brand === null` renders it in "Add brand" mode). Clicking a row's edit icon, or the header's "Add brand" button, just swaps what the panel shows — no more open/close modal state.
- Table row now shows a logo avatar (the brand's `logo_url` image, or initials on `bg-accent/20` when there's none) plus the description as subtext under the name, matching the design. The row being edited gets a `bg-secondary` highlight.
- Status badge restyled with the small leading dot from the design (still just Active/Inactive — see gap below).
- "Active" toggle switched from a checkbox to the existing shadcn `Switch` component (`@/components/ui/switch`), matching the design's toggle control.
- `logo_url` is now optional in the form (was a required field) — the initials fallback makes an empty logo a normal, valid state instead of a validation error.
- Removed two stray `console.log` calls left in `BrandPage.jsx` / `BrandTable.jsx`.

**Backend gaps (not implemented, no backend files touched)**
- The design's "Products" column (a per-brand product count) isn't shown — `GET /brands` doesn't return one, and `brand.service.js` has no aggregate for it. Needs a count join against `product-service`'s products table before this column can show real numbers; showing a placeholder or fabricated count was avoided on purpose.
- The design's "Draft" status (a third state beyond Active/Inactive) isn't real — `Brand.model.js` only has a boolean `is_active`. Either add a real status enum backend-side, or drop "Draft" from the design.
- "Upload logo" in the design implies real file upload; today it's still a logo **URL** text field (no storage/upload endpoint exists in `product-service`). Left as a URL input with a live preview rather than building a fake upload button.
- The design's per-row "⋯" menu was kept as the existing two icon buttons (edit/delete) instead of building a new dropdown-menu component for a single row of actions — same functionality, avoids adding a component this codebase doesn't otherwise use.

### 2026-09-26 — Categories page

**Frontend — done**
- `Categories.jsx` / `CategoryTable.jsx` / `CategoryModal.jsx` — same modal → persistent split-panel change as Brands, plus:
- **Fixed a real bug**: the status filter pills compared `category.status` (a field that doesn't exist on the category object), so "Active"/"Inactive" filtering silently matched nothing. Now compares `category.is_active`, consistent with the table's own status badge.
- Added the design's tree view: `getAllCategories` already returns each category with its nested `children` (see `category.repository.js:29`, unused by the old table). Root categories now render with their children indented underneath with a "└" marker, matching the design. Searching switches to a flat, unindented result list instead (so a matching child surfaces even when its parent name doesn't match) — tree mode and search mode don't try to mix.
- Replaced the "All Status" `<select>` with the design's All/Active/Inactive pill buttons.
- Replaced `Categories.jsx`'s own hand-rolled pagination footer with the existing shared `Pagination` component (already used by `BrandPage.jsx`) — same behavior, one less duplicate implementation.
- Bumped the page size from 5 to 50. Reason below.
- Category rows now show an image avatar (or initials fallback) and the slug in monospace, and the "Active" toggle is the shared `Switch` component, same as Brands.

**Backend gaps (not implemented, no backend files touched)**
- Same as Brands: no per-category "Products" count is available from the API, so that design column is omitted rather than faked.
- Same "Draft" status caveat as Brands — `Category.model.js` only has a boolean `is_active`.
- **Pagination vs. tree structure don't mix well today**: `GET /category` paginates over *all* categories (parents and children combined) rather than paginating by root category. With the old page size of 5, a child could easily land on a different page than its parent, breaking any tree view. Bumping the page size to 50 sidesteps this for realistic catalog sizes, but the real fix is backend-side: either paginate by root category (returning each root with all its children regardless of page size), or return the whole tree unpaginated since category counts are typically small.

## Pending pages (design not yet implemented)

| Artboard | Existing frontend page/route | Status |
|---|---|---|
| Overview | `Dashboard.jsx` (`/dashboard`) | Not started |
| Products | `Products.jsx` | Not started |
| ProductDetail | `ProductDetail.jsx` | Not started |
| ProductTypes | `ProductTypePage.jsx` | Not started |
| Categories | `Categories.jsx` | **Done** (2026-09-26) |
| Brands | `BrandPage.jsx` | **Done** (2026-09-26) |
| Attributes | `ProductAttributePage.jsx` | Not started |
| Variants | `VariantPage.jsx` | Not started |
| Units | `UnitsPage.jsx` | Not started |
| Stock | `Inventory.jsx` / `WarehousePage.jsx` | Not started |
| Movements | `StockMovementPage.jsx` | Not started |
| Reservations | `StockReservationPage.jsx` | Not started |
| Zones | none — no route exists yet | Not started |
| Orders | `Orders.jsx` | Not started |
| OrderDetail | `AdminOrderDetail.jsx` | Not started |
| Customers | `PlaceholderPage.jsx` (stub only) | Not started |
| Promotions | `Promotions.jsx` | Not started |
| PromotionDetail | `PromotionItems.jsx` / `AssignPromotions.jsx` | Not started |
| Settings | `PlaceholderPage.jsx` (stub only) | Not started |

This table is just the queue — the real backend/frontend gap analysis for each page gets written up as a Changelog entry when that page is picked up, not upfront.
