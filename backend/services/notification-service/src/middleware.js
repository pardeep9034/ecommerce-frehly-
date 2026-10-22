import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import ResponseUtil from "./utils/response.js";
import AppError from "./utils/AppError.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return ResponseUtil.unauthorized(res, "Authentication token is required");
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return ResponseUtil.unauthorized(res, "Invalid or expired token");
  }
};

// Hashing first gives timingSafeEqual two equal-length buffers whatever the caller sends.
const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();

// Guards /internal/notifications/*: only a sibling service holding INTERNAL_API_KEY may call. Fails closed.
export const requireInternalKey = (req, res, next) => {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return next(new AppError("Internal API is not configured", 503));

  const sent = req.headers["x-internal-key"];
  if (!sent || !crypto.timingSafeEqual(digest(sent), digest(key))) {
    return next(new AppError("Invalid internal key", 401));
  }

  return next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError("Insufficient permissions", 403));
  }

  return next();
};
