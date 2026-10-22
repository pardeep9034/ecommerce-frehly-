// Run: docker compose exec -T auth-service node profileUpdate.check.js
// Live: PUT /auth/profile and POST /auth/profile/phone/otp on the running service. Needs NODE_ENV=development
// (the OTP comes back in the response). Uses throwaway numbers 60000000 21-23 and deletes them before and after.
import assert from "node:assert/strict";
import initializeModels from "./src/models/index.js";

assert.equal(process.env.NODE_ENV, "development", "needs NODE_ENV=development (the OTP is read from the response)");

const BASE = `http://localhost:${process.env.PORT || 3001}`;
const ME = "6000000021";
const NEW = "6000000022";
const OTHER = "6000000023"; // a second account: its number and email are taken
const PHONES = [ME, NEW, OTHER];

const call = async (method, path, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const register = async (phone, email) => {
  let r = await call("POST", "/auth/signup", { phone });
  r = await call("POST", "/auth/signup/verify", { phone, otp: r.body.data.otp, type: "SIGNUP" });
  r = await call("POST", "/auth/register", { phone, first_name: "Profile", last_name: "Check", email, password: "Pass#1234" }, r.body.data.onBoardToken);
  assert.ok([200, 201].includes(r.status), `register ${phone}: ${r.status} ${r.body.message}`);
};
const signIn = async (phone) => (await call("POST", "/auth/login/password", { identifier: phone, password: "Pass#1234" })).body.data?.accessToken;

const db = await initializeModels();
const cleanup = async () => {
  const where = "user_id in (select id from auth_users where phone in (:phones))";
  for (const table of ["auth_audit_logs", "auth_otps", "auth_refresh_tokens", "auth_user_sessions", "auth_user_addresses"]) {
    await db.sequelize.query(`delete from ${table} where ${where}`, { replacements: { phones: PHONES } }).catch(() => {});
  }
  await db.sequelize.query("delete from auth_users where phone in (:phones)", { replacements: { phones: PHONES } });
};

try {
  await cleanup();
  await register(ME, "me.profile@example.com");
  await register(OTHER, "other.profile@example.com");
  const token = await signIn(ME);
  assert.ok(token, "sign in");
  const put = (body, t = token) => call("PUT", "/auth/profile", body, t);
  const askOtp = (phone) => call("POST", "/auth/profile/phone/otp", { phone }, token);

  // Auth and validation.
  assert.equal((await put({ first_name: "Nope" }, null)).status, 401);
  assert.equal((await put({})).status, 400, "empty body");
  assert.equal((await put({ first_name: "A" })).status, 400, "name too short");
  assert.equal((await put({ email: "not-an-email" })).status, 400);

  // Name + email straight away; email is lower-cased and loses its verified flag.
  let r = await put({ first_name: "Asha", last_name: "Rao", email: "Asha.New@example.com" });
  assert.equal(r.status, 200, `${r.status} ${r.body.message}`);
  assert.deepEqual([r.body.data.first_name, r.body.data.last_name, r.body.data.email], ["Asha", "Rao", "asha.new@example.com"]);
  r = await put({ first_name: "Asha" });
  assert.equal(r.body.message, "Nothing to change");
  assert.equal((await put({ email: "other.profile@example.com" })).status, 409, "email taken");

  // Mobile: needs an OTP, sent to the new number only.
  assert.equal((await put({ phone: NEW })).status, 400, "phone without otp");
  assert.equal((await askOtp(ME)).status, 400, "same number");
  assert.equal((await askOtp(OTHER)).status, 409, "number taken");
  r = await askOtp(NEW);
  assert.equal(r.status, 200);
  const code = r.body.data.otp;
  assert.match(code, /^\d{6}$/);
  assert.equal((await askOtp(NEW)).status, 429, "cooldown");
  assert.equal((await put({ phone: OTHER, otp: code })).status, 400, "code is for another number");
  assert.equal((await put({ phone: NEW, otp: code === "000000" ? "111111" : "000000" })).status, 400, "wrong code");
  r = await put({ phone: NEW, otp: code });
  assert.equal(r.status, 200, `${r.status} ${r.body.message}`);
  assert.equal(r.body.data.phone, NEW);
  assert.equal((await put({ phone: ME, otp: code })).status, 400, "used code cannot be replayed");

  // Signs in with the new number; the audit row names only the changed fields.
  assert.ok(await signIn(NEW), "sign in with the new number");
  const [rows] = await db.sequelize.query(
    "select details from auth_audit_logs where event_type = 'PROFILE_UPDATED' and user_id = (select id from auth_users where phone = :p) order by id",
    { replacements: { p: NEW } }
  );
  assert.deepEqual(rows.map((row) => row.details.fields), [["first_name", "last_name", "email"], ["phone"]]);

  console.log("profileUpdate.check.js: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await db.sequelize.close();
}
