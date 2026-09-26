// Temporary passwords for new users and resets (Add user, Staff list "Reset password").

export const PASSWORD_RULES = [
  { label: "8+ characters", test: (value) => value.length >= 8 },
  { label: "A capital letter", test: (value) => /[A-Z]/.test(value) },
  { label: "A number", test: (value) => /\d/.test(value) },
  { label: "A symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

// 0–4: one point per rule met, capped at 1 while shorter than 8 characters.
export const passwordScore = (value = "") => {
  const met = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  return value.length < 8 ? Math.min(met, 1) : met;
};

// No look-alike characters (0/O, 1/l/I), so it can be read out over the phone.
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "@#$%&*!";

const pick = (chars) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];

// e.g. "Fresh#4827Kq": word-ish start, symbol, digits, letters. Always meets all 4 rules.
export const generatePassword = () =>
  [pick(UPPER), pick(LOWER), pick(LOWER), pick(LOWER), pick(SYMBOLS), pick(DIGITS), pick(DIGITS), pick(DIGITS), pick(DIGITS), pick(UPPER), pick(LOWER)].join("");
