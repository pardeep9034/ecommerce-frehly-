import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),

  PORT: Joi.number()
    .default(3006),

  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  JWT_SECRET: Joi.string()
    .min(32)
    .required(),

  ALLOWED_ORIGINS: Joi.string()
    .optional(),

  AUTH_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3001"),

  // Shared with auth-service: the key delivery-service sends in x-internal-key when it calls /internal/*.
  INTERNAL_API_KEY: Joi.string()
    .min(32)
    .required(),

  // Where an invited partner opens the app (the link in the invite text). Docker and production must set it.
  PARTNER_APP_URL: Joi.string()
    .uri()
    .when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.any().default("http://localhost:5173") }),

  ORDER_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3004/orders"),
  INVENTORY_SERVICE_WAREHOUSE_URL:Joi.string().uri(),
  DELIVERY_SERVICE_URL:Joi.string().uri(),

  // Partner documents live encrypted on disk (AES-256-GCM). STORAGE_KEY is 32 bytes as 64 hex characters.
  STORAGE_DIR: Joi.string().default("data/partner-docs"),
  STORAGE_KEY: Joi.string().hex().length(64).required(),
  // Keyed hash of Aadhaar / licence / PAN numbers, used only to spot a number reused on another application.
  DOC_HASH_KEY: Joi.string().min(32).required(),

  // ponytail: add "messagecentral" here with its provider at launch (DELIVERY_PARTNER_ONBOARDING_DESIGN.md §6.8).
  SMS_PROVIDER: Joi.string().valid("console").default("console"),

  // How long after a delivery partner is assigned each stage of the
  // simulated delivery timeline takes (see scheduleAutoProgression).
  AUTO_PROGRESS_PICKUP_MS: Joi.number().default(2 * 60 * 1000),
  AUTO_PROGRESS_TRANSIT_MS: Joi.number().default(5 * 60 * 1000),
  AUTO_PROGRESS_DELIVERED_MS: Joi.number().default(10 * 60 * 1000)
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error("Invalid environment variables");
  console.error(error.details.map((e) => e.message).join("\n"));
  process.exit(1);
}

// A text can carry an applicant's details; the console provider must never run in production.
if (value.NODE_ENV === "production" && value.SMS_PROVIDER === "console") {
  console.error("SMS_PROVIDER=console is not allowed when NODE_ENV=production");
  process.exit(1);
}

export const env = value;
