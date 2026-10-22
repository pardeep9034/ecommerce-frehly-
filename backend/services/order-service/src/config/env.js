import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),

  PORT: Joi.number()
    .default(3004),

  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  ALLOWED_ORIGINS: Joi.string()
    .optional(),

  JWT_SECRET: Joi.string()
    .min(32)
    .optional(),

  PRODUCT_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3002"),
    RABBITMQ_URL:Joi.string(),

  INVENTORY_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3003"),
     CART_SERVICE_URL: Joi.string()
    .uri()
    .default("http://localhost:3005"),
    AUTH_SERVICE_URL:Joi.string().uri().default("http://localhost:3000"),
  API_GATEWAY_URL:Joi.string().uri().optional(),
  // Saved order rules (payment window); read with INTERNAL_API_KEY.
  CONFIG_SERVICE_URL: Joi.string().uri().default("http://config-service:3007"),
  // Same value as inventory-service: reserving / releasing stock for a customer's order needs it.
  INTERNAL_API_KEY: Joi.string().min(32).optional(),

  PAYMENT_GATEWAY: Joi.string().default("mock"),
  PAYMENT_WEBHOOK_SECRET: Joi.string().optional(),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional()

}).unknown(true)


const { error, value } = envSchema.validate(process.env);

if (error) {
  console.error("Invalid environment variables");
  console.error(error.details.map((e) => e.message).join("\n"));
  process.exit(1);
}

export const env = value;
