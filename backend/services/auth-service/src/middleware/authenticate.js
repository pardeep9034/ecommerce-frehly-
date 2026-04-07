import TokenService from "../modules/token/token.service.js";
import UserRepository from "../modules/repository/user.repository.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/Logger.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authentication required. Token missing.", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = TokenService.verifyAccessToken(token);

    if (!decoded || !decoded.user_id) {
      return next(new AppError("Invalid or expired token.", 401));
    }

    const user = await UserRepository.findById(decoded.user_id);
    if (!user) {
      return next(new AppError("User no longer exists.", 401));
    }

    if (!user.is_active) {
      return next(new AppError("User account is deactivated.", 403));
    }

    req.user = user;
    req.deviceId = req.headers['x-device-id'] || 'unknown';
    
    next();
  } catch (error) {
    logger.error(`❌ Authentication error: ${error.message}`);
    next(new AppError("Authentication failed.", 401));
  }
};

export default authenticate;
