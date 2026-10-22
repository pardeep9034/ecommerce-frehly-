// Run: node contacts.check.js   (no database, no running service; needs the usual auth-service .env)
// 1. Sends bodies through the real validate("internalUserContacts") middleware.
// 2. Starts the real app on a free port: /internal/* must skip the IP limiter, /health must still hit it.
import assert from "node:assert/strict";
import { validate } from "./src/middleware/validation.js";

const run = (body) => {
  const out = { passed: false, status: null };
  const res = { status(code) { out.status = code; return this; }, json() { return this; } };
  validate("internalUserContacts")({ body }, res, () => { out.passed = true; });
  return out;
};
const ok = (body) => assert.ok(run(body).passed, `should pass: ${JSON.stringify(body)}`);
const bad = (body, why) => { const r = run(body); assert.ok(!r.passed && r.status === 400, why); };

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

ok({ ids: [1] });
ok({ ids: range(50) });
ok({ roles: ["OPS_STAFF"] });
ok({ roles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN", "OPS_STAFF", "DELIVERY_PARTNER"] });

bad({}, "one of ids / roles is required");
bad({ ids: [1], roles: ["ADMIN"] }, "ids and roles together");
bad({ ids: [] }, "ids: at least 1");
bad({ ids: range(51) }, "ids: at most 50");
bad({ ids: [1, 1] }, "ids: unique");
bad({ ids: [0] }, "ids: positive");
bad({ ids: [1.5] }, "ids: integer");
bad({ roles: [] }, "roles: at least 1");
bad({ roles: ["ADMIN", "ADMIN", "ADMIN", "ADMIN", "ADMIN", "ADMIN"] }, "roles: at most 5");
bad({ roles: ["MANAGER"] }, "unknown role");
bad({ roles: ["admin"] }, "roles are case-sensitive");
bad({ ids: [1], extra: true }, "unknown field");

// Limiter: 100 per IP per 15 min. Without a key /internal answers 401 before any DB call.
const { env } = await import("./src/config/env.js");
env.INTERNAL_API_KEY = "k".repeat(40); // so the guard answers 401, not 503
const { default: app } = await import("./src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
const post = () => fetch(`${base}/internal/users/contacts`, { method: "POST", headers: { "content-type": "application/json" }, body: '{"ids":[1]}' });

for (let i = 0; i < 120; i++) assert.equal((await post()).status, 401, `internal call ${i + 1} must not be limited`);
for (let i = 0; i < 100; i++) assert.equal((await fetch(`${base}/health`)).status, 200, `health call ${i + 1}`);
assert.equal((await fetch(`${base}/health`)).status, 429, "101st non-internal call is limited");
assert.equal((await post()).status, 401, "internal still open once the IP is limited");
server.close();

console.log("contacts.check.js: ok");
process.exit(0);
