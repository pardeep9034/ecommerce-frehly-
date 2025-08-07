// services/auth-service/src/routes/auth.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validate('register'), AuthController.register);
router.post('/login', validate('login'), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', validate('forgotPassword'), AuthController.forgotPassword);
router.post('/reset-password', validate('resetPassword'), AuthController.resetPassword);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/logout', authenticateToken, AuthController.logout);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;