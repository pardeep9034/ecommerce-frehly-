import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import ResponseUtil from "./src/utils/response.js";
import categoryRoutes from "./src/modules/category/category.routes.js";
import productRoutes from "./src/modules/product/product.routes.js";
import variantRoutes from "./src/modules/productVarient/variant.routes.js";
import promotionRoutes from "./src/modules/promotion/promotion.routes.js";
import promotionItemRoutes from "./src/modules/promotionItem/promotionItem.routes.js";

dotenv.config();





const app = express();

/* ================= SECURITY MIDDLEWARE ================= */

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(","),
  credentials: true
}));

app.use(cookieParser());

/* ================= RATE LIMIT ================= */

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 500,            // 500 requests per minute
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development" // disable in dev mode
});

app.use(limiter);

/* ================= BODY PARSER ================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.originalUrl);
  next();
});
/* ================= REQUEST LOGGING ================= */

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

/* ================= ROUTES ================= */

app.use("/category", categoryRoutes);
app.use("/promotions", promotionRoutes);
app.use("/promotion-items", promotionItemRoutes);
app.use("/", productRoutes);
app.use("/", variantRoutes);

// since variantRoutes use /:productId/variants and /variants/:id it's better mounted at root or /products

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.json({
    message: "Veggie E-commerce Product Service",
    version: "1.0.0",
    status: "running"
  });
});

/* ================= 404 HANDLER ================= */

app.use( (req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

/* ================= GLOBAL ERROR HANDLER ================= */

app.use((error, req, res, next) => {

  console.error("Global error handler:", error);

  if (error.name === "SequelizeValidationError") {

    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));

    return ResponseUtil.validationError(res, errors);
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return ResponseUtil.error(res, "Resource already exists", 400);
  }

  ResponseUtil.error(
    res,
    process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error"
  );
});

export default app;