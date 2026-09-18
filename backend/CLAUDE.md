# Backend conventions

This is a Node.js/Express microservices backend (`backend/services/<name>-service`). Every service with real business logic (`auth`, `user`, `cart`, `product`, `inventory`, `order`, `delivery`) follows the same layering and naming rules below. `config-service`, `api-gateway`, `notification-service`, `payment-service` are gateway/stub services and don't have this layering.

## Layering

`controller → service (.service.js) → repository (X.repository.js) → model (X.model.js)`

- Controllers parse the request, call the service, and respond via `ResponseUtil` — no business logic in controllers.
- Services hold business logic, throw `AppError` on failure, and are the only layer allowed to open a `sequelize.transaction`.
- Repositories are centralized per service under `src/modules/repository/`, not colocated with each module. Each repository is a thin data-access wrapper around one model, usually extending a shared `baseRepository.js`/`BaseRepository.js`.
- Models live in `src/models/`, one file per entity, with associations centralized in `src/models/index.js`.

## File naming

| Layer | Location | Pattern | Example |
|---|---|---|---|
| Module folder | `src/modules/<feature>/` | camelCase by feature | `productType/`, `measurementUnit/` |
| Controller | `src/modules/<feature>/` | `<feature>.controller.js` | `category.controller.js` |
| Routes | `src/modules/<feature>/` | `<feature>.routes.js` | `category.routes.js` |
| Service | `src/modules/<feature>/` | `<feature>.service.js` (singular — never `.services.js`) | `category.service.js` |
| Repository | `src/modules/repository/` | `<entity>.repository.js` | `product.repository.js` |
| Model | `src/models/` | PascalCase + `.model.js` | `Product.model.js`, `OrderItem.model.js` |
| Model associations | `src/models/index.js` | one `initializeModels()` that builds `db`, then `Object.keys(db).forEach(m => db[m].associate?.(db))` | — |

When adding a new module, match the existing sibling modules in that service exactly (e.g. new product-service modules should look like `productAttribute/`, not invent a new pattern).

## Errors

`throw new AppError(message, statusCode)` everywhere business logic can fail — never a bare `throw new Error(...)` and never an ad hoc `res.status(x).json(...)` written inline in a controller. Each service has its own `src/utils/AppError.js` (`constructor(message, statusCode)`); there's no shared package yet, so if you touch a service missing one (`user-service`, `config-service`, `api-gateway`), add one matching the existing signature instead of inventing a new shape. The global error handler in each service's `app.js` must check `error.isOperational` (or `instanceof AppError`) before falling back to a generic 500 — a handler that skips this check silently turns every `AppError` into a 500.

## Responses

- Success: `{ success: true, message, data }`
- Error / validation failure: `{ success: false, message, errors }`

Always return these via the service's `ResponseUtil` (`src/utils/response.js`), never build the object literal inline in a controller. Don't return `{success:false, ...}` objects from the *service* layer and expect the controller to translate them — throw `AppError` instead, so the status code is preserved.

## Validation

Joi schemas in `src/middleware/validate.js` (or `validation.js`). On failure, respond with the full validation error array, not just the first message:

```js
const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
return ResponseUtil.validationError(res, errors); // { success:false, message, errors: [{field, message}] }
```

## Auth

JWT is verified **locally** in each service (`jwt.verify` in `src/utils/verifyToken.js` / `src/middleware/auth.js`) — never call auth-service over the network to check a token. `req.user` must be set to the **full decoded JWT payload**, not a sub-property (`decoded.user`) and not a bare id (`decoded.user_id`). Role checks inside `authenticateToken` must use `&&`/array membership correctly — `role === "ADMIN" || "SUPER_ADMIN"` is a bug (always truthy), not a valid multi-role check; use `["ADMIN","SUPER_ADMIN"].includes(role)`.

## Roles

Role checks must reference a shared Roles/constants module — never inline string literals like `"admin"` scattered across middleware and services. If no such module exists yet in the service you're touching, that's a known gap; don't add another inline literal, factor the roles you need into a small constants file instead. Any route that should be role-gated must actually call `requireRole([...])` — a `requireRole` middleware that's defined but never wired into a route enforces nothing.

## Transactions

Wrap any multi-step write (create with child records, a status transition that touches more than one table) in `await sequelize.transaction(async (transaction) => { ... })`, passing `{ transaction }` to every call inside it. Don't forget the `await` on `sequelize.transaction(...)` — without it you get a Promise, not a transaction. `order-service`'s `createOrder`/`cancelOrder` flows are the reference example to copy.

## Logging

Use a structured logger (winston) — check for `src/utils/Logger.js` in the service first; only `auth-service` and `cart-service` currently have one, and cart-service's is unused, so wire it up rather than reaching for `console.log`. Never `console.log`/`console.error` in a request-handling path, and never log:
- the request body (`req.body`) — has held passwords and full cart contents in this codebase before
- a raw or decoded JWT token
- `DATABASE_URL` or any other credential/connection string

## Known gaps (don't copy these patterns into new code)

The conventions above are the target; several services haven't fully caught up. When touching a file that violates one of these, fix it if it's in scope — but don't let existing violations set the pattern for new code:
- Several services' global error handlers don't check `error.isOperational`, so real `AppError` status codes come back as 500.
- `req.user` shape is inconsistent across services (only `order-service` sets it to the full JWT payload).
- No shared `Roles` constants module exists yet anywhere in the repo.
- `user-service` currently has no auth middleware at all.
