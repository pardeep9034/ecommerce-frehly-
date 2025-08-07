// services/auth-service/src/utils/response.js
class ResponseUtil {
  success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }
}

module.exports = new ResponseUtil();