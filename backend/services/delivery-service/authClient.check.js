// Run: docker compose exec -T delivery-service node authClient.check.js   (needs the service env; calls no real service)
import assert from "node:assert/strict";
import { findOrCreatePartnerUser } from "./src/utils/authClient.js";
import { env } from "./src/config/env.js";

const realFetch = globalThis.fetch;
const reply = (status, body) => async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const call = () => findOrCreatePartnerUser({ phone: "9876500000", name: "Test Person" });
const fails = async (status) => assert.rejects(call, (e) => e.statusCode === status && e.isOperational, `expected AppError ${status}`);

try {
  // the request: URL, key header, body and a timeout signal
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return reply(200, { success: true, data: { user_id: "u-1", registered: true } })();
  };
  assert.deepEqual(await call(), { userId: "u-1", registered: true });
  assert.equal(seen.url, `${env.AUTH_SERVICE_URL}/internal/partners`);
  assert.equal(seen.init.method, "POST");
  assert.equal(seen.init.headers["x-internal-key"], env.INTERNAL_API_KEY);
  assert.deepEqual(JSON.parse(seen.init.body), { phone: "9876500000", name: "Test Person" });
  assert.ok(seen.init.signal instanceof AbortSignal, "5 second timeout signal");

  // registered is only true when auth says so
  globalThis.fetch = reply(200, { data: { user_id: "u-2", registered: false } });
  assert.deepEqual(await call(), { userId: "u-2", registered: false });
  globalThis.fetch = reply(200, { data: { user_id: "u-3" } });
  assert.equal((await call()).registered, false, "a missing flag is not registered");

  // 409 keeps auth's wording; the number belongs to someone else
  globalThis.fetch = reply(409, { message: "This number is already registered for a different account type." });
  await assert.rejects(call, (e) => e.statusCode === 409 && /different account type/.test(e.message));

  // everything else is 502 with a fixed message, and auth's text never reaches the client
  globalThis.fetch = reply(401, { message: "Invalid internal key" });
  await assert.rejects(call, (e) => e.statusCode === 502 && !/internal key/i.test(e.message));
  globalThis.fetch = reply(503, { message: "Internal API is not configured" });
  await fails(502);
  globalThis.fetch = reply(500, {});
  await fails(502);
  globalThis.fetch = async () => new Response("<html>bad gateway</html>", { status: 200 });
  await fails(502); // 200 but not JSON
  globalThis.fetch = reply(200, { data: {} });
  await fails(502); // 200 without a user id
  globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
  await fails(502); // network error
  globalThis.fetch = async (url, init) => {
    // AbortSignal.timeout() does not keep the process alive (a real socket would), so hold the loop open until it fires.
    const hold = setInterval(() => {}, 1000);
    await new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)))
      .finally(() => clearInterval(hold));
  };
  const started = Date.now();
  await fails(502); // timeout
  assert.ok(Date.now() - started < 7000, "gave up after about 5 seconds");
} finally {
  globalThis.fetch = realFetch;
}

console.log("authClient.check.js: ok");
