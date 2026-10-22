import AuthService from "./auth.service.js";
import ResponseUtil from "../../utils/response.js";
import logger from "../../utils/Logger.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};
const PERSISTENT_REFRESH_COOKIE = { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days

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
    
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      
      const result = await AuthService.register(req,req.body);
      
        if (result.data?.refreshToken) {
        res.cookie("refreshToken", result.data.refreshToken, PERSISTENT_REFRESH_COOKIE);
      }
      return ResponseUtil.success(res, { user: result.user }, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
  async login(req,res,next){
    try{
      const {phone}=req.body;
      const result=await AuthService.login(phone);
      if(result.data){
        return ResponseUtil.success(res, result.data, result.message, 200);
      }
    }catch(err){
      next(err);
    }
  }
  async loginWithPassword(req,res,next){

    try {
      const { identifier, password ,guest_cart, rememberMe} = req.body;
      const warehouseId=req.headers["x-warehouse-id"]
      const deviceId = req.headers["x-device-id"] || null;
      const userAgent = req.headers["user-agent"] || null;

      const result = await AuthService.loginWithPassword(identifier, password,guest_cart,warehouseId, deviceId, userAgent );
      // rememberMe === false → session cookie (cleared when the browser closes).
      // Omitted/true → persistent 7-day cookie, same as before this flag existed.
      res.cookie("refreshToken", result.data.refreshToken, rememberMe === false ? COOKIE_OPTIONS : PERSISTENT_REFRESH_COOKIE);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }



  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const result = await AuthService.refreshToken(refreshToken);
      // ponytail: always reissues as persistent — the browser doesn't echo back
      // whether the original cookie was session-only, so a non-remembered login
      // that stays open past its access-token lifetime gets its cookie upgraded
      // on the first silent refresh. Harmless today (nothing calls this route
      // proactively), but a real fix needs a "remembered" flag stored per
      // refresh-token record in the DB.
      res.cookie("refreshToken", result.data.refreshToken, PERSISTENT_REFRESH_COOKIE);
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

  async updateProfile(req, res, next) {
    try {
      const result = await AuthService.updateProfile(req.user.id, req.body);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async requestPhoneChange(req, res, next) {
    try {
      const result = await AuthService.requestPhoneChange(req.user.id, req.body.phone);
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
  async logoutFromAllDevices(req, res, next) {
    try {
      const result = await AuthService.logoutFromAllDevices(req.user.id);
      res.clearCookie("refreshToken", COOKIE_OPTIONS); // this device's token is revoked too
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async logoutOtherDevices(req, res, next) {
    try {
      const result = await AuthService.logoutOtherDevices(req.user.id, req.cookies?.refreshToken);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword(req.user.id, req.body, req.cookies?.refreshToken);
      return ResponseUtil.success(res, result.data, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
