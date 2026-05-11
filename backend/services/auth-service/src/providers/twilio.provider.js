import ProviderInterface from "./provider.interface.js";

class TwilioProvider extends ProviderInterface {
  async sendOtp({ to, code, type }) {
    console.log(`Sending OTP to ${to} via Twilio`);
    
    // actual Twilio logic here
  }
}

export default TwilioProvider; 