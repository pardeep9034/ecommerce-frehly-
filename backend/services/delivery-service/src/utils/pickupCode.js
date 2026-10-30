import crypto from "node:crypto";
import { env } from "../config/env.js";

// 4-digit codes derived from an id with a server secret: nothing to store, and they can't be worked out from the id.
// purpose keeps them apart:
//   pickup   (assignment id) the rider shows at the store; the store types it in to hand the order over.
//   return   (assignment id) the rider shows when bringing goods back; the store types it in to take them.
//   delivery (order id)      the customer tells the rider at the door. ponytail: order-service's utils/deliveryCode.js
//                            makes the same code to show the customer; change both together.
// ponytail: 4 digits with no attempt limit, fine behind a staff-only route; add a per-assignment counter if that changes.
export const pickupCode = (id, purpose = "pickup") =>
  String(Number.parseInt(crypto.createHmac("sha256", env.JWT_SECRET).update(`${purpose}:${id}`).digest("hex").slice(0, 8), 16) % 10000).padStart(4, "0");

export const pickupCodeMatches = (id, code, purpose = "pickup") => String(code ?? "").trim() === pickupCode(id, purpose);
