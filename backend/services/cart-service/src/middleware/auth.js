
import ResponseUtil from "../utils/response.js";

import verifyToken from "../utils/verifyToken.js";

const authenticateToken = async (req, res, next) => {

    try {

        /* ================= TOKEN EXTRACTION ================= */
        if (req.headers && req.headers.authorization) {

            

            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];

            if (token) {

                /* ================= TOKEN VERIFICATION ================= */
                const decoded = verifyToken(token);
                if(decoded.role){
                    if(decoded.role === "ADMIN" || "SUPER_ADMIN"||"OPS_STAFF"||"CUSTOMER"){
                        req.user=decoded.user_id;
                        next();
                    }
                    else{
                        return ResponseUtil.unauthorized(
                            res,
                            "Unauthorized"
                        );
                    }
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
