import { db } from "../../models/index.js";

import JWTUtil from "../../utils/jwt.js";

import crypto from "crypto";
import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  decodeOtp,
} from "../../helpers/otp.js";
import UserRepository from "../user/user.repository.js";
import OtpService from "../otp/otp.service.js";
import AuthValidation from "./auth.validation.js";
import TokenService from "../token/token.service.js";



class AuthService {
async signup(data) {

    try {

        /* ================= VALIDATION ================= */
        const validationResult = AuthValidation.validateSignup(data);

        if (validationResult.valid === true) {

            const { phone } = validationResult.sanitizedData;

            /* ================= USER CHECK ================= */
            const existingUser = await UserRepository.findByPhone(phone);

            if (!existingUser) {

                const otpPayload = OtpService.createSignupOtp();

                const user = await UserRepository.create({
                    phone,
                    otp_hash: otpPayload.hash,
                    otp_type: "signup",
                    otp_expiry: otpPayload.expiry,
                    otp_send_count: 1,
                    last_otp_sent_at: new Date()
                });

                if (user) {

                    return {
                        success: true,
                        statusCode: 201,
                        message: "Signup successful. OTP sent.",
                        data: {
                            user_id: user.id,
                            otp: otpPayload.otp // dev only
                        }
                    };

                } else {
                    return {
                        success: false,
                        statusCode: 500,
                        message: "User creation failed"
                    };
                }

            } else {
                return {
                    success: false,
                    statusCode: 409,
                    message: "User already exists"
                };
            }

        } else {
            return {
                success: false,
                statusCode: 400,
                message: validationResult.message
            };
        }

    } catch (error) {
        return {
            success: false,
            statusCode: 500,
            message: "Signup failed"
        };
    }

}



async verify(data) {

    try {

        /* ================= VALIDATION ================= */
        const validationResult = AuthValidation.validateVerifyOtp(data);

        if (validationResult.valid === true) {

            const { phone, otp } = validationResult.sanitizedData;

            /* ================= USER CHECK ================= */
            const user = await UserRepository.findByPhone(phone);

            if (user) {

                if (user.otp_type === "signup") {

                    /* ================= OTP EXPIRY CHECK ================= */
                    if (user.otp_expiry && new Date(user.otp_expiry) > new Date()) {

                        /* ================= OTP MATCH ================= */
                        const isOtpValid = OtpService.compareOtp(
                            otp,
                            user.otp_hash
                        );

                        if (isOtpValid === true) {

                            /* ================= USER UPDATE ================= */
                            await UserRepository.updateById(user.id, {
                                is_verified: true,
                                otp_hash: null,
                                otp_type: null,
                                otp_expiry: null,
                                otp_send_count: 0
                            });

                            /* ================= TOKEN ================= */
                            const token = TokenService.generateAccessToken({
                                user_id: user.id,
                                phone: user.phone
                            });

                            return {
                                success: true,
                                statusCode: 200,
                                message: "OTP verified successfully",
                                data: {
                                    token
                                }
                            };

                        } else {
                            return {
                                success: false,
                                statusCode: 400,
                                message: "Invalid OTP"
                            };
                        }

                    } else {
                        return {
                            success: false,
                            statusCode: 400,
                            message: "OTP expired"
                        };
                    }

                } else {
                    return {
                        success: false,
                        statusCode: 400,
                        message: "Invalid OTP type"
                    };
                }

            } else {
                return {
                    success: false,
                    statusCode: 404,
                    message: "User not found"
                };
            }

        } else {
            return {
                success: false,
                statusCode: 400,
                message: validationResult.message
            };
        }

    } catch (error) {
        return {
            success: false,
            statusCode: 500,
            message: "OTP verification failed"
        };
    }

}



  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Create user
      const user = await db.User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        emailVerificationToken: crypto.randomBytes(32).toString("hex"),
      });

      // Generate tokens
      const token = JWTUtil.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = JWTUtil.generateRefreshToken({
        id: user.id,
      });

      return {
        user,
        token,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user
      const user = await db.User.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw new Error(
          "Account is temporarily locked due to too many failed login attempts"
        );
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        // Increment login attempts
        await user.increment("loginAttempts");

        // Lock account if too many attempts
        if (
          user.loginAttempts + 1 >=
          parseInt(process.env.MAX_LOGIN_ATTEMPTS)
        ) {
          const lockTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
          await user.update({ lockUntil: lockTime });
        }

        throw new Error("Invalid email or password");
      }

      // Reset login attempts and update last login
      await user.update({
        loginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
      });

      // Generate tokens
      const token = JWTUtil.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = JWTUtil.generateRefreshToken({
        id: user.id,
      });

      return {
        user,
        token,
        refreshToken,
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
        throw new Error("Invalid refresh token");
      }

      const newToken = JWTUtil.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
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
        return {
          message: "If email exists, password reset link has been sent",
        };
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // TODO: Send email with reset link
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      return { message: "Password reset link has been sent to your email" };
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
            [db.Sequelize.Op.gt]: new Date(),
          },
        },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      await user.update({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      return { message: "Password has been reset successfully" };
    } catch (error) {
      throw error;
    }
  }
}

// module.exports = new AuthService();
export default new AuthService();
