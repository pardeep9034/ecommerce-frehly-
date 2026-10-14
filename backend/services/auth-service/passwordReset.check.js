// Run: docker compose exec -T auth-service node passwordReset.check.js   (takes ~35 s: one 31 s wait for the cooldown)
// Live: talks to the running service on PORT and needs NODE_ENV=development, where the OTP comes back in the
// response, so no SMS or log reading. Uses throwaway numbers 60000000xx and deletes them before and after.
// If the Docker VM clock steps mid-run and one assertion fails, run it again before debugging.
import assert from "node:assert/strict";
import initializeModels from "./src/models/index.js";
import OtpService from "./src/modules/otp/otp.service.js";

assert.equal(process.env.NODE_ENV, "development", "needs NODE_ENV=development (the OTP is read from the response)");

// tooSoon: no record, a fresh one, an old one.
assert.equal(OtpService.tooSoon(null), false);
assert.equal(OtpService.tooSoon({ created_at: new Date() }), true);
assert.equal(OtpService.tooSoon({ created_at: new Date(Date.now() - 31_000) }), false);

const BASE = `http://localhost:${process.env.PORT || 3001}`;
const ACTIVE = "6000000011";
const HALF = "6000000012"; // signed up, never finished
const PHONES = [ACTIVE, HALF];

const post = async (path, body, token) => {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};
const forgot = (phone) => post("/auth/forgot-password", { phone });
const verifyReset = (phone, otp) => post("/auth/signup/verify", { phone, otp, type: "FORGOT_PASSWORD" });
const signIn = (phone, password) => post("/auth/login/password", { identifier: phone, password });

const db = await initializeModels();
const cleanup = async () => {
  const where = "user_id in (select id from auth_users where phone in (:phones))";
  for (const table of ["auth_audit_logs", "auth_otps", "auth_refresh_tokens", "auth_user_sessions"]) {
    await db.sequelize.query(`delete from ${table} where ${where}`, { replacements: { phones: PHONES } });
  }
  await db.sequelize.query("delete from auth_audit_logs where phone in (:phones)", { replacements: { phones: PHONES } });
  await db.sequelize.query("delete from auth_users where phone in (:phones)", { replacements: { phones: PHONES } });
};

try {
  await cleanup();

  // G3: a number that never finished sign-up gets no code, and the reply looks like any other.
  let r = await post("/auth/signup", { phone: HALF, role: "DELIVERY_PARTNER" });
  assert.ok([200, 201].includes(r.status) && r.body.data?.otp, `signup half: ${r.status}`);
  r = await forgot(HALF);
  assert.equal(r.status, 200);
  assert.match(r.body.message, /If the phone number exists/);
  assert.equal(r.body.data?.otp, undefined, "an unfinished account must not be sent a reset code");
  r = await verifyReset(HALF, "123456");
  assert.equal(r.status, 400);
  assert.match(r.body.message, /No OTP request found/);

  // A finished partner account: signup -> verify -> register.
  r = await post("/auth/signup", { phone: ACTIVE, role: "DELIVERY_PARTNER" });
  assert.ok(r.body.data?.otp, `signup active: ${r.status}`);
  r = await post("/auth/signup/verify", { phone: ACTIVE, otp: r.body.data.otp, type: "SIGNUP" });
  assert.equal(r.status, 200, `verify signup: ${r.status}`);
  r = await post("/auth/register", { phone: ACTIVE, first_name: "Reset Check", password: "OldPass#1" }, r.body.data.onBoardToken);
  assert.ok([200, 201].includes(r.status), `register: ${r.status} ${r.body.message}`);
  assert.equal((await signIn(ACTIVE, "OldPass#1")).status, 200);

  // G4 setup: five wrong passwords lock the account, even for the right password.
  for (let i = 0; i < 5; i++) assert.equal((await signIn(ACTIVE, "wrong-password")).status, 400);
  r = await signIn(ACTIVE, "OldPass#1");
  assert.equal(r.status, 423, `should be locked: ${r.status}`);

  // G2: the first request sends a code; a second inside 30 s gets the same reply and no code.
  r = await forgot(ACTIVE);
  assert.equal(r.status, 200);
  const first = r.body.data?.otp;
  assert.match(first ?? "", /^\d{6}$/, "an active account gets a code");
  r = await forgot(ACTIVE);
  assert.equal(r.status, 200);
  assert.equal(r.body.data?.otp, undefined, "second request inside the gap must not send");
  assert.equal((await post("/auth/otp/resend", { phone: ACTIVE, type: "FORGOT_PASSWORD" })).status, 200);

  // G1: five wrong codes use the code up, even when the sixth try is the right one.
  const wrong = first === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) {
    r = await verifyReset(ACTIVE, wrong);
    assert.equal(r.status, 400, `wrong code #${i + 1}: ${r.status}`);
  }
  r = await verifyReset(ACTIVE, first);
  assert.equal(r.status, 429);
  assert.match(r.body.message, /Too many wrong attempts/);

  // Recovery: after the gap a new code works, and the early resend above did not replace it.
  await new Promise((resolve) => setTimeout(resolve, 31_000));
  r = await forgot(ACTIVE);
  const second = r.body.data?.otp;
  assert.match(second ?? "", /^\d{6}$/, "a new code after the gap");
  assert.equal((await post("/auth/otp/resend", { phone: ACTIVE, type: "FORGOT_PASSWORD" })).status, 200); // inside the gap again: no new row
  r = await verifyReset(ACTIVE, second);
  assert.equal(r.status, 200, `verify new code: ${r.status} ${r.body.message}`);
  const resetToken = r.body.data.resetToken;
  assert.ok(resetToken);

  // G4: the reset sets the new password and lifts the lock at once.
  r = await post("/auth/reset-password", { resetToken, newPassword: "NewPass#2" });
  assert.equal(r.status, 200, `reset: ${r.status} ${r.body.message} ${JSON.stringify(r.body.errors)}`);
  r = await signIn(ACTIVE, "NewPass#2");
  assert.equal(r.status, 200, `new password should sign in straight away: ${r.status} ${r.body.message}`);
  assert.equal((await signIn(ACTIVE, "OldPass#1")).status, 400, "old password must stop working");

  console.log("passwordReset.check.js: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await db.sequelize.close();
}
