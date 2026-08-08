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
    .default(7200000), // 2 hours in ms
  RABBITMQ_URL: Joi.string()
    .uri()
    .required()
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

export { env };