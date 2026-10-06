import { test } from "node:test";
import assert from "node:assert/strict";
import validateGroup, { schemas } from "../src/middleware/validate.js";

// PATCH /config/:group relies on two behaviours of these schemas: a patch is
// validated WITHOUT defaults (so saving one field can't reset the others),
// and reads fill defaults for anything never saved.

const run = (group, body) => {
  let result = {};
  const res = { status: (code) => ({ json: (payload) => (result = { code, payload }) }) };
  validateGroup({ params: { group }, body }, res, (err) => (result = { err }));
  return result;
};

test("defaults fill every field when nothing is stored", () => {
  assert.deepEqual(schemas.orderRules.validate({}).value, {
    paymentWindow: 15,
    replyWindow: 15,
    riderAcceptWindow: 5,
    cancelWhilePicking: true,
    cancelWhilePacking: false,
    autoRefundMissing: true
  });
});

test("a partial patch keeps only the fields sent and coerces strings", () => {
  const req = { params: { group: "orderRules" }, body: { paymentWindow: "20" } };
  validateGroup(req, {}, () => {});
  assert.deepEqual(req.body, { paymentWindow: 20 });
});

test("rejects unknown keys, bad values and an empty patch with every error listed", () => {
  const { code, payload } = run("general", { slotLength: 0, gstin: "nope", extra: 1 });
  assert.equal(code, 400);
  assert.deepEqual(payload.errors.map((e) => e.field).sort(), ["extra", "gstin", "slotLength"]);

  assert.equal(run("general", {}).code, 400);
  assert.equal(run("general", undefined).code, 400);
});

test("accepts a valid GSTIN in lower case and an empty one", () => {
  const req = { params: { group: "general" }, body: { gstin: "22aaaaa0000a1z5" } };
  validateGroup(req, {}, () => {});
  assert.equal(req.body.gstin, "22AAAAA0000A1Z5");

  assert.equal(schemas.general.validate({ gstin: "" }).error, undefined);
});

test("unknown group is a 404 AppError", () => {
  const { err } = run("nope", { a: 1 });
  assert.equal(err.statusCode, 404);
  assert.equal(err.isOperational, true);
});
