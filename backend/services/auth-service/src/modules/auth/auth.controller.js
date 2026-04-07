import AuthService from "./auth.service.js";
import ResponseUtil from "../../utils/response.js";
import logger from "../../utils/Logger.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

class AuthController {

  async signup(req, res, next) {
    try {
      const result = await AuthService.signup(req.body);
      return ResponseUtil.success(res, result.data, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  async verify(req, res, next) {
    try {
      const result = await AuthService.verify(req.body);
      if (result.data?.refreshToken) {
        res.cookie("refreshToken", result.data.refreshToken, COOKIE_OPTIONS);
      }
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return ResponseUtil.success(res, { user: result.user }, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { phone, password } = req.body;
      const deviceId = req.headers["x-device-id"] || null;
      const userAgent = req.headers["user-agent"] || null;

      const result = await AuthService.login(phone, password, deviceId, userAgent);
      res.cookie("refreshToken", result.data.refreshToken, COOKIE_OPTIONS);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const result = await AuthService.refreshToken(refreshToken);
      res.cookie("refreshToken", result.data.refreshToken, COOKIE_OPTIONS);
      return ResponseUtil.success(res, { accessToken: result.data.accessToken }, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { phone } = req.body;
      const result = await AuthService.forgotPassword(phone);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await AuthService.resetPassword(resetToken, newPassword);
      return ResponseUtil.success(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const result = await AuthService.getProfile(req.user.id);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1] || null;
      const refreshToken = req.cookies?.refreshToken || null;
      const userId = req.user?.id;

      const result = await AuthService.logout(userId, accessToken, refreshToken);

      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return ResponseUtil.success(res, null, result.message, 200);
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      next(error);
    }
  }
}

export default new AuthController();
