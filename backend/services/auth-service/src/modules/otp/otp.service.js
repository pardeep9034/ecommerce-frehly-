import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  decodeOtp,
} from "../../helpers/otp.js";

import UserRepository from "../repository/user.repository.js";
import OtpRepository from "../repository/otp.repository.js";
import { env } from "../../config/env.js";
env
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
async resendOtp(phone,type) {

  /* ================= VALIDATION ================= */
  if (phone) {

    /* ================= USER CHECK ================= */
    const user = await UserRepository.findByPhone(phone);

    if (user) {
         /* ================= GENERATE OTP ================= */
        const { otp, hash, expiry } = this.createOtp();
        const otpRecord= await OtpRepository.findLatestOtp(user.id,type);

      /* ================= OTP TYPE CHECK ================= */
//       if (user.otp_type) {
//         if (
//   user.last_otp_sent_at &&
//   Date.now() - new Date(user.last_otp_sent_at).getTime() > RESEND_WINDOW
// ) {
//   await user.update({
//     otp_send_count: 0,
//   });
// }


//         /* ================= RESEND LIMIT ================= */
//         if (user.otp_send_count >= RESEND_LIMIT) {
//           return {
//             success: false,
//             statusCode: 429,
//             message: "OTP resend limit exceeded. Please try later.",
//           };
//         }

//         /* ================= COOLDOWN CHECK ================= */
//         if (user.last_otp_sent_at) {
//           const diff =
//             Date.now() - new Date(user.last_otp_sent_at).getTime();

//           if (diff < 60 * 1000) {
//             return {
//               success: false,
//               statusCode: 429,
//               message: "Please wait before requesting another OTP",
//             };
//           }
//         }
  // if(otpRecord){
  //   if(otpRecord.expires_at > new Date()){
  //     return {
  //       success: false,
  //       statusCode: 429,
  //       message: "Please wait before requesting another OTP",
  //     };
  //   }
    
  // }

     

        /* ================= UPDATE OTP ================= */
        
        await OtpRepository.create({
          user_id: user.id,
          code_hash: hash,
          expires_at: expiry,
          type: type,
          channel: "SMS",
          sent_to: phone,
        });
        console.log("OTP created and saved to DB:", otp);

        /* ================= SEND OTP ================= */
        // await SmsService.sendOtp(user.phone, otp);

        /* ================= GENERIC RESPONSE ================= */
        return {
          success: true,
          statusCode: 200,
          message: "If an OTP request exists, a new OTP has been sent",
          data:otp,
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