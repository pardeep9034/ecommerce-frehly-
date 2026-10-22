// Run: docker compose exec -T delivery-service node notificationClient.check.js   (needs the service env; calls no real service)
import assert from "node:assert/strict";
import { publishEvent } from "./src/utils/notificationClient.js";
import { env } from "./src/config/env.js";

const realFetch = globalThis.fetch;
const data = { applicationId: "a-1", refNo: 1001, userId: "7", vehicleType: "BIKE", onBehalf: false };

try {
  // the request: URL, headers, envelope and a timeout signal
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return new Response(null, { status: 202 });
  };
  assert.equal(await publishEvent("partner.application.submitted", data), undefined);
  assert.equal(seen.url, `${env.NOTIFICATION_SERVICE_URL}/internal/notifications/events`);
  assert.equal(seen.init.method, "POST");
  assert.equal(seen.init.headers["x-internal-key"], env.INTERNAL_API_KEY);
  assert.equal(seen.init.headers["content-type"], "application/json");
  assert.ok(seen.init.signal instanceof AbortSignal, "3 second timeout signal");
  const body = JSON.parse(seen.init.body);
  assert.deepEqual(Object.keys(body).sort(), ["data", "eventId", "eventType", "occurredAt", "version"]);
  assert.match(body.eventId, /^[0-9a-f-]{36}$/);
  assert.equal(body.eventType, "partner.application.submitted");
  assert.equal(body.version, 1);
  assert.equal(new Date(body.occurredAt).toISOString(), body.occurredAt);
  assert.deepEqual(body.data, data);

  // never throws: a 500, a network error and a timeout all resolve
  globalThis.fetch = async () => new Response("oops", { status: 500 });
  await publishEvent("partner.application.submitted", data);
  globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
  await publishEvent("partner.application.submitted", data);
  globalThis.fetch = async (url, init) => {
    // AbortSignal.timeout() does not keep the process alive (a real socket would), so hold the loop open until it fires.
    const hold = setInterval(() => {}, 1000);
    await new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)))
      .finally(() => clearInterval(hold));
  };
  const started = Date.now();
  await publishEvent("partner.application.submitted", data);
  assert.ok(Date.now() - started < 4500, "gave up after about 3 seconds");
} finally {
  globalThis.fetch = realFetch;
}

console.log("notificationClient.check.js: ok");
