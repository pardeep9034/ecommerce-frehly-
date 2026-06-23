import UserRepository from "../repository/user.repository.js";
import RefreshTokenRepository from "../repository/refreshToken.repository.js";
import OtpRepository from "../repository/otp.repository.js";
import AuditRepository from "../repository/audit.repository.js";
import OtpService from "../otp/otp.service.js";
import TokenService from "../token/token.service.js";
import kafkaManager from "../../config/kafka.js";
import initializeModels from "../../models/index.js";
import logger from "../../utils/Logger.js";
import AppError from "../../utils/AppError.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { emitEvent, TOPICS } from "../../events/producer.js";
import redisManager from "../../config/redis.js";

class AuthService {

  /* ================= SIGNUP ================= */

  async signup(data) {
    const { phone } = data;

    if (!phone) {
      throw new AppError("Phone number is required", 400);
    }

    const existingUser = await UserRepository.findByPhone(phone);
    const otpPayload = OtpService.createOtp();

    if (existingUser) {
      if (existingUser.phone_verified) {
        throw new AppError(
          "User already exists with this phone number",
          409
        );
      }

      const lastOtp = await OtpRepository.findLatestOtp(
        existingUser.id,
        "SIGNUP"
      );
      
      if (
        lastOtp &&
        (new Date() - new Date(lastOtp.created_at)) < 30000
      ) {
        throw new AppError(
          "Please wait before requesting another OTP",
          429
        );
      }

      await OtpRepository.revokePendingOtps(
        existingUser.id,
        "SIGNUP"
      );

      await OtpRepository.create({
        user_id: existingUser.id,
        code_hash: otpPayload.hash,
        type: "SIGNUP",
        channel: "SMS",
        sent_to: phone,
        expires_at: otpPayload.expiry
      });

      try {
        const redisClient = redisManager.getClient();

        if (redisClient.isReady) {
          await redisClient.set(
            `otp:${existingUser.id}`,
            JSON.stringify({
              code_hash: otpPayload.hash,
              type: "SIGNUP",
              sent_to: phone,
              expires_at: otpPayload.expiry
            }),
            "EX",
            300
          );
        }
        else {
          logger.warn("Redis unavailable. Using DB only.");

        }

      } catch (error) {
        console.log(error);
      }

      try {

        await emitEvent(
          TOPICS.OTP_REQUESTED,
          {
            userId: existingUser.id,
            phone,
            type: "SIGNUP",
            otp: otpPayload.otp
          },
          existingUser.id.toString()
        );

      } catch (error) {
        console.log(error);
      }

      return {
        success: true,
        statusCode: 200,
        message: "OTP resent successfully.",
        data: {
          user_id: existingUser.id,
          otp: env.NODE_ENV === "development" ? otpPayload.otp : null,
          expires_at: env.NODE_ENV === "development" ? otpPayload.expiry : null
        }
      };
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {

      const user = await UserRepository.create(
        {
          phone
        },
        {
          transaction
        }
      );

      await OtpRepository.create(
        {
          user_id: user.id,
          code_hash: otpPayload.hash,
          type: "SIGNUP",
          channel: "SMS",
          sent_to: phone,
          expires_at: otpPayload.expiry
        },
        {
          transaction
        }
      );

      await transaction.commit();

      try {
        await emitEvent(
          TOPICS.OTP_REQUESTED,
          {
            userId: user.id,
            phone,
            type: "SIGNUP",
            otp: otpPayload.otp
          },
          user.id.toString()
        );

      } catch (error) {
        console.log(error);
      }

      try {
        const redisClient = redisManager.getClient();
        if (redisClient.isReady) {
          await redisClient.set(
            `otp:${user.id}`,
            JSON.stringify({
              code_hash: otpPayload.hash,
              type: "SIGNUP",
              sent_to: phone,
              expires_at: otpPayload.expiry
            }),
            "EX",
            300
          );
        }
        else {
          logger.warn("Redis unavailable. Using DB only.");
        }

      } catch (error) {
        console.log(error);
      }

      return {
        success: true,
        statusCode: 201,
        message: "Signup successful. OTP sent.",
        data: {
          user_id: user.id,
          otp: env.NODE_ENV === "development" ? otpPayload.otp : null,
          expires_at: env.NODE_ENV === "development" ? otpPayload.expiry : null
        }
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


  /* ================= VERIFY OTP ================= */

  async verify(data) {
    const { phone, otp, type } = data;
    if (!phone || !otp) throw new AppError("Phone and OTP are required", 400);

    const user = await UserRepository.findByPhone(phone);
    if (!user) throw new AppError("User not found", 404);

    const requestedType = type || (user.otp_type === "signup" ? "SIGNUP" : "FORGOT_PASSWORD");
    const otpRecord = await OtpRepository.findLatestOtp(user.id, requestedType);

    if (!otpRecord) throw new AppError("No OTP request found", 400);

    if (otpRecord.used_at) {
      throw new AppError("OTP has already been used", 400);
    }

    if (!otpRecord.expires_at || new Date(otpRecord.expires_at) < new Date()) {
      await OtpRepository.revokePendingOtps(user.id, requestedType);
      throw new AppError("OTP has expired", 400);
    }

    const isValid = OtpService.compareOtp(otp, otpRecord.code_hash);

    try {
      const redisClient = redisManager.getClient();
     if(redisClient.isReady){
       const redisTest = await redisClient.get(`otp:${user.id}`);
      if (redisTest) {
        logger.info(`✅ Redis Hit! OTP found for user ${user.id}`);
      } else {
        logger.warn(`⚠️ Redis Miss! OTP not found for user ${user.id}`);
      }
     }
     else{
      logger.warn("Redis unavailable. Using DB only.");
     }
    } catch (err) {
      logger.warn(`Redis GET error: ${err.message}`);
    }
    if (!isValid) {
      await OtpRepository.incrementAttempts(otpRecord.id);
      throw new AppError("Invalid OTP", 400);
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();

    try {
      // Mark OTP record as used
      if (otpRecord) await OtpRepository.markUsed(otpRecord.id, { transaction });

      if (requestedType === "SIGNUP") {
        
        await user.update({
          phone_verified: true,
        }, { transaction });

        // const accessToken = TokenService.generateAccessToken({
        //   user_id: user.id,
        //   phone: user.phone,
        //   role: user.role,
        // });

        // const rawRefresh = TokenService.generateRefreshToken();
        // const familyId = TokenService.generateFamilyId();

        // await RefreshTokenRepository.create({
        //   user_id: user.id,
        //   token_hash: TokenService.hashRefreshToken(rawRefresh),
        //   expires_at: TokenService.getRefreshTokenExpiry(),
        //   family_id: familyId,
        // }, { transaction });
        const onBoardToken=jwt.sign(
          {
            user_id: user.id,
            phone: user.phone,
            role: user.role,
          },
          env.JWT_SECRET,
          { expiresIn: "10m" }
        );

        await transaction.commit();

        // Emit Kafka event
        kafkaManager.sendEvent("auth.events", {
          type: "USER_REGISTERED",
          userId: user.id,
          phone: user.phone,
          timestamp: new Date().toISOString(),
        }).catch(err => logger.error(`Kafka error: ${err.message}`));

        logger.info(`✅ User ${user.id} verified and registered`);

        return {
          success: true,
          statusCode: 200,
          message: "OTP verified successfully",
          data: { onBoardToken },
        };
      }

      if (user.otp_type === "forgot_password" || requestedType === "FORGOT_PASSWORD") {
        const resetToken = jwt.sign(
          { user_id: user.id, purpose: "reset_password" },
          env.JWT_SECRET,
          { expiresIn: "10m" }
        );

        await user.update({ otp_type: null }, { transaction });
        await transaction.commit();

        return {
          success: true,
          statusCode: 200,
          message: "OTP verified. You may reset your password.",
          data: { resetToken },
        };
      }

      await transaction.rollback();
      throw new AppError("Unsupported OTP type", 400);

    } catch (error) {
      await transaction.rollback();
      logger.error(`❌ Verify OTP error: ${error.message}`);
      throw error;
    }
  }

  /* ================= COMPLETE REGISTRATION ================= */

  async register(req,userData) {
    const { phone, first_name, last_name, email, password } = userData;
    if (!phone) throw new AppError("Phone number is required", 400);

    const existingUser = await UserRepository.findByPhone(phone);
    if(existingUser.profile_complete){
      throw new AppError("profile is completed",400);
    }
    if (!existingUser) throw new AppError("User not found", 404);
console.log("existingUser",existingUser)
    if (!first_name && !password) {
      throw new AppError("No data provided to update", 400);
    }



    if (first_name) existingUser.first_name = first_name;
    if (last_name) existingUser.last_name = last_name;
    if (email) existingUser.email = email;
    if (password) existingUser.password_hash = password;
    existingUser.profile_complete = true;
 
  const db=await initializeModels();
  const transaction=db.sequelize.transaction()
   
     const savedUser = await existingUser.save(transaction);

    
        const accessToken = TokenService.generateAccessToken({
          user_id: existingUser.user_id,
          phone: existingUser.phone,
          role: existingUser.role,
        });

        const rawRefresh = TokenService.generateRefreshToken();
        const familyId = TokenService.generateFamilyId();
        const userAgent=req.headers["user_agent"]
        const ipAddress = req.ip ||req.socket.remoteAddress;

        await RefreshTokenRepository.create({
          user_id: existingUser.user_id,
          user_agent:userAgent,
          ip_address:ipAddress,
          token_hash: TokenService.hashRefreshToken(rawRefresh),
          expires_at: TokenService.getRefreshTokenExpiry(),
           family_id: familyId,
         }, { transaction });

         await transaction.commit();
        
         
         

    logger.info(`✅ User ${existingUser.user_id} profile completed`);

    return {
      success: true,
      statusCode: 200,
      message: "Profile completed successfully",
      user: savedUser,
      data:{accessToken,refreshToken:rawRefresh}
    };
  }

  /* ================= LOGIN ================= */

  async login(phone, password, deviceId = null, userAgent = null) {
    if (!phone ) throw new AppError("Phone number required", 400);

    const user = await UserRepository.findByPhone(phone);
    if (!user) throw new AppError("Invalid phone ", 400);
    console.log("user",user);
    

    // Check account lock
    const lockField = user.account_locked_until;
    if (lockField && new Date(lockField) > new Date()) {
      await AuditRepository.logEvent({
        user_id: user.id,
        event_type: "LOGIN_FAILURE",
        phone,
        status: "FAILURE",
        error_message: "Account locked",
      });
      throw new AppError("Account is temporarily locked. Try again later.", 423);
    }
    if(user.phone_verified && !user.profile_complete){
      return{
        success: true,
        statusCode: 200,
        message: "Phone verified. Please complete your profile.",
        
        data:{user_id: user.id,
          action:"COMPLETE_REGISTRATION"
        }
      }
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      const attempts = (user.failed_login_attempts || user.login_attempts || 0) + 1;
      const maxAttempts = env.MAX_LOGIN_ATTEMPTS || 5;

      const updateData = {
        failed_login_attempts: attempts,
        login_attempts: attempts,
      };

      if (attempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + (env.LOCK_TIME || 7200000));
        updateData.account_locked_until = lockUntil;
        updateData.lock_until = lockUntil;
      }

      await user.update(updateData);

      await AuditRepository.logEvent({
        user_id: user.id,
        event_type: "LOGIN_FAILURE",
        phone,
        device_id: deviceId,
        user_agent: userAgent,
        status: "FAILURE",
        error_message: "Invalid password",
        details: { attempt: attempts },
      });

      throw new AppError("Invalid phone or password", 400);
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();

    try {
      // Reset attempts on successful login
      await user.update({
        failed_login_attempts: 0,
        login_attempts: 0,
        account_locked_until: null,
        lock_until: null,
        last_login_at: new Date(),
        last_login_ip: null,
        last_login_device: deviceId,
      }, { transaction });

      const accessToken = TokenService.generateAccessToken({
        user_id: user.id,
        phone: user.phone,
        role: user.role,
      });

      const rawRefresh = TokenService.generateRefreshToken();
      const familyId = TokenService.generateFamilyId();

      await RefreshTokenRepository.create({
        user_id: user.id,
        token_hash: TokenService.hashRefreshToken(rawRefresh),
        expires_at: TokenService.getRefreshTokenExpiry(),
        family_id: familyId,
        device_id: deviceId,
        user_agent: userAgent,
      }, { transaction });

      await transaction.commit();

      // Post-commit side effects — failures here must NOT rollback (tx already committed)
      try {
        await TokenService.cacheUserSession(user.id, accessToken);
      } catch (redisErr) {
        logger.warn(`⚠️ Redis session cache skipped: ${redisErr.message}`);
      }

      try {
        await AuditRepository.logEvent({
          user_id: user.id,
          event_type: "LOGIN_SUCCESS",
          phone,
          device_id: deviceId,
          user_agent: userAgent,
          status: "SUCCESS",
        });
      } catch (auditErr) {
        logger.warn(`⚠️ Audit log failed: ${auditErr.message}`);
      }

      kafkaManager.sendEvent("auth.events", {
        type: "USER_LOGIN",
        userId: user.id,
        timestamp: new Date().toISOString(),
      }).catch(err => logger.error(`Kafka error: ${err.message}`));

      logger.info(`✅ User ${user.id} logged in`);

      return {
        success: true,
        statusCode: 200,
        message: "Login successful",
        data: { accessToken, refreshToken: rawRefresh },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(`❌ Login error: ${error.message}`);
      throw error;
    }
  }

  /* ================= GET PROFILE ================= */

  async getProfile(userId) {
    if (!userId) throw new AppError("User ID is required", 400);

    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

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
        role: user.role,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
      },
    };
  }

  /* ================= REFRESH TOKEN ================= */

  async refreshToken(rawRefreshToken) {
    if (!rawRefreshToken) throw new AppError("Refresh token is required", 400);

    const tokenHash = TokenService.hashRefreshToken(rawRefreshToken);
    const storedToken = await RefreshTokenRepository.findByToken(tokenHash);

    if (!storedToken || storedToken.is_revoked) {
      // Potential reuse — revoke entire family
      if (storedToken?.family_id) {
        await RefreshTokenRepository.revokeByFamily(storedToken.family_id);
        logger.warn(`⚠️ Token reuse detected! Family ${storedToken.family_id} invalidated.`);
      }
      throw new AppError("Invalid or expired refresh token", 401);
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new AppError("Refresh token has expired. Please login again.", 401);
    }

    const user = await UserRepository.findById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw new AppError("User not found or inactive", 401);
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();

    try {
      const newAccessToken = TokenService.generateAccessToken({
        user_id: user.id,
        phone: user.phone,
        role: user.role,
      });

      const newRawRefresh = TokenService.generateRefreshToken();

      // Rotate the token (same family)
      await RefreshTokenRepository.updateById(storedToken.id, {
        token_hash: TokenService.hashRefreshToken(newRawRefresh),
        expires_at: TokenService.getRefreshTokenExpiry(),
      }, { transaction });

      await transaction.commit();

      // Post-commit side effects
      try {
        await TokenService.cacheUserSession(user.id, newAccessToken);
      } catch (redisErr) {
        logger.warn(`⚠️ Redis session cache skipped: ${redisErr.message}`);
      }

      logger.info(`✅ Tokens rotated for user ${user.id}`);

      return {
        success: true,
        statusCode: 200,
        message: "Token refreshed successfully",
        data: { accessToken: newAccessToken, refreshToken: newRawRefresh },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /* ================= LOGOUT ================= */

  async logout(userId, accessToken, refreshToken = null) {
    // Blacklist the access token in Redis
    if (accessToken) {
      await TokenService.blacklistAccessToken(accessToken);
    }

    // Revoke refresh token in DB
    if (refreshToken) {
      const tokenHash = TokenService.hashRefreshToken(refreshToken);
      await RefreshTokenRepository.revokeByToken(tokenHash);
    }

    // Remove session from Redis cache
    await TokenService.invalidateUserSession(userId);

    await AuditRepository.logEvent({
      user_id: userId,
      event_type: "LOGOUT",
      status: "SUCCESS",
    });

    logger.info(`✅ User ${userId} logged out`);

    return {
      success: true,
      statusCode: 200,
      message: "Logged out successfully",
    };
  }

  /* ================= FORGOT PASSWORD ================= */

  async forgotPassword(phone) {
    if (!phone) throw new AppError("Phone number is required", 400);

    const user = await UserRepository.findByPhone(phone);

    if (user) {
      const otpPayload = OtpService.createOtp();

      await user.update({
        otp_hash: otpPayload.hash,
        otp_type: "forgot_password",
        otp_expiry: otpPayload.expiry,
        otp_attempts: 0,
        otp_send_count: (user.otp_send_count || 0) + 1,
        last_otp_sent_at: new Date(),
      });
      await OtpRepository.create({
        user_id: user.id,
        type: "FORGOT_PASSWORD",
        channel: "SMS",
        sent_to: phone,
        code_hash: otpPayload.hash,
        expires_at: otpPayload.expiry,
      })

      try {
        const redisClient = redisManager.getClient();
        await redisClient.set(`otp:${user.id}`, JSON.stringify({
          code_hash: otpPayload.hash,
          type: "FORGOT_PASSWORD",
          sent_to: phone,
          expires_at: otpPayload.expiry,
        }), "EX", 300);
        logger.info(`✅ Redis SET success: forgot_password:${user.id}`);
      } catch (err) { logger.warn(`Redis SET error: ${err.message}`); }


      emitEvent(TOPICS.OTP_REQUESTED, {
        userId: user.id,
        phone,
        type: "FORGOT_PASSWORD",
        otp: otpPayload.otp,
      }, user.id.toString());

      await AuditRepository.logEvent({
        user_id: user.id,
        event_type: "PASSWORD_RESET_REQUEST",
        phone,
        status: "SUCCESS",
      });

      logger.info(`✅ Password reset OTP sent to user ${user.id}`);

      return {
        success: true,
        statusCode: 200,
        message: "If the phone number exists, an OTP has been sent",
        data: env.NODE_ENV === "development" ? { otp: otpPayload.otp } : {},
      };
    }

    // Generic response for security
    return {
      success: true,
      statusCode: 200,
      message: "If the phone number exists, an OTP has been sent",
    };
  }

  /* ================= RESET PASSWORD ================= */

  async resetPassword(resetToken, newPassword) {
    if (!resetToken || !newPassword) {
      throw new AppError("Reset token and new password are required", 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, env.JWT_SECRET);
    } catch {
      throw new AppError("Invalid or expired reset token", 401);
    }

    if (decoded.purpose !== "reset_password") {
      throw new AppError("Invalid reset token purpose", 403);
    }

    const user = await UserRepository.findById(decoded.user_id);
    if (!user) throw new AppError("User not found", 404);

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();

    try {
      user.set({ password: newPassword });
      await user.save({ transaction });

      // Revoke all refresh tokens
      await RefreshTokenRepository.revokeByUserId(user.id, { transaction });

      await transaction.commit();

      // Post-commit side effects
      try {
        await TokenService.invalidateUserSession(user.id);
      } catch (redisErr) {
        logger.warn(`⚠️ Redis invalidation skipped: ${redisErr.message}`);
      }

      try {
        await AuditRepository.logEvent({
          user_id: user.id,
          event_type: "PASSWORD_RESET_SUCCESS",
          status: "SUCCESS",
        });
      } catch (auditErr) {
        logger.warn(`⚠️ Audit log failed: ${auditErr.message}`);
      }

      kafkaManager.sendEvent("auth.events", {
        type: "PASSWORD_RESET",
        userId: user.id,
        timestamp: new Date().toISOString(),
      }).catch(err => logger.error(`Kafka error: ${err.message}`));

      logger.info(`✅ Password reset for user ${user.id}`);

      return {
        success: true,
        statusCode: 200,
        message: "Password reset successfully",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new AuthService();
