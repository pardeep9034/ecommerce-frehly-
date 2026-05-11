class ProviderInterface {
  async sendOtp(payload) {
    throw new Error("sendOtp must be implemented");
  }
}

export default ProviderInterface;