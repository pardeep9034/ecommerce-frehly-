import crypto from "node:crypto";

import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";

// Hashing first gives timingSafeEqual two equal-length buffers whatever the caller sends.
const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();

// Guards /internal/*: only a sibling service holding INTERNAL_API_KEY may call. Fails closed.
const requireInternalKey = (req, res, next) => {
  if (!env.INTERNAL_API_KEY) {
    return next(new AppError("Internal API is not configured", 503));
  }

  const sent = req.headers["x-internal-key"];
  if (!sent || !crypto.timingSafeEqual(digest(sent), digest(env.INTERNAL_API_KEY))) {
    return next(new AppError("Invalid internal key", 401));
  }

  next();
};

export default requireInternalKey;
