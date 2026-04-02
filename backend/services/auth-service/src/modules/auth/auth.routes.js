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
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

// Public routes
router.post("/signup", asyncHandler(AuthController.signup));
router.post("/signup/verify", asyncHandler(AuthController.verify));
router.post('/register', authenticateToken, validate('register'), asyncHandler(AuthController.register));
router.post('/login', validate('login'), asyncHandler(AuthController.login));
router.post('/refresh-token', asyncHandler(AuthController.refreshToken));
router.post('/forgot-password', validate('forgotPassword'), asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', validate('resetPassword'), asyncHandler(AuthController.resetPassword));
router.post("/otp/resend", asyncHandler(otpController.resendOtp));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(AuthController.getProfile));
router.post('/logout', authenticateToken, asyncHandler(AuthController.logout));

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