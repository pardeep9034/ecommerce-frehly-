
import { GetProvider } from "../../providers/provider.factory.js";
import logger from "../../utils/Logger.js";

export const sendOtp=async(data)=>{
    try {
        const { phone, otp, channel = "SMS" } = data;

        const provider = GetProvider(channel);

        await provider.sendOtp({
          to: phone,
          code: otp,
        });

        console.log("✅ OTP sent:", phone);
      } catch (error) {
        logger.error(`❌ Failed to send OTP: ${error.message}`);
      }
}