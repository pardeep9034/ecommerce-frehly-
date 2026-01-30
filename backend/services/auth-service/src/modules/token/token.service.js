// services/auth-service/src/utils/jwt.js
// const jwt = require('jsonwebtoken');
import jwt from 'jsonwebtoken';
import crypto from "crypto";

class TokenService{
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}
getRefreshTokenExpiry() {
  const days =  process.env.REFRESH_TOKEN_EXPIRES_IN; // or from env
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}


  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

// module.exports = new JWTUtil();
export default new TokenService();