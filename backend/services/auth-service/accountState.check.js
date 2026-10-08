// Run: node accountState.check.js   (pure: no database, no running service)
// Every flag combination, and a missing user, must map to a login action. A state added without one fails here.
import assert from "node:assert/strict";
import { accountState, NEXT_ACTION } from "./src/modules/auth/accountState.js";

const cases = [
  [null, "SIGNUP"],
  [{ phone_verified: false, profile_complete: false }, "SIGNUP"], // the /auth/login 500
  [{ phone_verified: true, profile_complete: false }, "SIGNUP"], // verified, never finished: new OTP, fresh onboarding token
  [{ phone_verified: true, profile_complete: true }, "LOGIN"],
  [{ phone_verified: false, profile_complete: true }, "LOGIN"], // should not occur; must still answer
];

for (const [user, action] of cases) {
  assert.equal(NEXT_ACTION[accountState(user)], action, JSON.stringify(user));
}
console.log("accountState.check.js: ok");
