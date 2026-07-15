import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import ResponseUtil from "./src/utils/response.js";
import deliveryRoutes from "./src/modules/delivery/delivery.routes.js";
import deliveryPartnerRoutes from "./src/modules/deliveryPartner/deliveryPartner.routes.js";
import deliveryZoneRoutes from "./src/modules/deliveryZone/deliveryZone.routes.js";
import deliveryPartnerZoneRoutes from "./src/modules/deliveryPartnerZone/deliveryPartnerZone.routes.js";
import handleOrderRoutes from "./src/modules/handleOrder/handleOrder.routes.js";

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
  windowMs: 60 * 1000, 
  max: 500,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development" 
});
app.use(limiter);

/* ================= BODY PARSER ================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= REQUEST LOGGING ================= */
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({
    message: "Veggie E-commerce Delivery Service",
    version: "1.0.0",
    status: "running"
  });
});

/* ================= ROUTES ================= */
app.use("/deliveries", deliveryRoutes);
app.use("/delivery-partners", deliveryPartnerRoutes);
app.use("/delivery-zones", deliveryZoneRoutes);
app.use("/delivery-partner-zones", deliveryPartnerZoneRoutes);
app.use("/handle-orders", handleOrderRoutes);

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((error, req, res, next) => {
  console.error("Global error handler (Delivery Service):", error);

  if (error.name === "SequelizeValidationError") {
    const errors = error.errors.map((err) => ({
      field: err.path,
      message: err.message
    }));

    return ResponseUtil.validationError(res, errors);
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return ResponseUtil.error(res, "Resource already exists", 409);
  }

  if (error.isOperational || error.statusCode) {
    return ResponseUtil.error(res, error.message, error.statusCode || 500);
  }

  ResponseUtil.error(
    res,
    process.env.NODE_ENV === "development" ? error.message : "Internal server error"
  );
});

export default app;
