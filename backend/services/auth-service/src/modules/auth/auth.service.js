import UserRepository from "../repository/user.repository.js";
import RefreshTokenRepository from "../repository/refreshToken.repository.js";
import OtpRepository from "../repository/otp.repository.js";
import AuditRepository from "../repository/audit.repository.js";
import OtpService from "../otp/otp.service.js";
import { sendOtp } from "../sms/sms.service.js";
import TokenService from "../token/token.service.js";
import initializeModels from "../../models/index.js";
import logger from "../../utils/Logger.js";
import AppError from "../../utils/AppError.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import redisManager from "../../config/redis.js";
import UserSessionRepository from "../repository/userSession.repository.js";
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import refreshTokenRepository from "../repository/refreshToken.repository.js";
import {publisher} from "../../messaging/index.js";
import userEvent from "../../messaging/events/user.events.js";
import { accountState, NEXT_ACTION } from "./accountState.js";
import { DEFAULT_SIGNUP_ROLE } from "../../constants/roles.js";

const LOGIN_MESSAGE = {
  SIGNUP: "Please sign up to continue.", // no account, OTP never verified, or profile never finished
  LOGIN: "Profile completed.",
};

class AuthService {

  /* ================= SIGNUP ================= */

  async signup(data) {
    const { phone, role = DEFAULT_SIGNUP_ROLE } = data;

    if (!phone) {
      throw new AppError("Phone number is required", 400);
    }

    const existingUser = await UserRepository.findByPhone(phone);
    const otpPayload = OtpService.createOtp();

    if (existingUser) {
      // One role per user. A registered number is never reused under another role: a customer cannot
      // become a delivery partner, nor the reverse. Checked before "already exists" so the message says why.
      if (existingUser.role !== role) {
        throw new AppError(
          "This number is already registered for a different account type. Please use another number.",
          409
        );
      }

      if (accountState(existingUser) === "ACTIVE") {
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
        logger.error(error.message, { stack: error.stack });
      }

      await sendOtp({ phone, otp: otpPayload.otp });

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
          phone,
          role
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

      await sendOtp({ phone, otp: otpPayload.otp });

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
        logger.error(error.message, { stack: error.stack });
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


    const otpRecord = await OtpRepository.findLatestOtp(user.id, type);

    if (!otpRecord) throw new AppError("No OTP request found", 400);

    if (otpRecord.used_at) {
      throw new AppError("OTP has already been used", 400);
    }

    if (!otpRecord.expires_at || new Date(otpRecord.expires_at) < new Date()) {
      await OtpRepository.revokePendingOtps(user.id, type);
      throw new AppError("OTP has expired", 400);
    }

    // The counter, not `status`, is what stops the guessing: this method never reads `status`.
    if (otpRecord.attempt_count >= OtpService.MAX_ATTEMPTS) {
      throw new AppError("Too many wrong attempts. Request a new code.", 429);
    }

    const isValid = OtpService.compareOtp(otp, otpRecord.code_hash);

    // try {
    //   // const redisClient = redisManager.getClient();
    //  if(redisClient.isReady){
    //    const redisTest = await redisClient.get(`otp:${user.id}`);
    //   if (redisTest) {
    //     logger.info(`✅ Redis Hit! OTP found for user ${user.id}`);
    //   } else {
    //     logger.warn(`⚠️ Redis Miss! OTP not found for user ${user.id}`);
    //   }
    //  }
    //  else{
    //   logger.warn("Redis unavailable. Using DB only.");
    //  }
    // } catch (err) {
    //   logger.warn(`Redis GET error: ${err.message}`);
    // }
    if (!isValid) {
      await OtpRepository.incrementAttempts(otpRecord.id);
      throw new AppError("Invalid OTP", 400);
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();

    try {
      // Mark OTP record as used
      if (otpRecord) await OtpRepository.markUsed(otpRecord.id, { transaction });

      if (type === "SIGNUP") {
        
        await user.update({
          phone_verified: true,
        }, { transaction });

       
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
        // kafkaManager.sendEvent("auth.events", {
        //   type: "USER_REGISTERED",
        //   userId: user.id,
        //   phone: user.phone,
        //   timestamp: new Date().toISOString(),
        // }).catch(err => logger.error(`Kafka error: ${err.message}`));

        // logger.info(`✅ User ${user.id} verified and registered`);

        return {
          success: true,
          statusCode: 200,
          message: "OTP verified successfully",
          data: { onBoardToken },
        };
      }

      if (type === "FORGOT_PASSWORD") {
        const resetToken = jwt.sign(
          { user_id: user.id, purpose: "reset_password" },
          env.JWT_SECRET,
          { expiresIn: "10m" }
        );

        // Without this the transaction stayed open: a pool connection leaked and the OTP was never saved as used.
        await transaction.commit();

      
       

        return {
          success: true,
          statusCode: 200,
          message: "OTP verified. You may reset your password.",
          data: { resetToken },
        };
      }

      throw new AppError("Unsupported OTP type", 400); // the catch below rolls back; a second rollback threw and hid this 400

    } catch (error) {
      await transaction.rollback();
      logger.error(`❌ Verify OTP error: ${error.message}`);
      throw error;
    }
  }

  /* ================= COMPLETE REGISTRATION ================= */

  async register(req,userData) {
    const { first_name, last_name, email, password } = userData;

    // The account is the token's own. A phone sent in the body is ignored: trusting it let any
    // logged-in user finish someone else's sign-up (set their password, take their session).
    const existingUser = await UserRepository.findById(req.user.id);
    if (!existingUser) throw new AppError("User not found", 404);
    const state = accountState(existingUser);
    if (state === "UNVERIFIED") throw new AppError("Verify your phone number first", 403);
    if (state === "ACTIVE") throw new AppError("profile is completed", 400);
    if (!first_name && !password) {
      throw new AppError("No data provided to update", 400);
    }

    if (first_name) existingUser.first_name = first_name;
    if (last_name) existingUser.last_name = last_name;
    if (email) existingUser.email = email;
    if (password) existingUser.password_hash = password;
    existingUser.profile_complete = true;

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();
    try {
      const savedUser = await existingUser.save({ transaction });

      const accessToken = TokenService.generateAccessToken({
        user_id: existingUser.id,
        phone: existingUser.phone,
        role: existingUser.role,
        warehouse_id: existingUser.warehouse_id, // store staff's store; order-service scopes OPS_STAFF by it
      });

      const rawRefresh = TokenService.generateRefreshToken();
      const familyId = TokenService.generateFamilyId();
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;

      await RefreshTokenRepository.create({
        user_id: existingUser.id,
        user_agent: userAgent,
        ip_address: ipAddress,
        token_hash: TokenService.hashRefreshToken(rawRefresh),
        expires_at: TokenService.getRefreshTokenExpiry(),
        family_id: familyId,
      }, { transaction });

      await transaction.commit();

      logger.info(`✅ User ${existingUser.id} profile completed`);

      // Inside the try: savedUser, accessToken and rawRefresh are block-scoped to it.
      return {
        success: true,
        statusCode: 200,
        message: "Profile completed successfully",
        // Same fields as getProfile: the model instance would also send password_hash and lockout columns.
        user: {
          id: savedUser.id,
          phone: savedUser.phone,
          first_name: savedUser.first_name,
          last_name: savedUser.last_name,
          email: savedUser.email,
          role: savedUser.role,
          phone_verified: savedUser.phone_verified,
          email_verified: savedUser.email_verified,
        },
        data: { accessToken, refreshToken: rawRefresh }
      };
    } catch (err) {
      await transaction.rollback();
      throw new AppError("Failed to complete profile", 500);
    }
  }

  /* ================= LOGIN ================= */
  async login(phone){
    if (!phone) throw new AppError("Phone number required", 400);
    const user = await UserRepository.findByPhone(phone);
    const action = NEXT_ACTION[accountState(user)];
    return {
      success: true,
      statusCode: 200,
      message: LOGIN_MESSAGE[action],
      // SIGNUP covers "no account" and "OTP never verified": no user_id goes out for either.
      data: action === "SIGNUP" ? { action } : { user_id: user.id, action },
    };
  }

  async loginWithPassword(identifier, password, guest_cart = null, warehouseId, deviceId = null, userAgent = null, ) {
    if (!identifier ) throw new AppError("Phone or email  required", 400);

    const user = await UserRepository.findByPhoneOrEmail(identifier);
    if (!user) {
     throw new AppError("User Not Found.", 404);
    }

    // Added by staff or half signed up: no password yet, and bcrypt.compare(x, null) would throw a 500.
    if (!user.password_hash) {
      throw new AppError("Finish sign-up first: use Sign up with this number.", 401);
    }

    // Check account lock
    const lockField = user.account_locked_until;
    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isEmail=isValidEmail(identifier)
    if (lockField && new Date(lockField) > new Date()) {
      await AuditRepository.logEvent({
        user_id: user.id,
        event_type: "LOGIN_FAILURE",
        phone:isEmail?null:identifier,
        email:isEmail?identifier:null,
        status: "FAILURE",
        error_message: "Account locked",
      });
      throw new AppError("Account is temporarily locked. Try again later.", 423);
    }
    
    


    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const maxAttempts = env.MAX_LOGIN_ATTEMPTS || 5;

      const updateData = {
        failed_login_attempts: attempts,
        
      };

      if (attempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + (env.LOCK_TIME || 900000));
        updateData.account_locked_until = lockUntil;
       
      }

      await UserRepository.updateById(user.id,updateData);

      await AuditRepository.logEvent({
        user_id: user.id,
        event_type: "LOGIN_FAILURE",
        phone: isEmail ? null : identifier,
        email: isEmail ? identifier : null,
        device_id: deviceId,
        user_agent: userAgent,
        status: "FAILURE",
        error_message: "Invalid password",
        details: { attempt: attempts },
      });

      throw new AppError("Invalid phone or password", 400);
    }

    // Checked after the password so the account status isn't revealed to someone who doesn't know it.
    if (!user.is_active) {
      await AuditRepository.logEvent({
        user_id: user.id,
        event_type: "LOGIN_FAILURE",
        phone: isEmail ? null : identifier,
        email: isEmail ? identifier : null,
        device_id: deviceId,
        user_agent: userAgent,
        status: "FAILURE",
        error_message: "Account is deactivated",
      });
      throw new AppError("Account is deactivated. Please contact support.", 403);
    }

    const db = await initializeModels();
    const transaction = await db.sequelize.transaction();

    try {
      // Reset attempts on successful login
      await UserRepository.updateById(user.id,{
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login_at: new Date(),
        last_login_ip: null,
        last_login_device: deviceId,
      }, { transaction });

      const accessToken = TokenService.generateAccessToken({
        user_id: user.id,
        phone: user.phone,
        role: user.role,
        warehouse_id: user.warehouse_id,
      });

      const rawRefresh = TokenService.generateRefreshToken();
      const familyId = TokenService.generateFamilyId();
      const session_id=uuidv4();

      await RefreshTokenRepository.create({
        user_id: user.id,
        token_hash: TokenService.hashRefreshToken(rawRefresh),
        expires_at: TokenService.getRefreshTokenExpiry(),
        family_id: familyId,
        device_id: deviceId,
        user_agent: userAgent,
      }, { transaction });
      await UserSessionRepository.create({
        user_id: user.id,
       session_id:session_id,
        expires_at: TokenService.getRefreshTokenExpiry(),
        refresh_family_id: familyId,
        device_id: deviceId,
        user_agent: userAgent,
      }, { transaction });


      await transaction.commit();

      // Post-commit side effects — failures here must NOT rollback (tx already committed)
      // try {
      //   await TokenService.cacheUserSession(user.id, accessToken);
      // } catch (redisErr) {
      //   logger.warn(`⚠️ Redis session cache skipped: ${redisErr.message}`);
      // }

      try {
        await AuditRepository.logEvent({
          user_id: user.id,
          event_type: "LOGIN_SUCCESS",
          phone: isEmail ? null : identifier,
          email: isEmail ? identifier : null,
          device_id: deviceId,
          user_agent: userAgent,
          status: "SUCCESS",
        });
      } catch (auditErr) {
        logger.warn(`⚠️ Audit log failed: ${auditErr.message}`);
      }
      //emit event
      logger.debug("USER_LOGGED_IN event", { user_id: user.id, guest_cart, warehouse_id: warehouseId });
      // A broker outage must not block sign-in; the guest cart is then not merged.
      await publisher.publish(userEvent.USER_LOGGED_IN, {user_id: user.id, guest_cart,warehouse_id:warehouseId})
        .catch((err) => logger.warn(`USER_LOGGED_IN not published for user ${user.id}: ${err.message}`));
      
      


      logger.info(`✅ User ${user.id} logged in`);

      return {
        success: true,
        statusCode: 200,
        message: "Login successful",
        data: { accessToken, refreshToken: rawRefresh },
      };
    } catch (error) {
   if (!transaction.finished) {
        await transaction.rollback();
    }
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
        warehouse_id: user.warehouse_id, // staff's store; the store panel reads it
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
      },
    };
  }

  /* ================= UPDATE OWN PROFILE ================= */

  // Step 1 of a mobile change: a code goes to the NEW number, so only its owner can finish the change.
  async requestPhoneChange(userId, phone) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (phone === user.phone) throw new AppError("This is already your mobile number", 400);
    if (await UserRepository.findByPhone(phone)) throw new AppError("This mobile number is already in use", 409);
    if (OtpService.tooSoon(await OtpRepository.findLatestOtp(user.id, "PHONE_CHANGE"))) {
      throw new AppError("Please wait before requesting another OTP", 429);
    }

    const otpPayload = OtpService.createOtp();
    await OtpRepository.revokePendingOtps(user.id, "PHONE_CHANGE");
    await OtpRepository.create({
      user_id: user.id,
      type: "PHONE_CHANGE",
      channel: "SMS",
      sent_to: phone,
      code_hash: otpPayload.hash,
      expires_at: otpPayload.expiry,
    });
    await sendOtp({ phone, otp: otpPayload.otp });

    return {
      message: "OTP sent to the new mobile number",
      data: env.NODE_ENV === "development" ? { otp: otpPayload.otp } : {},
    };
  }

  // Name and email change at once. A different phone also needs `otp` from requestPhoneChange.
  async updateProfile(userId, body) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const changes = {};
    if (body.first_name !== undefined) changes.first_name = body.first_name.trim();
    if (body.last_name !== undefined) changes.last_name = body.last_name?.trim() || null;
    if (body.email !== undefined) {
      const email = body.email?.trim().toLowerCase() || null;
      if (email !== user.email) {
        const owner = email && await UserRepository.findByEmail(email);
        if (owner && owner.id !== user.id) throw new AppError("This email is already in use", 409);
        changes.email = email;
        changes.email_verified = false;
      }
    }

    let otpRecord;
    if (body.phone !== undefined && body.phone !== user.phone) {
      if (!body.otp) throw new AppError("Enter the OTP sent to your new mobile number", 400);
      otpRecord = await OtpRepository.findLatestOtp(user.id, "PHONE_CHANGE");
      // The code is only good for the number it was sent to.
      if (!otpRecord || otpRecord.status !== "PENDING" || otpRecord.sent_to !== body.phone) {
        throw new AppError("Request an OTP for this number first", 400);
      }
      if (new Date(otpRecord.expires_at) < new Date()) throw new AppError("OTP has expired", 400);
      if (otpRecord.attempt_count >= OtpService.MAX_ATTEMPTS) {
        throw new AppError("Too many wrong attempts. Request a new code.", 429);
      }
      if (!OtpService.compareOtp(body.otp, otpRecord.code_hash)) {
        await OtpRepository.incrementAttempts(otpRecord.id);
        throw new AppError("Invalid OTP", 400);
      }
      changes.phone = body.phone;
    }

    // Only fields that really change count, so a plain "Save" writes nothing.
    const changed = Object.keys(changes).filter((key) => changes[key] !== user[key] && key !== "email_verified");
    if (changed.length) {
      const db = await initializeModels();
      try {
        await db.sequelize.transaction(async (transaction) => {
          await user.update(changes, { transaction });
          if (otpRecord) await OtpRepository.markUsed(otpRecord.id, { transaction });
          await AuditRepository.logEvent({
            user_id: user.id,
            event_type: "PROFILE_UPDATED",
            status: "SUCCESS",
            details: { fields: changed },
          }, { transaction });
        });
      } catch (error) {
        // Two people claiming the same number / email at the same moment.
        if (error.name === "SequelizeUniqueConstraintError") throw new AppError("This mobile number or email is already in use", 409);
        throw error;
      }
    }

    const profile = await this.getProfile(user.id);
    return { message: changed.length ? "Profile updated" : "Nothing to change", data: profile.data };
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
        warehouse_id: user.warehouse_id,
      });

      const newRawRefresh = TokenService.generateRefreshToken();

      // Rotate the token (same family)
      await RefreshTokenRepository.updateById(storedToken.id, {
     is_revoked:true,
     revoked_at:new Date(),
     revoke_reason:"ROTATE"
      }, { transaction });
      await RefreshTokenRepository.create({
        user_id: user.id,
        token_hash: TokenService.hashRefreshToken(newRawRefresh),
        expires_at: TokenService.getRefreshTokenExpiry(),
        family_id: storedToken.family_id,
        device_id: storedToken.device_id,
        user_agent: storedToken.user_agent,
      }, { transaction });

      await transaction.commit();

      // Post-commit side effects
      // try {
      //   await TokenService.cacheUserSession(user.id, newAccessToken);
      // } catch (redisErr) {
      //   logger.warn(`⚠️ Redis session cache skipped: ${redisErr.message}`);
      // }

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
    // if (accessToken) {
    //   await TokenService.blacklistAccessToken(accessToken);
    // }

    // Revoke refresh token in DB
    if (refreshToken) {
      const tokenHash =   TokenService.hashRefreshToken(refreshToken);
      const userRefreshToken=await refreshTokenRepository.findByToken(tokenHash);
      //revoke session
      const familyId=userRefreshToken.family_id;
      await UserSessionRepository.revokeSessionByFamily(familyId)
      await RefreshTokenRepository.revokeByFamily(familyId,"logout");
    }


    // Remove session from Redis cache
    // await TokenService.invalidateUserSession(userId);

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
  // The refresh-token family behind this request's cookie ("this device"), or null when the cookie is
  // missing, already rotated or revoked, or belongs to someone else.
  async currentFamily(userId, rawRefreshToken) {
    if (!rawRefreshToken) return null;
    const token = await RefreshTokenRepository.findByToken(TokenService.hashRefreshToken(rawRefreshToken));
    return token && !token.is_revoked && String(token.user_id) === String(userId) ? token.family_id : null;
  }

  // Ends the user's refresh tokens and sessions, except the `keepFamily` one (null ends all).
  // Returns how many sessions ended. Access tokens already issued still work until they expire (15 min).
  async revokeSessions(userId, keepFamily, reason, { transaction } = {}) {
    const now = new Date();
    await RefreshTokenRepository.update(
      { user_id: userId, is_revoked: false, ...(keepFamily && { family_id: { [Op.ne]: keepFamily } }) },
      { is_revoked: true, revoked_at: now, revoke_reason: reason },
      { transaction }
    );
    const [ended] = await UserSessionRepository.update(
      { user_id: userId, status: "ACTIVE", ...(keepFamily && { refresh_family_id: { [Op.ne]: keepFamily } }) },
      { status: "REVOKED", revoked_at: now },
      { transaction }
    );
    return ended;
  }

  async logoutFromAllDevices(userId) {
    const db = await initializeModels();
    const ended = await db.sequelize.transaction(async (transaction) => {
      const count = await this.revokeSessions(userId, null, "LOGOUT_ALL", { transaction });
      await AuditRepository.logEvent({
        user_id: userId, event_type: "LOGOUT_ALL", status: "SUCCESS", details: { sessions_ended: count },
      }, { transaction });
      return count;
    });
    return { message: "Logged out from all devices successfully", data: { signed_out_sessions: ended } };
  }

  // "Sign out everywhere else": keeps the session behind this request's refresh cookie.
  async logoutOtherDevices(userId, rawRefreshToken) {
    const keep = await this.currentFamily(userId, rawRefreshToken);
    // No valid cookie means no "this device" to keep; refuse rather than sign this device out too.
    if (!keep) throw new AppError("Can't tell which session is this one. Sign in again and retry.", 400);

    const db = await initializeModels();
    const ended = await db.sequelize.transaction(async (transaction) => {
      const count = await this.revokeSessions(userId, keep, "LOGOUT_OTHERS", { transaction });
      await AuditRepository.logEvent({
        user_id: userId, event_type: "LOGOUT_ALL", status: "SUCCESS", details: { sessions_ended: count, kept_current: true },
      }, { transaction });
      return count;
    });
    return {
      message: ended ? `Signed out of ${ended} other session${ended === 1 ? "" : "s"}` : "No other sessions were signed in",
      data: { signed_out_sessions: ended },
    };
  }

  /* ================= CHANGE PASSWORD (signed in) ================= */

  // Needs the current password. A wrong one counts toward the login lock, so a stolen session can't be used
  // to guess it. Other devices are signed out; this one (the refresh cookie's family) stays signed in.
  async changePassword(userId, { current_password, new_password }, rawRefreshToken) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.password_hash) throw new AppError("This account has no password yet. Use Forgot password to set one.", 400);
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      throw new AppError("Account is temporarily locked. Try again later.", 423);
    }

    if (!(await bcrypt.compare(current_password, user.password_hash))) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const locked = attempts >= (env.MAX_LOGIN_ATTEMPTS || 5);
      await UserRepository.updateById(user.id, {
        failed_login_attempts: attempts,
        ...(locked && { account_locked_until: new Date(Date.now() + (env.LOCK_TIME || 900000)) }),
      });
      await AuditRepository.logEvent({
        user_id: user.id, event_type: "PASSWORD_CHANGE", status: "FAILURE",
        error_message: "Wrong current password", details: { attempt: attempts },
      });
      // 400, not 401: a 401 makes the client try a token refresh and sign out.
      if (locked) throw new AppError("Account is temporarily locked. Try again later.", 423);
      throw new AppError("Current password is wrong", 400);
    }
    if (await bcrypt.compare(new_password, user.password_hash)) {
      throw new AppError("The new password must be different from the current one", 400);
    }

    const keep = await this.currentFamily(user.id, rawRefreshToken);
    const db = await initializeModels();
    const ended = await db.sequelize.transaction(async (transaction) => {
      // The model hook hashes password_hash. Choosing their own password also ends an admin-issued temporary one.
      user.set({ password_hash: new_password, failed_login_attempts: 0, account_locked_until: null, must_change_password: false });
      await user.save({ transaction });
      const count = await this.revokeSessions(user.id, keep, "PASSWORD_CHANGE", { transaction });
      await AuditRepository.logEvent({
        user_id: user.id, event_type: "PASSWORD_CHANGE", status: "SUCCESS",
        details: { sessions_ended: count, kept_current: !!keep },
      }, { transaction });
      return count;
    });

    return { message: "Password changed", data: { signed_out_sessions: ended } };
  }

  /* ================= FORGOT PASSWORD ================= */

  async forgotPassword(phone) {
    if (!phone) throw new AppError("Phone number is required", 400);

    const user = await UserRepository.findByPhone(phone);

    // Only a finished account gets a code (an invited or half-signed-up number has no password to reset), and
    // not twice inside the gap. Every other case gets the same generic reply below, so none of them can be told apart.
    const canSend = accountState(user) === "ACTIVE" &&
      !OtpService.tooSoon(await OtpRepository.findLatestOtp(user.id, "FORGOT_PASSWORD"));

    if (canSend) {
      const otpPayload = OtpService.createOtp();



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
        if(redisClient.isReady) {
        await redisClient.set(`otp:${user.id}`, JSON.stringify({
          code_hash: otpPayload.hash,
          type: "FORGOT_PASSWORD",
          sent_to: phone,
          expires_at: otpPayload.expiry,
        }), "EX", 300);}
        logger.info(`✅ Redis SET success: forgot_password:${user.id}`);
      } catch (err) { logger.warn(`Redis SET error: ${err.message}`); }


      await sendOtp({ phone, otp: otpPayload.otp });

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
      // A reset also lifts the 5-wrong-passwords lock, or the next sign-in would still say "temporarily locked".
      // Choosing their own password also ends an admin-issued temporary one.
      user.set({ password_hash: newPassword, failed_login_attempts: 0, account_locked_until: null, must_change_password: false });
      await user.save({ transaction });

      // Revoke all refresh tokens
      await RefreshTokenRepository.revokeByUserId(user.id, "PASSWORD_RESET", { transaction });

      await transaction.commit();

      // Post-commit side effects
      // try {
      //   await TokenService.invalidateUserSession(user.id);
      // } catch (redisErr) {
      //   logger.warn(`⚠️ Redis invalidation skipped: ${redisErr.message}`);
      // }

      try {
        await AuditRepository.logEvent({
          user_id: user.id,
          event_type: "PASSWORD_RESET_SUCCESS",
          status: "SUCCESS",
        });
      } catch (auditErr) {
        logger.warn(`⚠️ Audit log failed: ${auditErr.message}`);
      }

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
