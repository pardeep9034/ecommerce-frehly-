import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import ResponseUtil from "./src/utils/response.js";

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
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

/* ================= BODY PARSER ================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("Config Service req:", req.method, req.originalUrl);
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

// app.use("/config", configRoutes); // Placeholder

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.json({
    message: "Veggie E-commerce Config Service",
    version: "1.0.0",
    status: "running"
  });
});

/* ================= 404 HANDLER ================= */

app.use((req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

/* ================= GLOBAL ERROR HANDLER ================= */

app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  ResponseUtil.error(
    res,
    process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error"
  );
});

export default app;
