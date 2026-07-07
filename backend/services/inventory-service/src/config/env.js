import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid("development", "test", "production")
        .default("development"),

    PORT: Joi.number()
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
        .default(7200000)
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
    console.error("❌ Invalid environment variables");
    console.error(error.details.map(e => e.message).join("\n"));
    process.exit(1);
}

export const env = value;