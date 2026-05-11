import TokenService from "../modules/token/token.service.js";
import ResponseUtil from "../utils/response.js";
import logger from "../utils/Logger.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ResponseUtil.unauthorized(res, "Authentication required. Token missing.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = TokenService.verifyAccessToken(token);

    if (!decoded || !decoded.user_id) {
      return ResponseUtil.unauthorized(res, "Invalid or expired token.");
    }

    // Pass the decoded user info to the request
    req.user = decoded;
    req.deviceId = req.headers['x-device-id'] || 'unknown';
    
    next();
  } catch (error) {
    logger.error(`❌ Authentication error: ${error.message}`);
    return ResponseUtil.unauthorized(res, error.message);
  }
};

export default authenticate;
