// Run: node signupRole.check.js   (no database, no running service)
// Sends bodies through the real validate("signUp") middleware: only CUSTOMER and DELIVERY_PARTNER may be asked for.
import assert from "node:assert/strict";
import { validate } from "./src/middleware/validation.js";

const run = (body) => {
  const out = { passed: false, status: null };
  const res = { status(code) { out.status = code; return this; }, json() { return this; } };
  validate("signUp")({ body }, res, () => { out.passed = true; });
  return out;
};

const phone = "9876543210";
for (const body of [{ phone }, { phone, role: "CUSTOMER" }, { phone, role: "DELIVERY_PARTNER" }]) {
  assert.ok(run(body).passed, `should pass: ${JSON.stringify(body)}`);
}
for (const role of ["SUPER_ADMIN", "ADMIN", "OPS_STAFF", "customer", ""]) {
  const r = run({ phone, role });
  assert.ok(!r.passed && r.status === 400, `should be 400: role=${JSON.stringify(role)}`);
}
console.log("signupRole.check.js: ok");
