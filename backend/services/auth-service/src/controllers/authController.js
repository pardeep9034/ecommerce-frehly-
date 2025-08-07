// services/auth-service/src/controllers/authController.js
const AuthService = require('../services/authService');
const ResponseUtil = require('../utils/response');

class AuthController {
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      
      ResponseUtil.success(res, {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }, 'User registered successfully', 201);
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.message.includes('already exists')) {
        return ResponseUtil.error(res, error.message, 400);
      }
      
      ResponseUtil.error(res, 'Registration failed');
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      ResponseUtil.success(res, {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('locked')) {
        return ResponseUtil.error(res, error.message, 401);
      }
      
      ResponseUtil.error(res, 'Login failed');
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      
      ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      console.error('Refresh token error:', error);
      ResponseUtil.error(res, 'Invalid refresh token', 401);
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      
      ResponseUtil.success(res, null, result.message);
    } catch (error) {
      console.error('Forgot password error:', error);
      ResponseUtil.error(res, 'Failed to process forgot password request');
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      
      ResponseUtil.success(res, null, result.message);
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return ResponseUtil.error(res, error.message, 400);
      }
      
      ResponseUtil.error(res, 'Failed to reset password');
    }
  }

  async getProfile(req, res) {
    try {
      ResponseUtil.success(res, req.user, 'Profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      ResponseUtil.error(res, 'Failed to get profile');
    }
  }

  async logout(req, res) {
    try {
      // In a real app, you might want to blacklist the token
      ResponseUtil.success(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      ResponseUtil.error(res, 'Logout failed');
    }
  }
}

module.exports = new AuthController();