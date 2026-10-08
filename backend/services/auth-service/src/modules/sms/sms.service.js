import { send } from "../../utils/sms/index.js";
import logger from "../../utils/Logger.js";

// A failed text must never fail the request that asked for it, so log and return.
export const sendOtp = async ({ phone, otp }) => {
    try {
        await send({ to: phone, kind: "OTP", text: `Your Freshly code is ${otp}` });
    } catch (error) {
        logger.error(`❌ Failed to send OTP: ${error.message}`);
    }
}
