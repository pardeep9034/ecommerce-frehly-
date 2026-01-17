import {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  decodeOtp,
} from "../../helpers/otp.js";
class OtpService {
    createSignupOtp() {

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

}

export default new OtpService();