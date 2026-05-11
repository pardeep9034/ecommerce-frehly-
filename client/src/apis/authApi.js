import api from "./axiosInstance";

export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  }
    catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};
export const signup = async (userInfo) => {
  try {
    const response = await api.post("/auth/signup", userInfo);
    return response.data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

export const verifyOtp = async (otpInfo) => {
  try {
    const response = await api.post("/auth/signup/verify", otpInfo);
    return response.data;
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
};
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  }
    catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};
export const getProfile = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response.data.data;
  } catch (error) {
    console.error("Profile retrieval error:", error);
    throw error;
  }
};

export const resendOtp = async (phone,type) => {
  try {
    const response = await api.post("/auth/otp/resend", { phone,type });
    return response.data;
  } catch (error) {
    console.error("Resend OTP error:", error);
    throw error;
  }
};
export const forgotPassword = async (phone) => {
  try {
    const response = await api.post("/auth/forgot-password",{ phone });
    return response.data;
  } catch (error) {
    console.error("Forgot password error:", error);
    throw error;
  }
};
export const resetPassword= async (resetData) => {
  try {
    const response = await api.post("/auth/reset-password", resetData);
    return response.data;
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
};


