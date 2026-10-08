// Run: node internalKey.check.js   (no database, no running service; needs the usual auth-service .env)
// Sends requests through the real requireInternalKey and validate("internalPartner") middleware.
import assert from "node:assert/strict";
import { env } from "./src/config/env.js";
import requireInternalKey from "./src/middleware/internalKey.js";
import { validate } from "./src/middleware/validation.js";

const KEY = "k".repeat(40);

const callKey = (header) => {
  let err; // what next() received: undefined = let through
  requireInternalKey({ headers: header === undefined ? {} : { "x-internal-key": header } }, {}, (e) => { err = e; });
  return err?.statusCode ?? 200;
};

env.INTERNAL_API_KEY = undefined;
assert.equal(callKey(KEY), 503, "key not configured must fail closed");

env.INTERNAL_API_KEY = KEY;
assert.equal(callKey(undefined), 401, "missing header");
assert.equal(callKey(""), 401, "empty header");
assert.equal(callKey("wrong"), 401, "wrong key (different length)");
assert.equal(callKey("x".repeat(40)), 401, "wrong key (same length)");
assert.equal(callKey(KEY), 200, "right key passes");

const body = (b) => {
  let passed = false;
  validate("internalPartner")({ body: b }, { status() { return this; }, json() { return this; } }, () => { passed = true; });
  return passed;
};
assert.ok(body({ phone: "9876543210", name: "Ravi Kumar" }));
assert.ok(!body({ phone: "9876543210" }), "name required");
assert.ok(!body({ name: "Ravi Kumar" }), "phone required");
assert.ok(!body({ phone: "98765", name: "Ravi Kumar" }), "phone must be 10 digits");
assert.ok(!body({ phone: "9876543210", name: " " }), "blank name");

console.log("internalKey.check.js: ok");
