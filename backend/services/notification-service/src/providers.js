import crypto from "node:crypto";
import logger from "./utils/Logger.js";

// One provider per channel. send() resolves { messageId } or throws; error.transient === false means "don't retry".
// ponytail: console only until launch (env.js refuses it in production); Phase 3 adds Message Central (SMS) and SMTP.
const consoleEmail = {
  name: "console",
  async send({ masked, subject, text }) {
    logger.info(`[email:console] to=${masked} subject="${subject}"\n${text}`);
    return { messageId: `console-${crypto.randomUUID()}` };
  },
};

// The number in the log is masked; the full text is what DLT would see.
const consoleSms = {
  name: "console",
  async send({ masked, text }) {
    logger.info(`[sms:console] to=${masked} text="${text}"`);
    return { messageId: `console-${crypto.randomUUID()}` };
  },
};

export default { EMAIL: consoleEmail, SMS: consoleSms };
