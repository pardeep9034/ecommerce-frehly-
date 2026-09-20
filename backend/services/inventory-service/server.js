import app from "./app.js";
import  initializeModels  from "./src/models/index.js";
import logger from "./src/utils/Logger.js";

const PORT = process.env.PORT || 3003; // Using 3003 to avoid conflicts, standardizing Ports later

async function startServer() {
  try {
    /* ================= INITIALIZE DATABASE ================= */
    await initializeModels();
    logger.info("✅ Inventory Service: Database and models initialized");


    /* ================= START SERVER ================= */
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Inventory Service running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
    });

    /* ================= GRACEFUL SHUTDOWN ================= */
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error("❌ Failed to start Inventory Service:", { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
