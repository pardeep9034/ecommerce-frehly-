class ResponseUtil {
  success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  error(res, message = "Internal Server Error", statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors
    });
  }

  notFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      message
    });
  }
}

export default new ResponseUtil();
