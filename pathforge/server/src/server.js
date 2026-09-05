/**
 * Server Entry Point
 * 
 * Connects to MongoDB and Redis, then starts the Express server.
 * Handles graceful shutdown on SIGTERM/SIGINT so connections
 * are closed cleanly (important for Docker, Kubernetes, and
 * deployment platforms like Render/Railway).
 * 
 * WHY separate from app.js?
 * app.js exports the configured Express app for testing.
 * server.js handles the infrastructure (DB connections, port binding, shutdown).
 */

const { env } = require('./config/env');
const { logger } = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { connectRedis, disconnectRedis } = require('./config/redis');
const app = require('./app');

let server;

const startServer = async () => {
  try {
    // Connect to databases before accepting requests
    await connectDB(env.MONGO_URI);
    connectRedis(env.REDIS_URL);

    server = app.listen(env.PORT, () => {
      logger.info(`🚀 PathForge API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Handle unhandled promise rejections (e.g. a forgotten .catch())
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle termination signals (Docker stop, Ctrl+C, deployment restart)
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Gracefully shut down: stop accepting new connections,
 * close database connections, then exit.
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      await disconnectRedis();
      logger.info('All connections closed. Exiting.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful close hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

startServer();
