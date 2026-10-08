// Where an account is in sign-up. Only signup() -> verify() -> register() ever set these two flags,
// so the live states are NEW (no row), UNVERIFIED, VERIFIED_INCOMPLETE and ACTIVE.
// The chain ends in a value, so it cannot fall through and return undefined.
// ponytail: derived, not stored. Add a status column when a third flag (email, Google) joins.
export const accountState = (user) =>
  !user ? "NEW"
    : user.profile_complete ? "ACTIVE"
      : user.phone_verified ? "VERIFIED_INCOMPLETE"
        : "UNVERIFIED";

// What /auth/login tells the app to do next. Every state above needs an entry (accountState.check.js).
export const NEXT_ACTION = {
  NEW: "SIGNUP",
  UNVERIFIED: "SIGNUP", // signup() resends the OTP to an existing unverified user
  VERIFIED_INCOMPLETE: "SIGNUP", // OTP again: the 10-minute onboarding token is long gone and /auth/register needs one
  ACTIVE: "LOGIN",
};
