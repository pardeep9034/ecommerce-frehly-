import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import ResponseUtil from "./src/utils/response.js";
import orderRoutes from "./src/modules/order/order.routes.js";

dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  credentials: true
}));

app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development"
});

app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

app.get("/", (req, res) => {
  res.json({
    message: "Order Service",
    version: "1.0.0",
    status: "running"
  });
});

app.use("/orders", orderRoutes);

app.use((req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  if (error.name === "SequelizeValidationError") {
    const errors = error.errors.map((err) => ({
      field: err.path,
      message: err.message
    }));

    return ResponseUtil.validationError(res, errors);
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return ResponseUtil.error(res, "Resource already exists", 400);
  }

  if (error.isOperational || error.statusCode) {
    return ResponseUtil.error(res, error.message, error.statusCode || 500);
  }

  return ResponseUtil.error(
    res,
    process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error"
  );
});

export default app;
