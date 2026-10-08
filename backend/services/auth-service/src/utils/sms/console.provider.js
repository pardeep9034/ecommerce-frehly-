import logger from "../Logger.js";

// The one place an OTP is logged. Config refuses this provider in production.
export const send = async ({ to, text, kind }) => {
  logger.info(`[sms:console] to=${to} kind=${kind} text="${text}"`);
};
