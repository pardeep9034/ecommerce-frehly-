import jwt from "jsonwebtoken";
import ResponseUtil from "../utils/response.js";
import AppError from "../utils/AppError.js";

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

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError("Insufficient permissions", 403));
  }

  return next();
};
