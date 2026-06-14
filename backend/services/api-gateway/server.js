import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import registerProxies from "./src/proxy/proxy.register.js";
import requestLogger from "./src/middleware/logger.js";
import errorHandler from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
    credentials: true
}));

app.use(requestLogger);
registerProxies(app);


/* Gateway health check */
app.get("/", (req, res) => {
  res.json({
    message: "Freshly API Gateway",
    status: "running"
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});