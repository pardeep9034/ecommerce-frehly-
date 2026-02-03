import express from "express"
import otpController from "./otp.controller.js";

const router=express.Router()
router.get("/resend",otpController.resendOtp)

export default router;