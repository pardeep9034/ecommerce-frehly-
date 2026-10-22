import otpService from "./otp.service.js";
import ResponseUtil from "../../utils/response.js";

class otpController{
   async resendOtp(req, res) {

  const { phone,type } = req.body;

  const result = await otpService.resendOtp(phone,type);

  if (result.success === true) {

    // Outside development every success reply carries data: {}, so it doesn't show whether the number is registered.
    return ResponseUtil.success(
      res,
      result.data ?? {},
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

}
export default new otpController();