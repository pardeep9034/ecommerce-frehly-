import AuthService from "./auth.service.js";

import ResponseUtil from "../../utils/response.js";

class AuthController {
  async signup(req, res) {
    try {
      const result = await AuthService.signup(req.body);

      if (result.success === true) {
        return ResponseUtil.success(res, result.data, result.message, 201);
      } else {
        return ResponseUtil.error(res, result.message, 400);
      }
    } catch (error) {
      // only system-level failure reaches here

      return ResponseUtil.error(res, "Internal server error", 500);
    }
  }
  async verify(req, res) {
    try {
      const result = await AuthService.verify(req.body);
       const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

      if (result.success === true) {
          res.cookie("refreshToken", result.data.refreshToken, cookieOptions);
        return ResponseUtil.success(res, result.data, result.message, 201);
      } else {
        return ResponseUtil.error(res, result.message, 400);
      }
    } catch (error) {
      // only system-level failure reaches here

      return ResponseUtil.error(res, "Internal server error", 500);
    }
  }
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);

      if (result.success === true) {
        return ResponseUtil.success(
          res,
          {
            user: result.user,
          },
          result.message || "User registered successfully",
          201,
        );
      } else {
        return ResponseUtil.error(
          res,
          result.message || "Registration failed",
          result.statusCode || 400,
        );
      }
    } catch (error) {
      console.error("REGISTER CONTROLLER ERROR →", error);

      return ResponseUtil.error(res, "Internal server error", 500);
    }
  }

async login(req, res) {

  const { phone, password } = req.body;

  const result = await AuthService.login(phone, password);
  const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

  if (result && result.success === true) {
    res.cookie("refreshToken", result.data.refreshToken, cookieOptions);


    return ResponseUtil.success(
      res,
      result.data,
      result.message,
      result.statusCode || 200
    );

  } else {

    return ResponseUtil.error(
      res,
      result.message || "Login failed",
      result.statusCode || 400
    );
  }
}


  async refreshToken(req, res) {
    try {
      const  refreshToken  =  req.cookies.refreshToken;
      const result = await AuthService.refreshToken(refreshToken);
if(result.success === true){
  const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};
res.cookie("refreshToken", result.data.refreshToken, cookieOptions);
      ResponseUtil.success(res, result, "Token refreshed successfully");}
    } catch (error) {
      console.error("Refresh token error:", error);
      ResponseUtil.error(res, "Invalid refresh token", 401);
    }
  }

  async forgotPassword(req, res) {
    try {
      const { phone } = req.body;
      const result = await AuthService.forgotPassword(phone);

      ResponseUtil.success(res, result.otp, result.message);
    } catch (error) {
      console.error("Forgot password error:", error);
      ResponseUtil.error(res, "Failed to process forgot password request");
    }
  }

 async resetPassword(req, res) {

  const { resetToken, newPassword } = req.body;

  const result = await AuthService.resetPassword(resetToken, newPassword);

  if (result.success === true) {

    return ResponseUtil.success(
      res,
      null,
      result.message,
      result.statusCode || 200
    );

  } else {

    return ResponseUtil.error(
      res,
      result.message,
      result.statusCode || 400
    );
  }
}


  async getProfile(req, res) {
    try {
      const result=await AuthService.getProfile(req.user.id);

      if(result.success === true){
        ResponseUtil.success(res, result, "Profile retrieved successfully");
      }
    } catch (error) {
      console.error("Get profile error:", error);
      ResponseUtil.error(res, "Failed to get profile");
    }
  }

  async logout(req, res) {
    try {
      // In a real app, you might want to blacklist the token
      ResponseUtil.success(res, null, "Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      ResponseUtil.error(res, "Logout failed");
    }
  }
}

// module.exports = new AuthController();
export default new AuthController();
