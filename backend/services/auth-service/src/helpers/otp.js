// Generate a 6-digit OTP
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Convert OTP into a hashed value (basic example)
export function hashOtp(otp) {
  return Buffer.from(otp).toString("base64");
}

// Set OTP expiry time (5 minutes from now)
export function getOtpExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000);
}

export function decodeOtp(base64Otp) {
  return Buffer.from(base64Otp, "base64").toString("utf-8");
}


