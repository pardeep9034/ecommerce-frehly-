import TokenService from "../modules/token/token.service.js";
import ResponseUtil from "../utils/response.js";
import initializeModels from "../models/index.js";
import logger from "../utils/Logger.js";
import userRepository from "../modules/repository/user.repository.js";

const authenticateToken = async (req, res, next) => {

    try {

        /* ================= TOKEN EXTRACTION ================= */
        if (req.headers && req.headers.authorization) {

            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];

            /* ================= TOKEN VALIDATION ================= */
            // Check if token exists and is not a placeholder string like "undefined" or "null"
            if (!token || token === "undefined" || token === "null" || token.length < 10) {
                return ResponseUtil.unauthorized(
                    res,
                    "Invalid or malformed access token provided"
                );
            }

                /* ================= TOKEN VERIFICATION ================= */
                const decoded = TokenService.verifyAccessToken(token);
                console.log("Decoded token payload:", decoded);

                if (decoded && decoded.user_id) {

                    /* ================= USER CHECK ================= */
                    const db = await initializeModels();

                    const user = await userRepository.findById(decoded.user_id);

                    if (user) {

                        if (user.is_active === true) {

                            req.user = user;
                            return next();

                        } else {

                            return ResponseUtil.forbidden(
                                res,
                                "Account is deactivated"
                            );

                        }

                    } else {

                        return ResponseUtil.unauthorized(
                            res,
                            "User not found"
                        );

                    }

                } else {

                    return ResponseUtil.unauthorized(
                        res,
                        "Invalid access token payload"
                    );

                }

            // Case handled by the string validation above
            return ResponseUtil.unauthorized(res, "Access token missing");

        } else {

            return ResponseUtil.unauthorized(
                res,
                "Authorization header missing"
            );

        }

    } catch (error) {
        // Log standard JWT errors as warnings, don't trigger FATAL ERROR logs for client mistakes
        if (error.message.includes("Token verification failed")) {
            logger.warn(`Auth Warning: ${error.message} | Path: ${req.originalUrl}`);
            return ResponseUtil.unauthorized(res, error.message);
        }

        // Only log truly unexpected errors as errors
        logger.error(`AUTH MIDDLEWARE ERROR: ${error.message}`, { stack: error.stack });

        // For other internal errors (DB, etc.), return 500
        return ResponseUtil.error(
            res,
            "Authentication service internal error",
            500,
            process.env.NODE_ENV === 'development' ? error.message : null
        );

    }

};

const requireRole = (roles) => {

    return (req, res, next) => {

        /* ================= AUTH CHECK ================= */
        if (req.user) {

            if (roles && Array.isArray(roles)) {

                if (roles.includes(req.user.role)) {

                    return next();

                } else {

                    return ResponseUtil.forbidden(
                        res,
                        "Insufficient permissions"
                    );

                }

            } else {

                return ResponseUtil.forbidden(
                    res,
                    "Invalid role configuration"
                );

            }

        } else {

            return ResponseUtil.unauthorized(
                res,
                "Authentication required"
            );

        }

    };

};

export { authenticateToken, requireRole };
