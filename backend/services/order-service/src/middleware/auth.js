import verifyToken from "../utils/verifyToken.js";
import ResponseUtil from "../utils/response.js";

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

export default authenticateToken;
