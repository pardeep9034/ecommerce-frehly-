
import ResponseUtil from "../utils/response.js";

import verifyToken from "../utils/verifyToken.js";
import logger from "../utils/Logger.js";
import { ROLES } from "../constants/roles.js";
import DeliveryPartnerRepository from "../modules/repository/deliveryPartner.repository.js";

const authenticateToken = async (req, res, next) => {

    try {

        /* ================= TOKEN EXTRACTION ================= */
        if (req.headers && req.headers.authorization) {

            

            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];

            if (token) {

                /* ================= TOKEN VERIFICATION ================= */
                const decoded = verifyToken(token);
                // Front door: any valid token with a role gets in. Which role may use a route is the
                // second door, requireRole(), on that route. A route with only this one is open to every role.
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

// Partner-app routes, after authenticateToken: the caller is a DELIVERY_PARTNER with an ACTIVE partner row. req.partner is
// that row, found from the token, so a "me" route never takes a partner id from the client.
const requireActivePartner = async (req, res, next) => {
    if (req.user?.role !== ROLES.DELIVERY_PARTNER) {
        return ResponseUtil.forbidden(res, "Insufficient permissions");
    }
    const partner = await DeliveryPartnerRepository.findByUserIdWithContact(req.user.user_id);
    if (!partner || partner.status !== "ACTIVE") {
        return ResponseUtil.forbidden(res, "No active delivery partner account");
    }
    req.partner = partner;
    return next();
};

export { authenticateToken, requireRole, requireActivePartner };
