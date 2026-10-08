// Auth check. Service must be running. Run: docker compose exec -T delivery-service node auth.check.js
// Finds every route that has authenticateToken and asserts the second door (staff only) is closed to other roles.
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import { authenticateToken } from "./src/middleware/auth.js";
import { ROLES, STAFF_ROLES } from "./src/constants/roles.js";
import deliveryRoutes from "./src/modules/delivery/delivery.routes.js";
import deliveryPartnerRoutes from "./src/modules/deliveryPartner/deliveryPartner.routes.js";
import deliveryZoneRoutes from "./src/modules/deliveryZone/deliveryZone.routes.js";
import deliveryPartnerZoneRoutes from "./src/modules/deliveryPartnerZone/deliveryPartnerZone.routes.js";
import handleOrderRoutes from "./src/modules/handleOrder/handleOrder.routes.js";

assert.notEqual(env.NODE_ENV, "production", "dev only: staff probes hit real controllers with a fake id");

// Same prefixes as app.js
const mounts = [
  ["/deliveries", deliveryRoutes],
  ["/delivery-partners", deliveryPartnerRoutes],
  ["/delivery-zones", deliveryZoneRoutes],
  ["/delivery-partner-zones", deliveryPartnerZoneRoutes],
  ["/handle-orders", handleOrderRoutes],
];

const protectedRoutes = mounts.flatMap(([prefix, router]) =>
  router.stack
    .filter((l) => l.route?.stack.some((s) => s.handle === authenticateToken))
    .flatMap((l) =>
      Object.keys(l.route.methods).map((method) => ({
        method: method.toUpperCase(),
        url: `http://localhost:${env.PORT}${prefix}${l.route.path.replace(/:\w+/g, "999999")}`,
      }))
    )
);
assert(protectedRoutes.length > 0, "found no protected routes");

const sign = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: "5m" });
const status = async ({ method, url }, token) =>
  (await fetch(url, {
    method,
    headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) },
    body: method === "GET" ? undefined : "{}",
  })).status;

for (const route of protectedRoutes) {
  const at = `${route.method} ${route.url}`;
  assert.equal(await status(route), 401, `${at}: no token`);
  assert.equal(await status(route, "not-a-jwt"), 401, `${at}: bad token`);
  assert.equal(await status(route, sign({ user_id: 1 })), 401, `${at}: token without role`);
  for (const role of [ROLES.CUSTOMER, ROLES.DELIVERY_PARTNER]) {
    assert.equal(await status(route, sign({ user_id: 1, role })), 403, `${at}: ${role} must be blocked`);
  }
  for (const role of STAFF_ROLES) {
    const s = await status(route, sign({ user_id: 1, role }));
    assert(![401, 403].includes(s), `${at}: ${role} must pass auth, got ${s}`);
  }
}

console.log(`auth check passed: ${protectedRoutes.length} protected routes x 7 probes`);
process.exit(0);
