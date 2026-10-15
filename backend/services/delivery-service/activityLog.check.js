// Live check of GET /delivery-partners/applications/events (the Activity log's Onboarding tab).
// Service must be running, dev only. Run: docker compose exec -T delivery-service node activityLog.check.js
// Uses two fake applications (ref numbers 993001-993002, users 993001-993002), seven events and tokens for fake staff
// 993101-993103, and removes every row it makes, before and after. The reference sequence is not touched.
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";
import initializeModels from "./src/models/index.js";

assert.notEqual(env.NODE_ENV, "production", "dev only");

const BASE = `http://localhost:${env.PORT}/delivery-partners/applications/events`;
const USERS = [993001, 993002];

const tokenFor = (userId, role) => jwt.sign({ user_id: userId, phone: `99900${userId}`, role }, env.JWT_SECRET, { expiresIn: "5m" });
const admin = tokenFor(993102, "ADMIN");

const get = async (query = "", token) => {
  const res = await fetch(`${BASE}${query}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const db = await initializeModels();
const sql = async (query, replacements) => (await db.sequelize.query(query, { replacements }))[0];

const cleanup = async () => {
  await sql("DELETE FROM delivery_partner_application_events WHERE application_id IN (SELECT id FROM delivery_partner_applications WHERE user_id IN (:ids))", { ids: USERS });
  await sql("DELETE FROM delivery_partner_applications WHERE user_id IN (:ids)", { ids: USERS });
};

try {
  await cleanup();

  const make = (n, name, vehicle_type, source) =>
    db.PartnerApplication.create({ ref_no: 993000 + n, user_id: USERS[n - 1], name, phone: `99300000${n}0`, vehicle_type, source, status: "NEW" });
  const one = await make(1, "Activity Check One", "BIKE", "ADMIN");
  const two = await make(2, "Activity Check Two", "CYCLE", "SELF");

  // Minutes ago, so the order is fixed. The first event is 3 days old: inside 7 days, outside 24 hours.
  const event = async (app, type, actor_id, actor_role, minutes, payload = null) => {
    const row = await db.PartnerApplicationEvent.create({ application_id: app.id, type, actor_id, actor_role, payload });
    await sql("UPDATE delivery_partner_application_events SET created_at = now() - (:m)::interval WHERE id = :id", { m: `${minutes} minutes`, id: row.id });
  };
  await event(one, "CREATED", 993101, "OPS_STAFF", 3 * 24 * 60, { on_behalf: true });
  await event(one, "DOC_UPLOADED", 993101, "OPS_STAFF", 50, { type: "AADHAAR", on_behalf: true });
  await event(one, "DOC_VIEWED", 993102, "ADMIN", 40, { type: "AADHAAR" });
  await event(one, "SUBMITTED", 993101, "OPS_STAFF", 30, { on_behalf: true, consent_attested: true });
  await event(one, "CHECK_DONE", null, null, 20, { key: "PHONE_OTP", on_behalf: true });
  await event(two, "SUBMITTED", 993002, "DELIVERY_PARTNER", 15);
  await event(two, "APPROVED", 993102, "ADMIN", 5);

  // Who may read it: admins only (a deciding role), not the rest of the staff and not an applicant.
  assert.equal((await get("")).status, 401);
  assert.equal((await get("", tokenFor(993002, "DELIVERY_PARTNER"))).status, 403);
  assert.equal((await get("", tokenFor(993103, "OPS_STAFF"))).status, 403);
  assert.equal((await get("", tokenFor(993103, "SUPER_ADMIN"))).status, 200);
  assert.equal((await get("", admin)).status, 200, "/events is not read as an application id");

  // Bad filters are refused, not ignored.
  assert.equal((await get("?group=bogus", admin)).status, 400);
  assert.equal((await get("?hours=5", admin)).status, 400);
  assert.equal((await get("?limit=500", admin)).status, 400);

  // Default window is 24 hours: six events, newest first, document opens included, each with its application.
  let r = await get("?search=Activity%20Check", admin);
  const order = ["APPROVED", "SUBMITTED", "CHECK_DONE", "SUBMITTED", "DOC_VIEWED", "DOC_UPLOADED"];
  assert.deepEqual(r.body.data.events.map((e) => e.type), order);
  assert.equal(r.body.data.pagination.totalItems, 6);
  assert.deepEqual(r.body.data.events[0].application, { id: two.id, ref: "FR-P-993002", name: "Activity Check Two", vehicle_type: "CYCLE", status: "NEW", source: "SELF" });
  assert.equal(r.body.data.events[0].actor_id, 993102, "BIGINT ids come back as numbers");
  assert.equal(r.body.data.events[2].actor_id, null, "a system event has no actor");
  assert.deepEqual(r.body.data.events[5].payload, { type: "AADHAAR", on_behalf: true });

  // Windows: 7 days adds the old CREATED.
  assert.equal((await get("?search=Activity%20Check&hours=168", admin)).body.data.pagination.totalItems, 7);

  // Search by reference (three spellings), by staff id, and a literal % that matches nothing.
  for (const q of ["FR-P-993002", "P993002", "993002"]) {
    assert.equal((await get(`?search=${q}`, admin)).body.data.pagination.totalItems, 2, q);
  }
  assert.equal((await get("?search=993102", admin)).body.data.pagination.totalItems, 2, "staff id 993102 acted twice");
  assert.equal((await get("?search=%25", admin)).body.data.pagination.totalItems, 0);

  // Groups.
  const inGroup = async (g) => (await get(`?search=Activity%20Check&group=${g}`, admin)).body.data.events.map((e) => e.type);
  assert.deepEqual(await inGroup("docs"), ["DOC_VIEWED", "DOC_UPLOADED"]);
  assert.deepEqual(await inGroup("decisions"), ["APPROVED"]);
  assert.deepEqual(await inGroup("checks"), ["CHECK_DONE"]);
  assert.deepEqual(await inGroup("flow"), ["SUBMITTED", "SUBMITTED"]);

  // Paging: 4 per page over 6 events.
  r = await get("?search=Activity%20Check&limit=4&page=2", admin);
  assert.deepEqual(r.body.data.events.map((e) => e.type), ["DOC_VIEWED", "DOC_UPLOADED"]);
  assert.equal(r.body.data.pagination.hasNextPage, false);
  assert.equal(r.body.data.pagination.hasPrevPage, true);

  // Whole-table figures.
  const { meta } = (await get("", admin)).body.data;
  assert.ok(meta.total >= 7 && meta.latest_at, JSON.stringify(meta));

  console.log("activityLog.check: all assertions passed");
} finally {
  await cleanup();
  await db.sequelize.close();
}
