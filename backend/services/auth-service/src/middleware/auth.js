// services/auth-service/src/middleware/auth.js
// const JWTUtil = require('../utils/jwt');
import JWTUtil from '../utils/jwt.js';
// const ResponseUtil = require('../utils/response');
import ResponseUtil from '../utils/response.js';
// const { db } = require('../models');
import initializeModels  from '../models/index.js';
const db = initializeModels();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return ResponseUtil.unauthorized(res, 'Access token required');
    }

    const decoded = JWTUtil.verifyToken(token);
    
    // Check if user still exists
    const user = await db.User.findByPk(decoded.id);
    if (!user) {
      return ResponseUtil.unauthorized(res, 'User not found');
    }

    if (!user.isActive) {
      return ResponseUtil.forbidden(res, 'Account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    return ResponseUtil.unauthorized(res, 'Invalid or expired token');
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ResponseUtil.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

export { authenticateToken, requireRole };