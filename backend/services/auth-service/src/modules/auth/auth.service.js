import initializeModels from "../../models/index.js";

import JWTUtil from "../../utils/jwt.js";

import crypto from "crypto";
import jwt from "jsonwebtoken";

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
          const otpPayload = OtpService.createOtp()

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

  /* ================= VALIDATION ================= */
  const validationResult = AuthValidation.validateVerifyOtp(data);

  if (validationResult.valid === true) {

    const { phone, otp } = validationResult.sanitizedData;

    /* ================= USER CHECK ================= */
    const user = await UserRepository.findByPhone(phone);

    if (user) {

      /* ================= OTP TYPE CHECK ================= */
      if (user.otp_type) {

        /* ================= EXPIRY CHECK ================= */
        if (user.otp_expiry && new Date(user.otp_expiry) > new Date()) {

          /* ================= OTP MATCH ================= */
          const isOtpValid = OtpService.compareOtp(otp, user.otp_hash);

          if (isOtpValid === true) {

            /* ================= CLEAR OTP ================= */
            await user.update({
              otp_hash: null,
              otp_expiry: null,
              otp_attempts: 0,
            });

            /* ================= FLOW HANDLING ================= */
            if (user.otp_type === "signup") {

              await user.update({
                phone_verified: true,
                otp_type: null,
                otp_send_count: 0,
              });

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
                message: "Signup OTP verified successfully",
                data: { accessToken },
              };
            }

            if (user.otp_type === "forgot_password") {
              const resetToken = jwt.sign(
    {
      user_id: user.id,
      purpose: "reset_password",
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

              await user.update({
                otp_type: null,
              });

              return {
                success: true,
                statusCode: 200,
                message: "OTP verified. You may reset your password",
                data:{
                  resetToken
                }
              };
            }

            return {
              success: false,
              statusCode: 400,
              message: "Unsupported OTP type",
            };

          } else {

            await user.increment("otp_attempts");

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
          message: "No OTP request found",
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
            statusCode: 400,
            message: "Invalid phone or password",
          };
        }
      }

    } else {

      return {
        success: false,
        statusCode: 400,
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
async getProfile(userId) {
  if(userId){
    const user = await UserRepository.findById(userId);

    if (user) {
      return {
        success: true,
        statusCode: 200,
        message: "Profile retrieved successfully",
        data: {
          id: user.id,
          phone: user.phone,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        },
      };
    }
  } else {
    return {
      success: false,
      statusCode: 400,
      message: "User ID is required",
    };
  }

}



async refreshToken(refreshToken) {

  /* ================= VALIDATION ================= */
  if (refreshToken) {

    /* ================= HASH TOKEN ================= */
    const tokenHash = TokenService.hashRefreshToken(refreshToken);

    /* ================= FIND STORED TOKEN ================= */
    const storedToken = await RefreshTokenRepository.findValidByTokenHash(
      tokenHash
    );

    if (storedToken) {

      /* ================= USER CHECK ================= */
      const user = await UserRepository.findById(storedToken.user_id);

      if (user && user.is_active) {

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
           
          },
        };

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
        message: "Invalid or expired refresh token",
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



  async forgotPassword(phone) {

  /* ================= VALIDATION ================= */
  if (phone) {

    /* ================= USER CHECK ================= */
    const user = await UserRepository.findByPhone(phone);
    const otp = OtpService.createOtp()

    if (user) {

      /* ================= GENERATE OTP ================= */
      // const otp = OtpService.createOtp()


     

      /* ================= SAVE OTP ================= */
      await user.update({
        otp_hash: otp.hash,
        otp_type: "forgot_password",
        otp_expiry: otp.expiry,
        otp_attempts: 0,
        otp_send_count: user.otp_send_count + 1,
        last_otp_sent_at: new Date(),
      });

      /* ================= SEND OTP (SMS) ================= */
      // await SmsService.sendOtp(user.phone, otp);

    }

    /* ================= GENERIC RESPONSE ================= */
    return {
      success: true,
      otp,
      statusCode: 200,
      message: "If the phone number exists, an OTP has been sent",
    };

  } else {

    return {
      success: false,
      statusCode: 400,
      message: "Phone number is required",
    };
  }
}


 async resetPassword(resetToken, newPassword) {

  /* ================= VALIDATION ================= */
  if (resetToken && newPassword) {

    let decoded;

    /* ================= VERIFY RESET TOKEN ================= */
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return {
        success: false,
        statusCode: 401,
        message: "Invalid or expired reset token",
      };
    }

    /* ================= PURPOSE CHECK ================= */
    if (decoded.purpose !== "reset_password") {

      return {
        success: false,
        statusCode: 403,
        message: "Invalid reset token",
      };
    }

    /* ================= USER CHECK ================= */
    const user = await UserRepository.findById(decoded.user_id);

    if (user) {

      /* ================= PASSWORD UPDATE ================= */
      user.set({
        password: newPassword, // 🔥 hashed via hook
      });

      await user.save();

      /* ================= REVOKE ALL SESSIONS ================= */
      await RefreshTokenRepository.revokeAllByUserId(user.id);

      return {
        success: true,
        statusCode: 200,
        message: "Password reset successfully",
      };

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
      message: "Reset token and new password are required",
    };
  }
}
}

// module.exports = new AuthService();
export default new AuthService();
