import { env } from "./src/config/env.js";
import app from "./app.js";
import { sequelize } from "./src/db.js";
import { broker, initializeTopology } from "./src/messaging/index.js";
import { registerNotificationConsumers } from "./src/registerConsumers.js";
import { startDispatcher, stopDispatcher } from "./src/dispatcher.js";
import { startScheduler, stopScheduler } from "./src/scheduler.js";
import logger from "./src/utils/Logger.js";

// The HTTP intake (delivery-service has no broker) must not wait for RabbitMQ: retry until it is up. Once
// consuming, a lost connection exits and the restart brings the consumer back (design D10).
async function consumeWhenReady() {
  for (;;) {
    try {
      await initializeTopology();
      await registerNotificationConsumers();
      return logger.info("Notification Service: messaging topology initialized, consumers registered");
    } catch (error) {
      logger.warn(`RabbitMQ not ready (${error.message}), retrying in 5 s`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// models → dispatcher → scheduler → listen, with the queue joining when the broker is up. An unreachable
// database exits; compose restarts us.
async function start() {
  try {
    await sequelize.authenticate();
    void consumeWhenReady();
    startDispatcher();
    startScheduler();
    const server = app.listen(env.PORT, () => logger.info(`Notification Service running on port ${env.PORT} (${env.NODE_ENV})`));

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down`);
      stopScheduler();
      stopDispatcher();
      server.close(async () => {
        await broker.disconnect().catch(() => {});
        await sequelize.close();
        process.exit(0);
      });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error(`Failed to start Notification Service: ${error.message}`);
    process.exit(1);
  }
}

start();
