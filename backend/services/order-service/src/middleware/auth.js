import verifyToken from "../utils/verifyToken.js";
import ResponseUtil from "../utils/response.js";
import AppError from "../utils/AppError.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return ResponseUtil.unauthorized(res, "Authentication token is required");
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return ResponseUtil.unauthorized(res, "Invalid or expired token");
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    return next();
  };
};

export default authenticateToken;
