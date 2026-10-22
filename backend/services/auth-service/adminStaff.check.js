// Run: docker compose exec -T auth-service node adminStaff.check.js
// Checks the staff routes of /auth/admin/users (get, create, update, status, reset-password, resend-invite) on the real
// adminUser router in a throwaway server, so the running service is not touched. Dev only.
// Uses throwaway users with phones 60000000(51-58) and deletes them (and their audit rows and tokens) before and after.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import express from "express";
import initializeModels from "./src/models/index.js";
import TokenService from "./src/modules/token/token.service.js";
import adminUserRoutes from "./src/modules/adminUser/adminUser.routes.js";

assert.notEqual(process.env.NODE_ENV, "production", "dev only");

const [SUPER, ADMIN, OPS, CUSTOMER, GONE, NEW_OPS, LINKED, FINAL] =
  ["6000000051", "6000000052", "6000000053", "6000000054", "6000000055", "6000000056", "6000000057", "6000000058"];
const PHONES = [SUPER, ADMIN, OPS, CUSTOMER, GONE, NEW_OPS, LINKED, FINAL];

const db = await initializeModels();
const sql = async (query, replacements) => (await db.sequelize.query(query, { replacements }))[0];
const cleanup = async () => {
  const mine = "select id from auth_users where phone in (:phones)";
  await sql(`delete from auth_audit_logs where user_id in (${mine})`, { phones: PHONES });
  await sql(`delete from auth_refresh_tokens where user_id in (${mine})`, { phones: PHONES });
  await sql("delete from auth_users where phone in (:phones)", { phones: PHONES });
};

const app = express();
app.use(express.json());
app.use("/auth/admin/users", adminUserRoutes);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
const BASE = `http://127.0.0.1:${server.address().port}/auth/admin/users`;

const call = async (method, path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};
const row = (phone) => db.AuthUser.findOne({ where: { phone } });
const count = async (query, replacements) => (await sql(query, replacements))[0].n;
const audits = (userId, type) => count("select count(*)::int as n from auth_audit_logs where user_id = :userId and event_type = :type", { userId, type });
const openTokens = (userId) => count("select count(*)::int as n from auth_refresh_tokens where user_id = :userId and is_revoked = false", { userId });
const addToken = (userId) => db.AuthRefreshToken.create({ user_id: userId, token_hash: crypto.randomBytes(16).toString("hex"), family_id: crypto.randomUUID(), expires_at: new Date(Date.now() + 3600e3) });

try {
  await cleanup();

  const make = (phone, role, extra = {}) =>
    db.AuthUser.create({ phone, role, first_name: "Staff", last_name: "Check", is_active: true, phone_verified: true, profile_complete: true, ...extra });
  const [superAdmin, admin, ops, customer, gone] = [
    await make(SUPER, "SUPER_ADMIN"),
    await make(ADMIN, "ADMIN"),
    await make(OPS, "OPS_STAFF", { email: "staff.check@example.test", warehouse_id: 7 }),
    await make(CUSTOMER, "CUSTOMER"),
    await make(GONE, "OPS_STAFF", { deleted_at: new Date() }),
  ];
  const tokenFor = (user) => TokenService.generateAccessToken({ user_id: user.id, phone: user.phone, role: user.role });
  const [superToken, adminToken, customerToken] = [tokenFor(superAdmin), tokenFor(admin), tokenFor(customer)];

  // ---- GET /:id
  assert.equal((await call("GET", `/${ops.id}`)).status, 401, "no token");
  assert.equal((await call("GET", `/${ops.id}`, adminToken)).status, 403, "store admins cannot read staff");
  assert.equal((await call("GET", `/${ops.id}`, customerToken)).status, 403, "customers cannot");
  const found = await call("GET", `/${ops.id}`, superToken);
  assert.equal(found.status, 200);
  assert.deepEqual(
    { id: found.body.data.id, role: found.body.data.role, warehouse_id: found.body.data.warehouse_id, email: found.body.data.email, must_change_password: found.body.data.must_change_password, invite_pending: found.body.data.invite_pending },
    { id: Number(ops.id), role: "OPS_STAFF", warehouse_id: 7, email: "staff.check@example.test", must_change_password: false, invite_pending: false }
  );
  for (const secret of ["password_hash", "refresh_token", "google_id"]) assert.ok(!(secret in found.body.data), `${secret} must not leak`);
  assert.equal((await call("GET", `/${superAdmin.id}`, superToken)).body.data.warehouse_id, null, "unassigned is null");
  for (const id of [customer.id, gone.id, "999999999"]) assert.equal((await call("GET", `/${id}`, superToken)).status, 404, `404 for ${id}`);
  for (const id of ["abc", "-5"]) assert.equal((await call("GET", `/${id}`, superToken)).status, 400, `400 for ${id}`);

  // ---- GET /staff (list) and GET / (customers stay customers)
  const list = async (query, token = superToken) => {
    const res = await call("GET", `/staff?search=Staff%20Check&${query}`, token);
    return { ...res, phones: res.body.data?.users.map((u) => u.phone).sort() };
  };
  assert.equal((await call("GET", "/staff")).status, 401);
  assert.equal((await list("", adminToken)).status, 403, "store admins cannot list staff");
  const everyone = await list("role=&status=&warehouse_id=");
  assert.equal(everyone.status, 200, "empty filters are ignored");
  assert.deepEqual(everyone.phones, [SUPER, ADMIN, OPS], "staff only: no customer, no deleted user");
  assert.ok(!JSON.stringify(everyone.body).includes("password_hash"));
  assert.deepEqual((await list("role=OPS_STAFF")).phones, [OPS]);
  assert.deepEqual((await list("warehouse_id=none")).phones, [SUPER, ADMIN]);
  assert.deepEqual((await list("warehouse_id=7")).phones, [OPS]);
  await db.AuthUser.update({ account_locked_until: new Date(Date.now() + 3600e3) }, { where: { phone: OPS } });
  const locked = await list("status=LOCKED");
  assert.deepEqual(locked.phones, [OPS]);
  assert.ok(locked.body.data.summary.locked >= 1 && locked.body.data.summary.total >= 3, "summary counts all staff");
  await db.AuthUser.update({ account_locked_until: null }, { where: { phone: OPS } });
  const paged = await list("limit=2&page=2");
  assert.deepEqual({ n: paged.phones.length, total: paged.body.data.pagination.totalItems }, { n: 1, total: 3 });
  for (const bad of ["role=CUSTOMER", "status=bogus", "warehouse_id=abc", "limit=500"]) assert.equal((await list(bad)).status, 400, bad);
  const customers = await call("GET", `/?search=${CUSTOMER}`, adminToken);
  assert.deepEqual(customers.body.data.users.map((u) => [u.phone, u.role]), [[CUSTOMER, "CUSTOMER"]], "GET / lists customers, not staff");

  // ---- POST /  (create)
  const good = { first_name: "New", last_name: "Ops", phone: "+91 60000 00056", email: "staff.check.new@example.test", role: "OPS_STAFF", warehouse_id: 3, shift: "MORNING", password_method: "set", password: "Temp#Pass9", must_change_password: true };
  assert.equal((await call("POST", "", null, good)).status, 401);
  assert.equal((await call("POST", "", adminToken, good)).status, 403, "store admins cannot create staff");
  for (const [why, patch] of [
    ["customer role", { role: "CUSTOMER" }], ["weak password", { password: "abc" }], ["no number in password", { password: "onlyletters" }],
    ["no first name", { first_name: undefined }], ["bad phone", { phone: "123" }], ["bad warehouse", { warehouse_id: 0 }], ["no password with method set", { password: undefined }],
    ["password with method link", { password_method: "link" }],
  ]) assert.equal((await call("POST", "", superToken, { ...good, ...patch })).status, 400, why);

  const created = await call("POST", "", superToken, good);
  assert.equal(created.status, 201);
  assert.deepEqual(
    { phone: created.body.data.phone, role: created.body.data.role, warehouse_id: created.body.data.warehouse_id, must_change_password: created.body.data.must_change_password, invite_pending: created.body.data.invite_pending, invite_sent: created.body.data.invite_sent, first_name: created.body.data.first_name },
    { phone: NEW_OPS, role: "OPS_STAFF", warehouse_id: 3, must_change_password: true, invite_pending: true, invite_sent: false, first_name: "New" }
  );
  assert.ok(!JSON.stringify(created.body).includes("Temp#Pass9") && !("temporary_password" in created.body.data), "a typed password is never echoed");
  const newOps = await row(NEW_OPS);
  assert.ok(newOps.phone_verified && newOps.profile_complete && newOps.is_active, "a finished account, not a half sign-up");
  assert.ok(await bcrypt.compare("Temp#Pass9", newOps.password_hash), "stored hashed");
  assert.equal(await audits(newOps.id, "PROFILE_UPDATED"), 1);
  assert.equal((await call("POST", "", superToken, good)).status, 409, "same phone");
  assert.equal((await call("POST", "", superToken, { ...good, phone: "6000000059" })).status, 409, "same email");
  assert.equal((await call("POST", "", superToken, { ...good, phone: CUSTOMER, email: undefined })).status, 409, "a customer's number");

  const linked = await call("POST", "", superToken, { first_name: "Link", last_name: "Super", phone: LINKED, role: "SUPER_ADMIN", warehouse_id: 5, password_method: "link" });
  assert.equal(linked.status, 201);
  assert.deepEqual(
    { warehouse_id: linked.body.data.warehouse_id, invite_sent: linked.body.data.invite_sent, must_change_password: linked.body.data.must_change_password },
    { warehouse_id: null, invite_sent: true, must_change_password: true }
  );
  assert.ok(!("temporary_password" in linked.body.data) && !JSON.stringify(linked.body).includes("password_hash"), "a generated password only goes out by SMS");
  assert.ok((await row(LINKED)).password_hash?.startsWith("$2"), "generated password is stored hashed");

  const final = await call("POST", "", superToken, { first_name: "Fin", last_name: "Admin", phone: FINAL, role: "ADMIN", warehouse_id: 2, password: "Final#Pass1", must_change_password: false });
  assert.equal(final.status, 201);
  assert.equal(final.body.data.must_change_password, false);

  // ---- PUT /:id  (update)
  const put = (id, token, body) => call("PUT", `/${id}`, token, body);
  assert.equal((await put(newOps.id, adminToken, { first_name: "X" })).status, 403);
  assert.equal((await put(newOps.id, superToken, { first_name: "New", warehouse_id: 3, role: "OPS_STAFF", phone: NEW_OPS })).status, 200);
  assert.equal(await audits(newOps.id, "PROFILE_UPDATED"), 1, "saving the same values writes no audit row");
  const renamed = await put(newOps.id, superToken, { first_name: "Renamed", warehouse_id: 4 });
  assert.equal(renamed.status, 200);
  assert.deepEqual({ first_name: renamed.body.data.first_name, warehouse_id: renamed.body.data.warehouse_id }, { first_name: "Renamed", warehouse_id: 4 });
  assert.equal((await row(NEW_OPS)).warehouse_id, "4");
  assert.equal(await audits(newOps.id, "PROFILE_UPDATED"), 2);
  assert.equal((await put(superAdmin.id, superToken, { role: "ADMIN" })).status, 400, "cannot change your own role");
  assert.equal((await put(newOps.id, superToken, { phone: OPS })).status, 409, "phone taken");
  assert.equal((await put(newOps.id, superToken, { role: "CUSTOMER" })).status, 400, "not a staff role");
  assert.equal((await put(customer.id, superToken, { first_name: "Hack" })).status, 404, "customers are not staff");
  await addToken(newOps.id);
  assert.equal(await openTokens(newOps.id), 1);
  assert.equal((await put(newOps.id, superToken, { role: "ADMIN" })).body.data.role, "ADMIN");
  assert.equal(await openTokens(newOps.id), 0, "a role change signs the person out");
  assert.equal(await audits(newOps.id, "ROLE_CHANGE"), 1);
  const promoted = await put(final.body.data.id, superToken, { role: "SUPER_ADMIN", warehouse_id: 4 });
  assert.deepEqual({ role: promoted.body.data.role, warehouse_id: promoted.body.data.warehouse_id }, { role: "SUPER_ADMIN", warehouse_id: null });

  // ---- PATCH /:id/status
  const patch = (id, token, body) => call("PATCH", `/${id}/status`, token, body);
  assert.equal((await patch(newOps.id, adminToken, { is_active: false })).status, 403, "a store admin cannot disable staff");
  const blocked = await patch(customer.id, adminToken, { is_active: false });
  assert.deepEqual({ status: blocked.status, message: blocked.body.message }, { status: 200, message: "Customer blocked" }, "customers still work for any admin");
  assert.equal((await patch(customer.id, adminToken, { is_active: true })).body.message, "Customer unblocked");
  await addToken(newOps.id);
  const off = await patch(newOps.id, superToken, { is_active: false });
  assert.deepEqual({ status: off.status, active: off.body.data.is_active, message: off.body.message }, { status: 200, active: false, message: "User blocked" });
  assert.equal(await openTokens(newOps.id), 0, "disabling signs the person out");
  assert.equal(await audits(newOps.id, "ACCOUNT_LOCKED"), 1);
  assert.equal((await patch(superAdmin.id, superToken, { is_active: false })).status, 400, "cannot disable yourself");
  assert.equal((await patch(newOps.id, superToken, { is_active: "yes" })).status, 400);
  assert.equal((await patch("999999999", superToken, { is_active: false })).status, 404);
  assert.equal((await patch(newOps.id, superToken, { is_active: true })).status, 200);

  // ---- POST /:id/reset-password
  const reset = (id, token, body) => call("POST", `/${id}/reset-password`, token, body);
  assert.equal((await reset(newOps.id, adminToken, { password: "Fresh#Pass7" })).status, 403);
  assert.equal((await reset(newOps.id, superToken, { password: "short" })).status, 400);
  await db.AuthUser.update({ failed_login_attempts: 4, account_locked_until: new Date(Date.now() + 3600e3) }, { where: { phone: NEW_OPS } });
  await addToken(newOps.id);
  const done = await reset(newOps.id, superToken, { password_method: "set", password: "Fresh#Pass7", must_change_password: false });
  assert.equal(done.status, 200);
  assert.ok(!JSON.stringify(done.body).includes("Fresh#Pass7"), "a typed password is never echoed");
  const afterReset = await row(NEW_OPS);
  assert.ok(await bcrypt.compare("Fresh#Pass7", afterReset.password_hash) && !(await bcrypt.compare("Temp#Pass9", afterReset.password_hash)));
  assert.deepEqual({ failed: afterReset.failed_login_attempts, locked: afterReset.account_locked_until, must: afterReset.must_change_password }, { failed: 0, locked: null, must: false });
  assert.equal(await openTokens(newOps.id), 0, "a reset signs the person out");
  assert.equal(await audits(newOps.id, "PASSWORD_RESET_SUCCESS"), 1);
  const relinked = await reset(newOps.id, superToken, { password_method: "link" });
  assert.deepEqual({ status: relinked.status, sent: relinked.body.data.invite_sent, must: relinked.body.data.must_change_password }, { status: 200, sent: true, must: true });
  assert.notEqual((await row(NEW_OPS)).password_hash, afterReset.password_hash);

  // ---- POST /:id/resend-invite
  const resend = (id, token) => call("POST", `/${id}/resend-invite`, token);
  assert.equal((await resend(newOps.id, adminToken)).status, 403);
  assert.equal((await resend(final.body.data.id, superToken)).status, 409, "already chose a password");
  const beforeResend = (await row(NEW_OPS)).password_hash;
  const sent = await resend(newOps.id, superToken);
  assert.deepEqual({ status: sent.status, sent: sent.body.data.invite_sent }, { status: 200, sent: true });
  assert.notEqual((await row(NEW_OPS)).password_hash, beforeResend, "a new temporary password");
  assert.equal(await audits(newOps.id, "PASSWORD_RESET_REQUEST"), 1);
  assert.equal((await resend(customer.id, superToken)).status, 404);

  console.log("adminStaff.check: ok");
} finally {
  await cleanup();
  server.close();
  await db.sequelize.close();
}
