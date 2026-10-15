import { send } from "./sms/index.js";
import logger from "./Logger.js";

// Texts from DELIVERY_PARTNER_ONBOARDING_DESIGN.md §6.7. Each must be registered as a DLT template and sent word for word.
// Straight apostrophes and plain dates only (the DLT check can refuse curly quotes). `name` comes from safeName(), `doc`
// from docLabel() and `date` from formatDate(), all in partnerApplicationRules.js.
const TEMPLATES = {
  // `link` is PARTNER_APP_URL + the apply path (P3-9). No name: nothing here needs the DLT check's character rules.
  invite: ({ link }) => `Freshly: we've started your delivery partner application. Finish signing up here: ${link}`,
  received: ({ ref }) => `Freshly: we got your partner application FR-P-${ref}. We'll text you within 1-2 working days.`,
  changes: ({ ref }) => `Freshly: we need a few changes to FR-P-${ref}. Open the app to see what.`,
  reupload: ({ ref, doc }) => `Freshly: we need a new ${doc} for FR-P-${ref}. Open the app to see what.`,
  approved: ({ name }) => `Freshly: you're approved, ${name}! Sign in to go online.`,
  rejected: ({ ref, date }) => `Freshly: we couldn't approve FR-P-${ref}. You can apply again after ${date}.`,
};

// A failed text must never fail the request that asked for it (an approval must stand), so log and return.
export const sms = async (phone, key, vars) => {
  try {
    await send({ to: phone, kind: "TRANSACTION", text: TEMPLATES[key](vars) });
  } catch (error) {
    logger.error(`Failed to send "${key}" text: ${error.message}`);
  }
};
