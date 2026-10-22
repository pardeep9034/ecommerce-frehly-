
import crypto from "node:crypto";
import ResponseUtil from "../utils/response.js";
import { env } from "../config/env.js";
import { ADMIN_ROLES } from "../constants/roles.js";

import verifyToken from "../utils/verifyToken.js";
import logger from "../utils/Logger.js";

const authenticateToken = async (req, res, next) => {

    try {

        /* ================= TOKEN EXTRACTION ================= */
        if (req.headers && req.headers.authorization) {

            

            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];

            if (token) {

                /* ================= TOKEN VERIFICATION ================= */
                // Any signed-in role; routes that need staff add requireRole(ADMIN_ROLES) or use staffOrService.
                const decoded = verifyToken(token);
                if(decoded.role){
                    req.user=decoded;
                    next();
                }
                else{
                    return ResponseUtil.unauthorized(
                        res,
                        "Unauthorized"
                    );
                }

              
            

            } else {

                return ResponseUtil.unauthorized(
                    res,
                    "Access token missing"
                );

            }

        } else {

            return ResponseUtil.unauthorized(
                res,
                "Authorization header missing"
            );

        }

    } catch (error) {

        logger.error("AUTH MIDDLEWARE ERROR →", { message: error.message, stack: error.stack });

        return ResponseUtil.unauthorized(
            res,
            "Invalid or expired access token"
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

// Hashing first gives timingSafeEqual two equal-length buffers whatever the caller sends.
const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();

// Staff (ADMIN_ROLES) with a token, or a sibling service (order-service) holding INTERNAL_API_KEY.
// Without a configured key only staff get in.
const staffOrService = (req, res, next) => {
    const sent = req.headers["x-internal-key"];
    if (sent && env.INTERNAL_API_KEY && crypto.timingSafeEqual(digest(sent), digest(env.INTERNAL_API_KEY))) {
        req.service = true;
        return next();
    }
    return authenticateToken(req, res, () => requireRole(ADMIN_ROLES)(req, res, next));
};

export { authenticateToken, requireRole, staffOrService };
