import app from "./app.js";
import  initializeModels  from "./src/models/index.js";
import logger from "./src/utils/Logger.js";

const PORT = process.env.PORT || 3002;

async function startServer() {

  try {

    /* ================= INITIALIZE DATABASE ================= */

    await initializeModels();

    logger.info("✅ Product Service: Database and models initialized");

    /* ================= START SERVER ================= */

    const server = app.listen(PORT, () => {

      logger.info(`🚀 Product Service running on port ${PORT}`);
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

    logger.error("❌ Failed to start Product Service:", { message: error.message, stack: error.stack });

    process.exit(1);

  }

}

startServer();