import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./src/config/env.js";
import { internalRoutes, adminRoutes } from "./src/routes.js";
import ResponseUtil from "./src/utils/response.js";
import logger from "./src/utils/Logger.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGINS?.split(","), credentials: true }));
app.use(express.json({ limit: "100kb" }));

// Method and path only: never a body, a header or a query string.
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => res.json({ service: "notification-service", status: "running" }));

// Service to service. Before the IP limiter: sibling services share a few container IPs.
// It must not live under /notifications, which the gateway forwards by prefix.
app.use("/internal", internalRoutes);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/notifications", adminRoutes);

app.use((req, res) => ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`));

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  // body-parser's own 4xx (bad JSON, too large): its message can quote the body, so neither log nor send it.
  const bodyError = !error.isOperational && status < 500;
  logger.error(`${status} | ${bodyError ? "invalid request body" : error.message} | ${req.method} ${req.path}`);
  if (error.isOperational) return ResponseUtil.error(res, error.message, status);
  if (bodyError) return ResponseUtil.error(res, "Invalid request body", status);
  return ResponseUtil.error(res, env.NODE_ENV === "development" ? error.message : "Internal server error");
});

export default app;
