import crypto from "node:crypto";
import { env } from "../config/env.js";

// The 4 digits the customer tells the rider at the door. Derived, not stored: no column, nothing to leak or rotate.
// ponytail: same HMAC as delivery-service's utils/pickupCode.js with purpose "delivery" (it checks, this side shows);
// change both together.
export const deliveryCode = (orderId) =>
  String(Number.parseInt(crypto.createHmac("sha256", env.JWT_SECRET).update(`delivery:${orderId}`).digest("hex").slice(0, 8), 16) % 10000).padStart(4, "0");
