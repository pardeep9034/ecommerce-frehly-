// services/auth-service/src/services/authService.js
const { db } = require('../models');
const JWTUtil = require('../utils/jwt');
const crypto = require('crypto');

class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create user
      const user = await db.User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        emailVerificationToken: crypto.randomBytes(32).toString('hex')
      });

      // Generate tokens
      const token = JWTUtil.generateToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      const refreshToken = JWTUtil.generateRefreshToken({ 
        id: user.id 
      });

      return {
        user,
        token,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user
      const user = await db.User.findOne({
        where: { email }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      
      if (!isValidPassword) {
        // Increment login attempts
        await user.increment('loginAttempts');
        
        // Lock account if too many attempts
        if (user.loginAttempts + 1 >= parseInt(process.env.MAX_LOGIN_ATTEMPTS)) {
          const lockTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
          await user.update({ lockUntil: lockTime });
        }
        
        throw new Error('Invalid email or password');
      }

      // Reset login attempts and update last login
      await user.update({
        loginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date()
      });

      // Generate tokens
      const token = JWTUtil.generateToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      const refreshToken = JWTUtil.generateRefreshToken({ 
        id: user.id 
      });

      return {
        user,
        token,
        refreshToken
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JWTUtil.verifyToken(refreshToken);
      const user = await db.User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const newToken = JWTUtil.generateToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });

      return { token: newToken };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const user = await db.User.findOne({ where: { email } });
      
      if (!user) {
        // Don't reveal if email exists or not
        return { message: 'If email exists, password reset link has been sent' };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });

      // TODO: Send email with reset link
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      return { message: 'Password reset link has been sent to your email' };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const user = await db.User.findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      await user.update({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();