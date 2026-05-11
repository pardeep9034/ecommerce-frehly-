import z from 'zod';
import dotenv from 'dotenv';
dotenv.config();


const envSchema = z.object({
    PORT: z.coerce.number().default(3005),
    NODE_ENV: z.string().default("development"),
    DATABASE_URL: z.url(),
    PRODUCT_SERVICE_URL: z.string(),
    INVENTORY_SERVICE_URL: z.string(),
    JWT_SECRET: z.string(),
  


});

const env = envSchema.parse(process.env);
export default env;
