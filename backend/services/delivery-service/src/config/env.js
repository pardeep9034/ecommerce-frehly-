import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),

  PORT: Joi.number()
    .default(3005),

  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  ALLOWED_ORIGINS: Joi.string()
    .optional(),

  AUTH_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3001"),

  AUTH_CREATE_USER_PATH: Joi.string()
    .default("/auth/register")
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error("Invalid environment variables");
  console.error(error.details.map((e) => e.message).join("\n"));
  process.exit(1);
}

export const env = value;
