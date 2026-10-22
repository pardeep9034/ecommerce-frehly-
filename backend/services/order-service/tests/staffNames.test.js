import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { getStaffName, resetStaffNames } from "../src/utils/staffNames.js";

// The admin order page shows who picked an order. The name lives in auth-service, so these pin what orders rely on:
// the right user's name comes back, it is cached (no HTTP call per page view), and an outage gives null, never an error.

const realFetch = globalThis.fetch;
let calls;
const answer = (status, body) => {
  globalThis.fetch = async (url, options) => {
    calls.push({ url, key: options.headers["x-internal-key"], body: JSON.parse(options.body) });
    return new Response(JSON.stringify(body), { status });
  };
};

beforeEach(() => { calls = []; resetStaffNames(); });
after(() => { globalThis.fetch = realFetch; });

test("returns the staff member's name and caches it", async () => {
  answer(200, { success: true, data: [{ id: 7, name: "Asha Rao" }] });
  assert.equal(await getStaffName("7"), "Asha Rao");
  assert.equal(await getStaffName("7"), "Asha Rao");
  assert.equal(calls.length, 1, "second read comes from the cache");
  assert.match(calls[0].url, /\/internal\/users\/names$/);
  assert.deepEqual(calls[0].body, { ids: [7] });
});

test("null when the account is not staff or has no name", async () => {
  answer(200, { success: true, data: [] });
  assert.equal(await getStaffName(9), null);

  resetStaffNames();
  answer(200, { success: true, data: [{ id: 9, name: null }] });
  assert.equal(await getStaffName(9), null);
});

test("null, not an error, when auth-service fails — and the next call tries again", async () => {
  answer(401, { success: false, message: "Invalid internal key" });
  assert.equal(await getStaffName(7), null);

  globalThis.fetch = async () => { throw new Error("connect ECONNREFUSED"); };
  assert.equal(await getStaffName(7), null);

  answer(200, { success: true, data: [{ id: 7, name: "Asha Rao" }] });
  assert.equal(await getStaffName(7), "Asha Rao", "a failure is not cached");
});
