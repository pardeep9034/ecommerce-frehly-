import app from './app.js';
import initializeModels from './models/index.js';
import redisManager from './config/redis.js';
import kafkaManager from './config/kafka.js';
import logger from './utils/Logger.js';
import { env } from './config/env.js';
import { startOtpConsumer } from './events/consumer.js';

const PORT = env.PORT || 3001;

async function startServer() {
  try {
    // 1. Initialize database and models
    await initializeModels();
    logger.info('✅ Auth Service: Database and models initialized');

    // 2. Connect Redis (non-blocking — service works without it)
    if (env.REDIS_URL) {
      try {
        await redisManager.connect();
      } catch (err) {
        logger.warn(`⚠️ Redis connection failed, continuing without it: ${err.message}`);
      }
    } else {
      logger.warn('⚠️ REDIS_URL not set — token blacklisting/sessions disabled');
    }

    // 3. Connect Kafka Consumers
    try {
      await startOtpConsumer();
      logger.info('✅ Auth Service: OTP Consumer started');
    } catch (err) {
      logger.error(`❌ Failed to start OTP Consumer: ${err.message}`);
    }

    // 4. Connect HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Auth Service running on port ${PORT} [${env.NODE_ENV}]`);
    });

    // 5. Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await redisManager.disconnect().catch(() => {});
        await kafkaManager.disconnect().catch(() => {});
        logger.info('✅ Auth Service shut down cleanly');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error(`❌ Failed to start Auth Service: ${error.message}`);
    process.exit(1);
  }
}

startServer();
