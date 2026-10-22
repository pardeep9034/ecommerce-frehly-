class ResponseUtil {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = "Internal server error", statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  static notFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static unauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      success: false,
      message
    });
  }
}

export default ResponseUtil;
