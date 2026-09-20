import app from "./app.js";
import initializeModels from "./src/models/index.js";
import { initializeTopology } from "./src/messaging/index.js";
import logger from "./src/utils/Logger.js";
import dotenv from "dotenv";
dotenv.config()
const PORT = process.env.PORT || 3004;

async function startServer() {
  try {
    await initializeModels();


    logger.info("Order Service: Database and models initialized");
    await initializeTopology();
    logger.info("rabbitmq topology initialized");


    const server = app.listen(PORT, () => {
      logger.info(`Order Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");

      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start Order Service:", { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
