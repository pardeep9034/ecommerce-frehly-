// services/auth-service/src/routes/auth.js
// const express = require('express');
import express from 'express';
// const AuthController = require('../controllers/authController');
import AuthController from './auth.controller.js';
import otpController from '../otp/otp.controller.js';
// const { validate } = require('../middleware/validation');
import { validate } from '../../middleware/validation.js';
// const { authenticateToken } = require('../middleware/auth');
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Public routes
router.post("/signup",AuthController.signup);
router.post("/signup/verify",AuthController.verify);
router.post('/register',authenticateToken, validate('register'), AuthController.register);
router.post('/login', validate('login'), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', validate('forgotPassword'), AuthController.forgotPassword);
router.post('/reset-password', authenticateToken,validate('resetPassword'), AuthController.resetPassword);
router.post("/otp/resend",otpController.resendOtp)

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

// module.exports = router;
export default router;