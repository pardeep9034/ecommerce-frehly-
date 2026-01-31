import initializeModels from "../../models/index.js";

import JWTUtil from "../../utils/jwt.js";

import crypto from "crypto";

import UserRepository from "../repository/user.repository.js";
import RefreshTokenRepository from "../repository/refreshToken.repository.js";
import OtpService from "../otp/otp.service.js";
import AuthValidation from "./auth.validation.js";
import TokenService from "../token/token.service.js";

const db = initializeModels();

class AuthService {
  async signup(data) {
    try {
      /* ================= VALIDATION ================= */
      const validationResult = AuthValidation.validateSignup(data);

      if (validationResult.valid === true) {
        const { phone } = validationResult.sanitizedData;
        console.log("Phone number for signup:", phone);

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
            last_otp_sent_at: new Date(),
          });

          if (user) {
            return {
              success: true,
              statusCode: 201,
              message: "Signup successful. OTP sent.",
              data: {
                user_id: user.id,
                otp: otpPayload.otp, // dev only
              },
            };
          } else {
            return {
              success: false,
              statusCode: 500,
              message: "User creation failed",
            };
          }
        } else {
          return {
            success: false,
            statusCode: 409,
            message: "User already exists",
          };
        }
      } else {
        return {
          success: false,
          statusCode: 400,
          message: validationResult.message,
        };
      }
    } catch (error) {
      console.error("SIGNUP ERROR →", error);

      return {
        success: false,
        statusCode: 500,
        message: error.message || "Signup failed",
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
              const isOtpValid = OtpService.compareOtp(otp, user.otp_hash);

              if (isOtpValid === true) {
                /* ================= USER UPDATE ================= */
                await UserRepository.updateById(user.id, {
                  phone_verified: true,
                  otp_hash: null,
                  otp_type: null,
                  otp_expiry: null,
                  otp_send_count: 0,
                });

                /* ================= TOKEN ================= */
                const accessToken = TokenService.generateAccessToken({
                  user_id: user.id,
                  phone: user.phone,
                });
                const refreshToken = TokenService.generateRefreshToken();
                await RefreshTokenRepository.create({
                  user_id: user.id,
                  token_hash: TokenService.hashRefreshToken(refreshToken),
                  expires_at: TokenService.getRefreshTokenExpiry(),
                });

                return {
                  success: true,
                  statusCode: 200,
                  message: "OTP verified successfully",
                  data: {
                    accessToken,
                    refreshToken,
                  },
                };
              } else {
                return {
                  success: false,
                  statusCode: 400,
                  message: "Invalid OTP",
                };
              }
            } else {
              return {
                success: false,
                statusCode: 400,
                message: "OTP expired",
              };
            }
          } else {
            return {
              success: false,
              statusCode: 400,
              message: "Invalid OTP type",
            };
          }
        } else {
          return {
            success: false,
            statusCode: 404,
            message: "User not found",
          };
        }
      } else {
        return {
          success: false,
          statusCode: 400,
          message: validationResult.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: "OTP verification failed",
      };
    }
  }

 async register(userData) {

  /* ================= VALIDATION ================= */
  if (userData) {

    if (userData.phone) {

      /* ================= USER CHECK ================= */
      const existingUser = await UserRepository.findByPhone(userData.phone);

      if (existingUser) {

        /* ================= UPDATE PROFILE (SAFE) ================= */
        if (
          userData.first_name ||
          userData.last_name ||
          userData.email ||
          userData.password
        ) {

          if (userData.first_name) {
            existingUser.first_name = userData.first_name;
          }

          if (userData.last_name) {
            existingUser.last_name = userData.last_name;
          }

          if (userData.email) {
            existingUser.email = userData.email;
          }

          if (userData.password) {
            existingUser.password = userData.password; // ✅ hook will hash
          }

          const savedUser = await existingUser.save(); // 🔥 hooks run here

          return {
            success: true,
            statusCode: 200,
            message: "User profile completed successfully",
            user: savedUser,
          };

        } else {

          return {
            success: false,
            statusCode: 400,
            message: "No data provided to update",
          };
        }

      } else {

        return {
          success: false,
          statusCode: 404,
          message: "User not found",
        };
      }

    } else {

      return {
        success: false,
        statusCode: 400,
        message: "Phone number is required",
      };
    }

  } else {

    return {
      success: false,
      statusCode: 400,
      message: "Invalid request data",
    };
  }
}


async login(phone, password) {

  // Validate input
  if (phone && password) {
    console.log("--",phone,password)

    // Find user by phone
    const user = await UserRepository.findByPhone(phone);
    console.log("--",user);

    if (user) {

      // Check account lock
      if (user.lock_until && user.lock_until > new Date()) {

        return {
          success: false,
          statusCode: 423,
          message: "Account is temporarily locked due to too many failed login attempts",
        };

      } else {

        // Compare password
        const isValidPassword = await user.comparePassword(password);
        console.log("-------",isValidPassword)

        if (isValidPassword) {

          // Reset login attempts
          await user.update({
            login_attempts: 0,
            lock_until: null,
            last_login_at: new Date(),
          });

          // Generate tokens
          const accessToken = TokenService.generateAccessToken({
            user_id: user.id,
            phone: user.phone,
          });

          const refreshToken = TokenService.generateRefreshToken();

          await RefreshTokenRepository.create({
            user_id: user.id,
            token_hash: TokenService.hashRefreshToken(refreshToken),
            expires_at: TokenService.getRefreshTokenExpiry(),
          });

          return {
            success: true,
            statusCode: 200,
            message: "Login successful",
            data: {
              accessToken,
              refreshToken,
            },
          };

        } else {

          // Invalid password → increment attempts
          const attempts = user.login_attempts + 1;

          if (attempts >= Number(process.env.MAX_LOGIN_ATTEMPTS)) {

            const lockUntil = new Date(
              Date.now() + 2 * 60 * 60 * 1000 // 2 hours
            );

            await user.update({
              login_attempts: attempts,
              lock_until: lockUntil,
            });

          } else {

            await user.update({
              login_attempts: attempts,
            });

          }

          return {
            success: false,
            statusCode: 401,
            message: "Invalid phone or password",
          };
        }
      }

    } else {

      return {
        success: false,
        statusCode: 401,
        message: "Invalid phone or password",
      };
    }

  } else {

    return {
      success: false,
      statusCode: 400,
      message: "Phone and password are required",
    };
  }
}



async refreshToken(refreshToken) {

  /* ================= VALIDATION ================= */
  if (refreshToken) {

    /* ================= VERIFY TOKEN ================= */
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    if (decoded && decoded.user_id) {

      /* ================= USER CHECK ================= */
      const user = await UserRepository.findById(decoded.user_id);

      if (user && user.is_active) {

        /* ================= TOKEN CHECK ================= */
        const tokenHash = TokenService.hashRefreshToken(refreshToken);

        const storedToken = await RefreshTokenRepository.findValidToken({
          user_id: user.id,
          token_hash: tokenHash,
        });

        if (storedToken) {

          /* ================= ROTATE TOKENS ================= */
          const newAccessToken = TokenService.generateAccessToken({
            user_id: user.id,
            phone: user.phone,
          });

          const newRefreshToken = TokenService.generateRefreshToken();

          /* ================= UPDATE REFRESH TOKEN ================= */
          await RefreshTokenRepository.updateById(storedToken.id, {
            token_hash: TokenService.hashRefreshToken(newRefreshToken),
            expires_at: TokenService.getRefreshTokenExpiry(),
          });

          return {
            success: true,
            statusCode: 200,
            message: "Token refreshed successfully",
            data: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            },
          };

        } else {

          return {
            success: false,
            statusCode: 401,
            message: "Invalid or expired refresh token",
          };
        }

      } else {

        return {
          success: false,
          statusCode: 401,
          message: "User not found or inactive",
        };
      }

    } else {

      return {
        success: false,
        statusCode: 401,
        message: "Invalid refresh token",
      };
    }

  } else {

    return {
      success: false,
      statusCode: 400,
      message: "Refresh token is required",
    };
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
