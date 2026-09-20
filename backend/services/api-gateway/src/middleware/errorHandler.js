import logger from "../utils/Logger.js";

const errorHandler = (err, req, res, next) => {

  logger.error(`Gateway Error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    message: "Gateway error"
  });

};

export default errorHandler;