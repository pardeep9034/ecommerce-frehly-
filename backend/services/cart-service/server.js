import app from "./app.js";
import initializeModels from "./src/models/index.js";
import { initializeTopology } from "./src/messaging/index.js";
import {registerCartConsumers} from "./src/modules/addToCart/registerConsumers.js";
import logger from "./src/utils/Logger.js";

const PORT = process.env.PORT || 3002;

async function startServer() {

  try {

    /* ================= INITIALIZE DATABASE ================= */

    await initializeModels();

    logger.info("✅ Cart Service: Database and models initialized");
    await initializeTopology();
    logger.info("✅ Cart Service: Messaging topology initialized");
    await registerCartConsumers();
    logger.info("✅ Cart Service: Consumers registered");

    /* ================= START SERVER ================= */

    const server = app.listen(PORT, () => {

      logger.info(`🚀 Cart Service running on port ${PORT}`);
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

    logger.error("❌ Failed to start Cart Service:", { message: error.message, stack: error.stack });

    process.exit(1);

  }

}

startServer();