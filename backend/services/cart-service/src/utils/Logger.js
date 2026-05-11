import winston from "winston";
import  env  from "../config/env.js";

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleLogFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    env.NODE_ENV === "development" ? colorize() : json()
  ),
  transports: [
    new winston.transports.Console({
      format:
        env.NODE_ENV === "development"
          ? combine(colorize(), consoleLogFormat)
          : json(),
    }),
  ],
});

if (env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({ filename: "logs/error.log", level: "error" })
  );
  logger.add(new winston.transports.File({ filename: "logs/combined.log" }));
}

export default logger;
