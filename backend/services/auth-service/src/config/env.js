import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),

  PORT: Joi.number()
    .port()
    .default(4000),

  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  JWT_SECRET: Joi.string()
    .min(32)
    .required(),

  JWT_ACCESS_EXPIRATION: Joi.string()
    .default("15m"),

  JWT_REFRESH_EXPIRATION: Joi.string()
    .default("7d"),

  REDIS_URL: Joi.string()
    .uri()
    .optional(),

  KAFKA_BROKERS: Joi.string()
    .default("localhost:9092"),

  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .default(12),

  MAX_LOGIN_ATTEMPTS: Joi.number()
    .integer()
    .default(5),

  LOCK_TIME: Joi.number()
    .integer()
    .default(900000), // 15 minutes in ms
  RABBITMQ_URL: Joi.string()
    .uri()
    .required(),

  // Shared secret for service-to-service calls to /internal/*. Unset = those routes answer 503.
  INTERNAL_API_KEY: Joi.string()
    .min(32)
    .optional(),

  // Other services are reached through the gateway (a warehouse's contact follows its store manager).
  API_GATEWAY_URL: Joi.string()
    .uri()
    .default("http://api-gateway:4000"),

  // Where staff sign in; added to the "your login is ready" SMS when set.
  ADMIN_APP_URL: Joi.string()
    .uri()
    .optional(),

  // ponytail: add "messagecentral" here with its provider at launch.
  SMS_PROVIDER: Joi.string()
    .valid("console")
    .default("console")
})
  .unknown(); // Allow other environment variables

const { error, value: env } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true, // Converts strings to numbers automatically
});

if (error) {
  console.error("❌ Invalid environment variables:");
  error.details.forEach((detail) => {
    console.error(`- ${detail.message}`);
  });
  process.exit(1);
}

// An OTP must never reach a production log.
if (env.NODE_ENV === "production" && env.SMS_PROVIDER === "console") {
  console.error("❌ SMS_PROVIDER=console is not allowed when NODE_ENV=production");
  process.exit(1);
}

export { env };