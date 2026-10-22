import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { getOrderRules, resetOrderRules } from "../src/utils/orderRules.js";

// The payment window comes from config-service. These pin the three things orders rely on:
// the saved value is used, it is cached (no HTTP call per order), and an outage keeps orders working at 15 min.

const realFetch = globalThis.fetch;
let calls;
const answer = (status, body) => {
  globalThis.fetch = async (url, options) => {
    calls.push({ url, key: options.headers["x-internal-key"] });
    return new Response(JSON.stringify(body), { status });
  };
};

beforeEach(() => { calls = []; resetOrderRules(); });
after(() => { globalThis.fetch = realFetch; });

test("uses the saved payment window and caches it", async () => {
  answer(200, { success: true, data: { paymentWindow: 30, replyWindow: 15 } });
  assert.equal((await getOrderRules()).paymentWindow, 30);
  assert.equal((await getOrderRules()).paymentWindow, 30);
  assert.equal(calls.length, 1, "second read comes from the cache");
  assert.match(calls[0].url, /\/config\/internal\/orderRules$/);
});

test("falls back to 15 minutes when config-service fails", async () => {
  answer(401, { success: false, message: "Invalid internal key" });
  assert.equal((await getOrderRules()).paymentWindow, 15);

  resetOrderRules();
  globalThis.fetch = async () => { throw new Error("connect ECONNREFUSED"); };
  assert.equal((await getOrderRules()).paymentWindow, 15);
});
