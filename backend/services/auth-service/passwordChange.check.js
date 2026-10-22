// Run: docker compose exec -T auth-service node passwordChange.check.js
// Live: PUT /auth/password, POST /auth/logout/others and POST /auth/logout/all on the running service.
// Needs NODE_ENV=development (the signup OTP comes back in the response). Uses the throwaway number 6000000041
// and deletes it before and after. If the Docker VM clock steps mid-run and one assertion fails, run it again.
import assert from "node:assert/strict";
import initializeModels from "./src/models/index.js";

assert.equal(process.env.NODE_ENV, "development", "needs NODE_ENV=development (the OTP is read from the response)");

const BASE = `http://localhost:${process.env.PORT || 3001}`;
const PHONE = "6000000041";
const OLD = "Pass#1234";
const NEW = "NewPass#5678";

// A "device" is an access token plus its refresh cookie.
const call = async (method, path, { body, device } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(device?.token && { authorization: `Bearer ${device.token}` }),
      ...(device?.cookie && { cookie: device.cookie }),
    },
    body: body && JSON.stringify(body),
  });
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).find((c) => c.startsWith("refreshToken="));
  return { status: res.status, body: await res.json().catch(() => ({})), cookie };
};
const signIn = async (password) => {
  const r = await call("POST", "/auth/login/password", { body: { identifier: PHONE, password } });
  return r.status === 200 ? { token: r.body.data.accessToken, cookie: r.cookie } : null;
};
// 200 while the device's session is alive; a refresh also rotates the cookie, so keep the new one.
const refresh = async (device) => {
  const r = await call("POST", "/auth/refresh-token", { device: { cookie: device.cookie } });
  if (r.status === 200) device.cookie = r.cookie;
  return r.status;
};
const change = (device, current_password, new_password) =>
  call("PUT", "/auth/password", { device, body: { current_password, new_password } });

const db = await initializeModels();
const userRow = async () =>
  (await db.sequelize.query("select id, failed_login_attempts, account_locked_until, must_change_password from auth_users where phone = :p",
    { replacements: { p: PHONE }, plain: true }));
const cleanup = async () => {
  const where = "user_id in (select id from auth_users where phone = :p)";
  for (const table of ["auth_audit_logs", "auth_otps", "auth_refresh_tokens", "auth_user_sessions"]) {
    await db.sequelize.query(`delete from ${table} where ${where}`, { replacements: { p: PHONE } });
  }
  await db.sequelize.query("delete from auth_audit_logs where phone = :p", { replacements: { p: PHONE } });
  await db.sequelize.query("delete from auth_users where phone = :p", { replacements: { p: PHONE } });
};

try {
  await cleanup();
  let r = await call("POST", "/auth/signup", { body: { phone: PHONE } });
  r = await call("POST", "/auth/signup/verify", { body: { phone: PHONE, otp: r.body.data.otp, type: "SIGNUP" } });
  r = await call("POST", "/auth/register", {
    device: { token: r.body.data.onBoardToken },
    body: { phone: PHONE, first_name: "Password", last_name: "Check", password: OLD },
  });
  assert.ok([200, 201].includes(r.status), `register: ${r.status} ${r.body.message}`);
  // The tests below expect this flag cleared by a change.
  await db.sequelize.query("update auth_users set must_change_password = true where phone = :p", { replacements: { p: PHONE } });

  const a = await signIn(OLD); // this device
  const b = await signIn(OLD); // another device
  assert.ok(a?.cookie && b?.cookie, "two sign-ins with refresh cookies");

  // Auth and validation.
  assert.equal((await change(null, OLD, NEW)).status, 401, "no token");
  r = await change(a, OLD, "short1");
  assert.equal(r.status, 400, "too short");
  assert.equal(r.body.errors?.[0]?.message, "Password needs at least 8 characters"); // shown as is on the Settings page
  assert.equal((await change(a, OLD, "longenough")).status, 400, "no digit");
  assert.equal((await call("PUT", "/auth/password", { device: a, body: { new_password: NEW } })).status, 400, "no current password");

  // Wrong current password: 400 (not 401, which would make the client sign out) and it counts toward the lock.
  r = await change(a, "Wrong#123", NEW);
  assert.equal(r.status, 400);
  assert.equal(r.body.message, "Current password is wrong");
  assert.equal((await userRow()).failed_login_attempts, 1);
  assert.equal((await change(a, OLD, OLD)).status, 400, "same password");

  // Success: device B is signed out, this device stays, the counter and the temporary flag are cleared.
  r = await change(a, OLD, NEW);
  assert.equal(r.status, 200, `${r.status} ${r.body.message}`);
  assert.equal(r.body.data.signed_out_sessions, 1);
  assert.equal(await refresh(b), 401, "other device signed out");
  assert.equal(await refresh(a), 200, "this device stays signed in");
  let row = await userRow();
  assert.equal(row.failed_login_attempts, 0);
  assert.equal(row.must_change_password, false);
  assert.equal(await signIn(OLD), null, "old password stops working");
  const c = await signIn(NEW);
  assert.ok(c, "new password works");

  // Sign out everywhere else: C ends, A stays. Without a cookie there is no "this device" to keep.
  r = await call("POST", "/auth/logout/others", { device: a });
  assert.equal(r.status, 200, `${r.status} ${r.body.message}`);
  assert.equal(r.body.data.signed_out_sessions, 1);
  assert.equal(await refresh(c), 401, "other device signed out");
  assert.equal(await refresh(a), 200, "this device stays signed in");
  assert.equal((await call("POST", "/auth/logout/others", { device: { token: a.token } })).status, 400, "no cookie");
  r = await call("POST", "/auth/logout/others", { device: a });
  assert.equal(r.body.message, "No other sessions were signed in");

  // Sign out everywhere (used to answer 500): this device too, and its cookie is cleared.
  r = await call("POST", "/auth/logout/all", { device: a });
  assert.equal(r.status, 200, `${r.status} ${r.body.message}`);
  assert.equal(r.cookie, "refreshToken=", "cookie cleared");
  assert.equal(await refresh(a), 401, "this device signed out too");

  // Five wrong current passwords lock the account (A's access token still works for 15 min).
  for (let i = 1; i <= 4; i++) assert.equal((await change(a, "Wrong#123", "Other#999")).status, 400, `wrong #${i}`);
  assert.equal((await change(a, "Wrong#123", "Other#999")).status, 423, "5th wrong locks");
  assert.equal((await change(a, NEW, "Other#999")).status, 423, "locked even with the right password");
  assert.ok((await userRow()).account_locked_until, "lock saved");

  // Audit: one successful change, six wrong tries, two sign-outs.
  const [audit] = await db.sequelize.query(
    "select event_type, status, count(*)::int as n from auth_audit_logs where user_id = :id and event_type in ('PASSWORD_CHANGE', 'LOGOUT_ALL') group by 1, 2",
    { replacements: { id: row.id } }
  );
  // Sorted here: SQL "order by" on an ENUM follows its declared order, not A-Z.
  assert.deepEqual(audit.map((x) => `${x.event_type}:${x.status}:${x.n}`).sort(), ["LOGOUT_ALL:SUCCESS:3", "PASSWORD_CHANGE:FAILURE:6", "PASSWORD_CHANGE:SUCCESS:1"]);

  console.log("passwordChange.check.js: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await db.sequelize.close();
}
