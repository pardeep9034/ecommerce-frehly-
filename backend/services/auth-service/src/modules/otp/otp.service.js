import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  decodeOtp,
} from "../../helpers/otp.js";

import UserRepository from "../repository/user.repository.js";
const RESEND_LIMIT = 5;
const RESEND_WINDOW = 15 * 60 * 1000;
class OtpService {
    createOtp() {

    const otp = generateOtp();
    const hash = hashOtp(otp);
    const expiry = getOtpExpiry();

    return { otp, hash, expiry };
}
compareOtp(inputOtp, storedHash) {

    if (inputOtp && storedHash) {

        const hashedInput = hashOtp(inputOtp);

        if (hashedInput === storedHash) {
            return true;
        } else {
            return false;
        }

    } else {
        return false;
    }

}
async resendOtp(phone) {

  /* ================= VALIDATION ================= */
  if (phone) {

    /* ================= USER CHECK ================= */
    const user = await UserRepository.findByPhone(phone);

    if (user) {

      /* ================= OTP TYPE CHECK ================= */
      if (user.otp_type) {
        if (
  user.last_otp_sent_at &&
  Date.now() - new Date(user.last_otp_sent_at).getTime() > RESEND_WINDOW
) {
  await user.update({
    otp_send_count: 0,
  });
}


        /* ================= RESEND LIMIT ================= */
        if (user.otp_send_count >= RESEND_LIMIT) {
          return {
            success: false,
            statusCode: 429,
            message: "OTP resend limit exceeded. Please try later.",
          };
        }

        /* ================= COOLDOWN CHECK ================= */
        if (user.last_otp_sent_at) {
          const diff =
            Date.now() - new Date(user.last_otp_sent_at).getTime();

          if (diff < 60 * 1000) {
            return {
              success: false,
              statusCode: 429,
              message: "Please wait before requesting another OTP",
            };
          }
        }

        /* ================= GENERATE OTP ================= */
        const { otp, hash, expiry } = OtpService.createOtp();

        /* ================= UPDATE OTP ================= */
        await user.update({
          otp_hash: hash,
          otp_expiry: expiry,
          otp_attempts: 0,
          otp_send_count: user.otp_send_count + 1,
          last_otp_sent_at: new Date(),
        });

        /* ================= SEND OTP ================= */
        // await SmsService.sendOtp(user.phone, otp);

      }

      /* ================= GENERIC RESPONSE ================= */
      return {
        success: true,
        statusCode: 200,
        message: "If an OTP request exists, a new OTP has been sent",
      };

    } else {

      /* ================= GENERIC RESPONSE ================= */
      return {
        success: true,
        statusCode: 200,
        message: "If an OTP request exists, a new OTP has been sent",
      };
    }

  } else {

    return {
      success: false,
      statusCode: 400,
      message: "Phone number is required",
    };
  }
}


}

export default new OtpService();