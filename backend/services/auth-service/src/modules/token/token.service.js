import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import redisManager from "../../config/redis.js";
import logger from "../../utils/Logger.js";
import { env } from "../../config/env.js";

// Redis key patterns
const BLACKLIST_PREFIX = "auth:blacklist:";
const SESSION_PREFIX = "auth:session:";

class TokenService {

  /* ================= ACCESS TOKEN ================= */

  generateAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION || "15m",
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  decodeAccessToken(token) {
    return jwt.decode(token);
  }

  /* ================= REFRESH TOKEN ================= */

  generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
  }

  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // Alias for backward compatibility
  hashRefreshToken(refreshToken) {
    return this.hashToken(refreshToken);
  }

  generateFamilyId() {
    return uuidv4();
  }

  getRefreshTokenExpiry() {
    const days = parseInt(env.JWT_REFRESH_EXPIRATION || "7", 10);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /* ================= REDIS TOKEN BLACKLISTING ================= */

  async blacklistAccessToken(token) {
    try {
      const decoded = this.decodeAccessToken(token);
      if (!decoded?.exp) return;

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) return; // Already expired

      const redis = redisManager.getClient();
      const key = `${BLACKLIST_PREFIX}${this.hashToken(token)}`;
      await redis.setex(key, ttl, "1");
      logger.info(`✅ Token blacklisted (TTL: ${ttl}s)`);
    } catch (err) {
      logger.error(`❌ Failed to blacklist token: ${err.message}`);
    }
  }

  async isTokenBlacklisted(token) {
    try {
      const redis = redisManager.getClient();
      const key = `${BLACKLIST_PREFIX}${this.hashToken(token)}`;
      const result = await redis.get(key);
      return !!result;
    } catch (err) {
      logger.error(`❌ Failed to check token blacklist: ${err.message}`);
      return false; // Fail open: if Redis is down, let the token pass
    }
  }

  /* ================= REDIS SESSION MANAGEMENT ================= */

  async cacheUserSession(userId, accessToken, expiresIn = 900) {
    try {
      const redis = redisManager.getClient();
      const key = `${SESSION_PREFIX}${userId}`;
      await redis.setex(key, expiresIn, accessToken);
    } catch (err) {
      logger.error(`❌ Failed to cache user session: ${err.message}`);
    }
  }

  async invalidateUserSession(userId) {
    try {
      const redis = redisManager.getClient();
      const key = `${SESSION_PREFIX}${userId}`;
      await redis.del(key);
    } catch (err) {
      logger.error(`❌ Failed to invalidate user session: ${err.message}`);
    }
  }
}

export default new TokenService();
