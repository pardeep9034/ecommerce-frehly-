import logger from "../Logger.js";

// Development only: prints the text instead of sending it. Config refuses this provider in production.
export const send = async ({ to, text, kind }) => {
  logger.info(`[sms:console] to=${to} kind=${kind} text="${text}"`);
};
