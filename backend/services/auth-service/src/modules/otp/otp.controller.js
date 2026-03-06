import otpService from "./otp.service.js";
import ResponseUtil from "../../utils/response.js";

class otpController{
   async resendOtp(req, res) {

  const { phone } = req.body;

  const result = await otpService.resendOtp(phone);

  if (result.success === true) {

    return ResponseUtil.success(
      res,
      null,
      result.message,
      result.statusCode || 200,
      result.data
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