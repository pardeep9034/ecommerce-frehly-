import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import registerProxies from "./src/proxy/proxy.register.js";
import requestLogger from "./src/middleware/logger.js";
import errorHandler from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
    credentials: true
}));
/* Register all service proxies */
registerProxies(app);

app.use(express.json());

app.use(requestLogger);



/* Gateway health check */
app.get("/", (req, res) => {
  res.json({
    message: "Freshly API Gateway",
    status: "running"
  });
});

app.use(errorHandler);

app.listen(4000, () => {
  console.log("API Gateway running on port 4000");
});