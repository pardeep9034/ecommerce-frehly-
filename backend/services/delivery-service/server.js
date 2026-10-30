import app from "./app.js";
import  initializeModels  from "./src/models/index.js";
import { env } from "./src/config/env.js";
import logger from "./src/utils/Logger.js";
import HandleOrderService from "./src/modules/handleOrder/handleOrder.service.js";

const PORT = env.PORT;
const RETURN_SWEEP_MS = 5 * 60 * 1000;

async function startServer() {
  try {
    /* ================= INITIALIZE DATABASE ================= */
    await initializeModels();
    logger.info("Delivery Service: Database and models initialized");

    /* ================= START SERVER ================= */
    const server = app.listen(PORT, () => {
      logger.info(`Delivery Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    // Riders holding goods owed to a store past the limit: flagged once, and the store gets a text. unref: the sweep
    // never keeps the process alive on shutdown.
    setInterval(() => {
      HandleOrderService.flagOverdueReturns().catch((error) => logger.error(`Overdue return sweep failed: ${error.message}`));
    }, RETURN_SWEEP_MS).unref();

    /* ================= GRACEFUL SHUTDOWN ================= */
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error("Failed to start Delivery Service:", { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
