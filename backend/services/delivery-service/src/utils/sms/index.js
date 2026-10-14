import { env } from "../../config/env.js";
import * as consoleProvider from "./console.provider.js";

// ponytail: console only. Add messagecentral.provider.js here and to the SMS_PROVIDER
// list in config/env.js at launch (DELIVERY_PARTNER_ONBOARDING_DESIGN.md §6.8).
const providers = { console: consoleProvider };

const provider = providers[env.SMS_PROVIDER];

// send({ to, text, kind }) with kind = "OTP" | "TRANSACTION"
export const send = (message) => provider.send(message);
