import { env } from "./config/env.js";

// Every message text lives here, reviewed in git. SMS entries also carry their DLT template id (design D6):
// DLT refuses any text that differs from the registered one, so an SMS text changes only with a new id.
const sms = (priority, staleAfterMin, text) =>
  ({ version: 1, channel: "SMS", category: "TRANSACTIONAL", priority, staleAfterMin, dltTemplateId: null, text });

const templates = {
  // Customer, picked by the order's new status (intake ORDER_TEXTS).
  "order.placed": sms(2, 60, "Freshly: order #{{orderNumber}} is placed. Total Rs {{amount}}. We'll text you when it is out for delivery."),
  "order.needs_confirmation": sms(2, 120, "Freshly: some items in order #{{orderNumber}} are unavailable. Open the app to confirm the rest."),
  "order.out_for_delivery": sms(2, 30, "Freshly: your order #{{orderNumber}} is out for delivery. Please keep your phone handy."),
  "order.delivered": sms(3, 120, "Freshly: order #{{orderNumber}} has been delivered. Thank you for shopping with us."),
  "order.cancelled": sms(2, 240, "Freshly: order #{{orderNumber}} has been cancelled. Open the app for details."),
  "order.delivery_failed": sms(2, 120, "Freshly: we couldn't deliver order #{{orderNumber}}. Open the app to see what happens next."),
  // A step of a return the customer asked for; intake's RETURN_WORDS fill {{update}}.
  "order.return_update": sms(2, 240, "Freshly: your return on order #{{orderNumber}}: {{update}}. Open the app for details."),

  // Partner and store, moved word for word from delivery-service's notify.js (onboarding design §6.7).
  "partner.invite": sms(3, 1440, "Freshly: we've started your delivery partner application. Finish signing up here: {{appUrl}}/partner/apply?phone={{phone}}"),
  "partner.received": sms(3, 1440, "Freshly: we got your partner application FR-P-{{ref}}. We'll text you within 1-2 working days."),
  "partner.changes": sms(3, 1440, "Freshly: we need a few changes to FR-P-{{ref}}. Open the app to see what."),
  "partner.reupload": sms(3, 1440, "Freshly: we need a new {{doc}} for FR-P-{{ref}}. Open the app to see what."),
  "partner.approved": sms(3, 1440, "Freshly: you're approved, {{name}}! Sign in to go online."),
  "partner.rejected": sms(3, 1440, "Freshly: we couldn't approve FR-P-{{ref}}. You can apply again after {{date}}."),
  "store.delivery_failed": sms(1, 60, "Freshly: order #{{order}} could not be delivered (attempt {{n}} of {{max}}): {{reason}}. Reassign or cancel it in the admin panel."),
  "store.delivery_failed_final": sms(1, 60, "Freshly: order #{{order}} could not be delivered (attempt {{n}} of {{max}}): {{reason}}. No attempts left, please cancel or return it."),
  "store.return_overdue": sms(1, 120, "Freshly: {{partner}} ({{partnerPhone}}) has goods from order #{{order}} for 2+ hrs, not returned yet."),
  "store.return_requested": sms(2, 240, "Freshly: a customer asked to return items from order #{{order}}. Review it on the store Returns page."),

  "alert.warehouse_status": {
    version: 1, channel: "EMAIL", category: "ALERT", priority: 3, staleAfterMin: 120, preference: "warehousePauses",
    subject: "Freshly: {{warehouseName}} is {{status}}",
    text: "{{warehouseName}} is now {{status}} (was {{oldStatus}}).\nChanged by: {{changedBy}}\nWhen: {{when}} IST\n\n{{appUrl}}/admin/warehouses/{{warehouseId}}",
  },
  "alert.warehouse_location": {
    version: 1, channel: "EMAIL", category: "ALERT", priority: 3, staleAfterMin: 120, preference: "warehousePauses",
    subject: "Freshly: {{warehouseName}} location changed",
    text: "{{warehouseName}}'s location was changed. This can change which customers it serves.\n{{changes}}\nChanged by: {{changedBy}}\nWhen: {{when}} IST\n\n{{appUrl}}/admin/warehouses/{{warehouseId}}",
  },
  "alert.partner_application": {
    version: 1, channel: "EMAIL", category: "ALERT", priority: 3, staleAfterMin: 120, preference: "partnerApplies",
    subject: "Freshly: new partner application FR-P-{{refNo}}",
    text: "A delivery partner application is waiting for review.\nReference: FR-P-{{refNo}}\nVehicle: {{vehicleType}}\n\n{{appUrl}}/admin/delivery-partners/applications/{{applicationId}}",
  },
  "alert.payment_failures": {
    version: 1, channel: "EMAIL", category: "ALERT", priority: 3, staleAfterMin: 120, preference: "failedPayments",
    subject: "Freshly: {{count}} failed payments in the last hour",
    text: "{{count}} payments failed in the last {{windowMinutes}} minutes.\n\n{{appUrl}}/admin/orders",
  },
  "digest.daily_sales": {
    version: 1, channel: "EMAIL", category: "DIGEST", priority: 5, staleAfterMin: 120, preference: "dailySummary",
    subject: "Freshly daily summary, {{date}}",
    text: [
      "Today until 10 PM (IST)",
      "Orders              {{orders}}",
      "Cancelled           {{cancelled}} ({{cancelRate}})",
      "Revenue             Rs {{revenue}}",
      "Average delivery    {{avgDelivery}}",
      "",
      "Dashboard: {{appUrl}}/admin",
      'You get this because "Daily sales summary at 10 PM" is on in Settings → Notifications.',
    ].join("\n"),
  },
};

export default templates;

// Replaces each {{name}}; a missing value throws, and the dispatcher marks the row FAILED (TEMPLATE_ERROR).
const fill = (text, vars) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const value = name === "appUrl" ? env.APP_URL : vars[name];
    if (value === undefined || value === null || value === "") throw new Error(`missing template variable "${name}"`);
    return String(value);
  });

// The GSM-7 basic set. One character outside it switches the whole text to UCS-2 (70 characters a segment, billed
// twice or more); the extension characters (^{}[]~|\€) count double, so they are dropped too.
const GSM7 = new Set("@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà");
export const SMS_VALUE_MAX = 30;

// What a variable may put into a text: one line, straight quotes, "Rs" for "₹", GSM-7 only, at most 30 characters.
// A longer value is cut at the last whole word, without the dangling " -" or "," the cut leaves.
export const cleanSmsValue = (value) => {
  const clean = [...String(value)
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―]/g, "-")
    .replace(/₹/g, "Rs")
    .replace(/\s+/g, " ")]
    .filter((char) => GSM7.has(char))
    .join("")
    .trim();
  if (clean.length <= SMS_VALUE_MAX) return clean;
  const cut = clean.slice(0, SMS_VALUE_MAX + 1);
  const words = cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")) : cut.slice(0, SMS_VALUE_MAX);
  return words.replace(/[\s\-,.;:]+$/, "");
};

export function render(templateKey, vars) {
  const template = templates[templateKey];
  if (!template) throw new Error(`unknown template "${templateKey}"`);
  if (template.channel === "SMS") {
    // A value that cleans to nothing counts as missing, so fill() throws instead of sending a broken text.
    const clean = Object.fromEntries(Object.entries(vars).map(([name, value]) => [name, value == null ? value : cleanSmsValue(value)]));
    return { text: fill(template.text, clean) };
  }
  return {
    // A line break in a subject would start a new mail header.
    subject: template.subject && fill(template.subject, vars).replace(/[\r\n]+/g, " "),
    text: fill(template.text, vars),
  };
}
