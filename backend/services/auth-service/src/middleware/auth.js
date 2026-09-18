import TokenService from "../modules/token/token.service.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/Logger.js";
import userRepository from "../modules/repository/user.repository.js";

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AppError("Authorization header missing or malformed", 401));
        }

        const token = authHeader.split(" ")[1];
        if (!token || token === "undefined" || token === "null") {
            return next(new AppError("Invalid or malformed access token provided", 401));
        }

        let decoded;
        try {
            decoded = TokenService.verifyAccessToken(token);
        } catch (error) {
            logger.warn(`Auth Warning: ${error.message} | Path: ${req.originalUrl}`);
            return next(new AppError(error.message, 401));
        }

        if (!decoded || !decoded.user_id) {
            return next(new AppError("Invalid access token payload", 401));
        }

        const user = await userRepository.findById(decoded.user_id);

        if (!user) {
            return next(new AppError("User not found", 401));
        }

        if (!user.dataValues.is_active) {
            return next(new AppError("Account is deactivated", 403));
        }

        req.user = user.dataValues;
        req.deviceId = req.headers["x-device-id"] || "unknown";

        next();
    } catch (error) {
        logger.error(`AUTH MIDDLEWARE ERROR: ${error.message}`, { stack: error.stack });
        next(new AppError("Authentication service internal error", 500));
    }
};

export { authenticateToken };
