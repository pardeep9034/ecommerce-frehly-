import TokenService from "../modules/token/token.service.js";
import ResponseUtil from "../utils/response.js";
import initializeModels from "../models/index.js";

const authenticateToken = async (req, res, next) => {

    try {

        /* ================= TOKEN EXTRACTION ================= */
        if (req.headers && req.headers.authorization) {

            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];

            if (token) {

                /* ================= TOKEN VERIFICATION ================= */
                const decoded = TokenService.verifyAccessToken(token);

                if (decoded && decoded.user_id) {

                    /* ================= USER CHECK ================= */
                    const db = await initializeModels();

                    const user = await db.User.findByPk(decoded.user_id);

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

        console.error("AUTH MIDDLEWARE ERROR →", error);

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

export { authenticateToken, requireRole };
