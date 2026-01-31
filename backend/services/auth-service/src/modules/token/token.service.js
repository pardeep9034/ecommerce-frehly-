import jwt from "jsonwebtoken";
import crypto from "crypto";

class TokenService {

    /* ================= ACCESS TOKEN ================= */

    generateAccessToken(payload) {

        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "15m"
            }
        );
    }

    verifyAccessToken(token) {

        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error("Invalid or expired access token");
        }

    }

    decodeAccessToken(token) {
        return jwt.decode(token);
    }

    /* ================= REFRESH TOKEN ================= */

    generateRefreshToken() {
        return crypto.randomBytes(64).toString("hex");
    }

    hashRefreshToken(refreshToken) {

        return crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
    }

    getRefreshTokenExpiry() {

        const days = parseInt(
            process.env.REFRESH_TOKEN_EXPIRES_IN || "7",
            10
        );

        return new Date(
            Date.now() + days * 24 * 60 * 60 * 1000
        );
    }

}

export default new TokenService();
