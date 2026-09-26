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

  AUTH_CREATE_USER_PATH: Joi.string()
    .default("/auth/register"),

  ORDER_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3004/orders"),
  INVENTORY_SERVICE_WAREHOUSE_URL:Joi.string().uri(),
  DELIVERY_SERVICE_URL:Joi.string().uri(),

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

export const env = value;
