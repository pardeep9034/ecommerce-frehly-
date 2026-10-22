import crypto from "node:crypto";
import { env } from "../config/env.js";

// Generate a 6-digit OTP
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// What auth_otps stores instead of the code. Keyed, because a plain hash of 6 digits falls to trying all 900,000.
// ponytail: keyed with JWT_SECRET ("otp:" keeps it apart from token signatures), whose holder can mint any token
// anyway. Give OTPs their own key if the two ever have to rotate separately.
export function hashOtp(otp) {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(`otp:${otp}`).digest("hex");
}

// Set OTP expiry time (5 minutes from now)
export function getOtpExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000);
}



