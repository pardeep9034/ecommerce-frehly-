import logger from "../utils/Logger.js";

const requestLogger = (req, res, next) => {

  logger.info(`${req.method} ${req.originalUrl}`);

  next();

};

export default requestLogger;