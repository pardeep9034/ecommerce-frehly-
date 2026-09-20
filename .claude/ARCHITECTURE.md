# Architecture

Monorepo: `backend/` (Node/Express microservices, Sequelize/Postgres, RabbitMQ) + `client/` (React/Vite).
Conventions: [backend/CLAUDE.md](../backend/CLAUDE.md) (backend) · [.claude/.CLAUDE.md](.CLAUDE.md) (frontend).

## Services — `backend/services/<name>`

| Service | Port | Role |
|---|---|---|
| api-gateway | 4000 | routes client traffic to services |
| auth-service | 3001 | login/register, JWT issue+refresh, roles (issues only, no enforcement) |
| user-service | 3000 | user profiles, addresses |
| product-service | 3002 | catalog: products, variants, brands, categories, promotions |
| inventory-service | 3003 | stock, warehouses, reservations, movements |
| config-service | 3003 | shared config (port conflicts with inventory-service) |
| order-service | 3004 | orders, payments, order status |
| cart-service | 3005 | cart + cart items |
| delivery-service | 3006 | delivery partners, zones, handover/assignment |
| notification-service | — | stub, no code yet |
| payment-service | — | stub, no code yet |

Each real service (all but api-gateway/config-service/notification/payment) follows:
`controller → service → repository → model`, one Express app per service, own DB connection.
Layout: `src/{models,modules/<feature>/{*.controller,*.routes,*.service}.js,modules/repository,middleware,utils}`.

## Client — `client/src`

| Dir | Purpose |
|---|---|
| `pages/freshly` | public storefront pages |
| `pages/dashboard` | admin dashboard pages |
| `components/freshly` | storefront components |
| `components/dashboard` | admin components |
| `components/common` | shared across both |
| `hooks` | `use-<resource>.js`, react-query per API resource |
| `apis` | axios calls per resource |
| `redux` | client-only global state (not server data) |
| `lib` | cross-cutting helpers (e.g. `notify.js`) |

Routing split: `/` storefront (freshly), `/dashboard` admin — mirrors the component/page split above.
