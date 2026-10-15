// Run: docker compose exec -T auth-service node auditLog.check.js
// Live check of GET /auth/admin/audit-logs (the Activity log's Security tab). Service must be running, dev only.
// Uses throwaway users with phones 60000000(41-43) and their audit rows, and deletes them before and after.
import assert from "node:assert/strict";
import initializeModels from "./src/models/index.js";
import TokenService from "./src/modules/token/token.service.js";
import { GROUPS } from "./src/modules/auditLog/auditLog.service.js";

assert.notEqual(process.env.NODE_ENV, "production", "dev only");

const BASE = `http://localhost:${process.env.PORT || 3001}/auth/admin/audit-logs`;
const ADMIN = "6000000041";
const CUSTOMER = "6000000042";
const SUBJECT = "6000000043"; // the account the audit rows are about
const PHONES = [ADMIN, CUSTOMER, SUBJECT];

const db = await initializeModels();
const sql = async (query, replacements) => (await db.sequelize.query(query, { replacements }))[0];

const cleanup = async () => {
  await sql("delete from auth_audit_logs where phone in (:phones) or user_id in (select id from auth_users where phone in (:phones))", { phones: PHONES });
  await sql("delete from auth_users where phone in (:phones)", { phones: PHONES });
};

const get = async (query = "", token) => {
  const res = await fetch(`${BASE}${query}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

try {
  await cleanup();

  const make = (phone, role) => db.AuthUser.create({ phone, role, first_name: "Audit Check", is_active: true, phone_verified: true, profile_complete: true });
  const [admin, customer, subject] = [await make(ADMIN, "ADMIN"), await make(CUSTOMER, "CUSTOMER"), await make(SUBJECT, "CUSTOMER")];
  const adminToken = TokenService.generateAccessToken({ user_id: admin.id, phone: ADMIN, role: "ADMIN" });
  const customerToken = TokenService.generateAccessToken({ user_id: customer.id, phone: CUSTOMER, role: "CUSTOMER" });

  // Rows about SUBJECT, newest first: two failures (one with an IP), a sign-in, an admin block (user id only, no phone),
  // one 3 days old (inside 7 days, outside 24 hours) and one 40 days old (outside every window).
  const insert = (type, status, ago, extra = {}) =>
    sql(
      `insert into auth_audit_logs (user_id, event_type, status, phone, ip_address, error_message, created_at)
       values (:uid, :type, :status, :phone, :ip, :err, now() - (:ago)::interval)`,
      { uid: subject.id, type, status, phone: extra.phone ?? null, ip: extra.ip ?? null, err: extra.err ?? null, ago }
    );
  await insert("LOGIN_FAILURE", "FAILURE", "1 minute", { phone: SUBJECT, err: "Invalid password" });
  await insert("LOGIN_FAILURE", "FAILURE", "2 minutes", { phone: SUBJECT, err: "Invalid password", ip: "203.0.113.7" });
  await insert("LOGIN_SUCCESS", "SUCCESS", "3 minutes", { phone: SUBJECT });
  await insert("ACCOUNT_LOCKED", "SUCCESS", "4 minutes");
  await insert("LOGIN_SUCCESS", "SUCCESS", "3 days", { phone: SUBJECT });
  await insert("LOGIN_SUCCESS", "SUCCESS", "40 days", { phone: SUBJECT });

  // Who may read it: admins only.
  assert.equal((await get("")).status, 401);
  assert.equal((await get("", customerToken)).status, 403);
  assert.equal((await get("", adminToken)).status, 200);

  // Bad filters are refused, not ignored.
  assert.equal((await get("?group=bogus", adminToken)).status, 400);
  assert.equal((await get("?hours=5", adminToken)).status, 400);

  // The default window is 24 hours: 4 rows, newest first. Searching the account's phone also finds the block row, which has none.
  let r = await get(`?search=${SUBJECT}`, adminToken);
  assert.deepEqual(r.body.data.events.map((e) => e.event_type), ["LOGIN_FAILURE", "LOGIN_FAILURE", "LOGIN_SUCCESS", "ACCOUNT_LOCKED"]);
  assert.equal(r.body.data.events[3].phone, SUBJECT, "the block row falls back to the account's phone");
  assert.equal(r.body.data.events[0].user_id, Number(subject.id));
  assert.equal(r.body.data.pagination.totalItems, 4);

  // A search by user id, by IP, and a literal % that matches nothing.
  assert.equal((await get(`?search=${subject.id}`, adminToken)).body.data.pagination.totalItems >= 4, true);
  assert.equal((await get("?search=203.0.113", adminToken)).body.data.pagination.totalItems, 1);
  assert.equal((await get("?search=%25", adminToken)).body.data.pagination.totalItems, 0);

  // Groups and windows.
  assert.equal((await get(`?search=${SUBJECT}&group=failed`, adminToken)).body.data.pagination.totalItems, 2);
  assert.equal((await get(`?search=${SUBJECT}&group=lock`, adminToken)).body.data.pagination.totalItems, 1);
  assert.equal((await get(`?search=${SUBJECT}&group=password`, adminToken)).body.data.pagination.totalItems, 0);
  assert.equal((await get(`?search=${SUBJECT}&hours=168`, adminToken)).body.data.pagination.totalItems, 5);
  assert.equal((await get(`?search=${SUBJECT}&hours=720`, adminToken)).body.data.pagination.totalItems, 5);

  // Paging: 2 per page over 4 rows.
  r = await get(`?search=${SUBJECT}&limit=2&page=2`, adminToken);
  assert.deepEqual(r.body.data.events.map((e) => e.event_type), ["LOGIN_SUCCESS", "ACCOUNT_LOCKED"]);
  assert.equal(r.body.data.pagination.hasNextPage, false);
  assert.equal(r.body.data.pagination.hasPrevPage, true);

  // Whole-table counts cover everything, windows aside.
  const { meta } = (await get("", adminToken)).body.data;
  assert.ok(meta.total >= 6 && meta.with_ip >= 1 && meta.with_ip < meta.total, JSON.stringify(meta));

  // Every group names real enum values, so a typo in GROUPS cannot hide events.
  const known = (await sql("select unnest(enum_range(null::enum_auth_audit_logs_event_type))::text as v")).map((row) => row.v);
  for (const [name, types] of Object.entries(GROUPS)) for (const t of types) assert.ok(known.includes(t), `${name}: ${t} is not an event type`);

  console.log("auditLog.check: all assertions passed");
} finally {
  await cleanup();
  await db.sequelize.close();
}
