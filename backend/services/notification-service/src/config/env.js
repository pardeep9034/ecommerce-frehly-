import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3008),
  DATABASE_URL: Joi.string().uri().required(),
  RABBITMQ_URL: Joi.string().uri({ scheme: ["amqp", "amqps"] }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  ALLOWED_ORIGINS: Joi.string().optional(),

  // Shared by every service: what callers send in x-internal-key, and what we send to auth-service.
  INTERNAL_API_KEY: Joi.string().min(32).required(),
  // Keys the destination hash, so nobody can reverse it by trying every phone number. Changing it resets rate-limit history.
  NOTIFICATION_HASH_KEY: Joi.string().min(32).required(),

  AUTH_SERVICE_URL: Joi.string().uri().default("http://auth-service:3001"),
  ORDER_SERVICE_URL: Joi.string().uri().default("http://order-service:3004"),
  // The client app (storefront, /admin, /partner). Every link in a message starts with it.
  APP_URL: Joi.string().uri().required(),

  // ponytail: console only until launch (design Phase 3 adds messagecentral and smtp).
  EMAIL_PROVIDER: Joi.string().valid("console").default("console"),
  SMS_PROVIDER: Joi.string().valid("console").default("console"),
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error("Invalid environment variables");
  console.error(error.details.map((e) => e.message).join("\n"));
  process.exit(1);
}

// The console provider prints message text; it must never run in production.
for (const name of ["EMAIL_PROVIDER", "SMS_PROVIDER"]) {
  if (value.NODE_ENV === "production" && value[name] === "console") {
    console.error(`${name}=console is not allowed when NODE_ENV=production`);
    process.exit(1);
  }
}

export const env = value;
