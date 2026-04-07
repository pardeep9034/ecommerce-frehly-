import AppError from "../utils/AppError.js";

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions. Access denied.", 403));
    }

    next();
  };
};

export default requireRole;
