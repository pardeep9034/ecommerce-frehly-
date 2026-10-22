import app from "./app.js";
import initializeModels from "./src/models/index.js";
import { initializeTopology } from "./src/messaging/index.js";
import {registerCartConsumers} from "./src/modules/addToCart/registerConsumers.js";
import logger from "./src/utils/Logger.js";

const PORT = process.env.PORT || 3002;

// Checkout reads the cart over HTTP, so the API must not wait for the broker: retry until it is up. Once
// consuming, a lost connection still exits and the restart brings the consumers back (design D10).
async function startMessaging() {
  for (;;) {
    try {
      await initializeTopology();
      await registerCartConsumers();
      return logger.info("✅ Cart Service: Messaging topology initialized, consumers registered");
    } catch (error) {
      logger.warn(`Cart Service: RabbitMQ not ready (${error.message}), retrying in 5 s`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function startServer() {

  try {

    /* ================= INITIALIZE DATABASE ================= */

    await initializeModels();

    logger.info("✅ Cart Service: Database and models initialized");
    void startMessaging();

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