// Run: docker compose exec -T auth-service node otp.check.js
// OTP codes, how they are stored, and POST /auth/otp/resend on the running service. Needs NODE_ENV=development
// (the code comes back in the response). Uses the throwaway numbers 6000000042 and 6000000043 and deletes them
// before and after.
import assert from "node:assert/strict";
import initializeModels from "./src/models/index.js";
import { env } from "./src/config/env.js";
import { generateOtp, hashOtp } from "./src/helpers/otp.js";
import otpService from "./src/modules/otp/otp.service.js";

assert.equal(env.NODE_ENV, "development", "needs NODE_ENV=development (the OTP is read from the response)");

// Codes come from crypto.randomInt; what is stored is an HMAC the code can't be read back from.
for (let i = 0; i < 2000; i++) assert.match(generateOtp(), /^[1-9]\d{5}$/);
const stored = hashOtp("123456");
assert.match(stored, /^[0-9a-f]{64}$/);
assert.equal(hashOtp("123456"), stored);
assert.notEqual(hashOtp("123457"), stored);
assert.equal(otpService.compareOtp("123456", stored), true);
assert.equal(otpService.compareOtp("123457", stored), false);
assert.equal(otpService.compareOtp("", stored), false);
assert.equal(otpService.compareOtp("123456", Buffer.from("123456").toString("base64")), false, "a code stored the old way (base64) no longer matches");

const BASE = `http://localhost:${process.env.PORT || 3001}`;
const PHONE = "6000000042";
const NOBODY = "6000000043";
const post = async (path, body) => {
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const db = await initializeModels();
const query = (sql) => db.sequelize.query(sql, { replacements: { p: PHONE, n: NOBODY } });
const mine = "user_id in (select id from auth_users where phone = :p)";
const cleanup = async () => {
  for (const table of ["auth_audit_logs", "auth_otps", "auth_refresh_tokens", "auth_user_sessions"]) {
    await query(`delete from ${table} where user_id in (select id from auth_users where phone in (:p, :n))`);
  }
  await query("delete from auth_audit_logs where phone in (:p, :n)");
  await query("delete from auth_users where phone in (:p, :n)");
};
const latestHash = async () => (await query(`select code_hash from auth_otps where ${mine} order by created_at desc limit 1`))[0][0]?.code_hash;
// Resend waits 30 s after the last code. Age the codes instead of sleeping; relative to their own time, so the VM clock can't interfere.
const ageCodes = () => query(`update auth_otps set created_at = created_at - interval '10 minutes' where ${mine}`);

try {
  await cleanup();

  // Signup stores the keyed hash of the code it sends.
  let r = await post("/auth/signup", { phone: PHONE });
  const first = r.body.data?.otp;
  assert.match(String(first), /^\d{6}$/, `signup: ${r.status} ${r.body.message}`);
  assert.equal(await latestHash(), hashOtp(first));

  // Resend makes a new code, stored the same way; in development it comes back.
  await ageCodes();
  r = await post("/auth/otp/resend", { phone: PHONE, type: "SIGNUP" });
  const resent = r.body.data?.otp;
  assert.equal(r.status, 200);
  assert.match(String(resent), /^\d{6}$/, "development: the code comes back");
  assert.equal(await latestHash(), hashOtp(resent));
  const reply = r.body.message;

  // Inside the 30 s gap, and for a number nobody has: the same reply, without a code.
  r = await post("/auth/otp/resend", { phone: PHONE, type: "SIGNUP" });
  assert.deepEqual([r.status, r.body.message, r.body.data], [200, reply, {}], "too soon");
  r = await post("/auth/otp/resend", { phone: NOBODY, type: "SIGNUP" });
  assert.deepEqual([r.status, r.body.message, r.body.data], [200, reply, {}], "unknown number");

  // The resent code verifies; a wrong one doesn't.
  r = await post("/auth/signup/verify", { phone: PHONE, otp: resent === "999999" ? "999998" : "999999", type: "SIGNUP" });
  assert.equal(r.status, 400, "wrong code");
  r = await post("/auth/signup/verify", { phone: PHONE, otp: resent, type: "SIGNUP" });
  assert.ok(r.body.data?.onBoardToken, `resent code: ${r.status} ${r.body.message}`);

  // Outside development the code is never in the reply.
  await ageCodes();
  env.NODE_ENV = "production";
  const result = await otpService.resendOtp(PHONE, "SIGNUP").finally(() => { env.NODE_ENV = "development"; });
  assert.deepEqual(result.data, {}, "production: no code in the reply");

  console.log("otp.check.js: ok");
} finally {
  await cleanup().catch((error) => console.error("cleanup failed:", error.message));
  await db.sequelize.close();
}
