/**
 * MongoDB Connection (Mongoose)
 * 
 * Connects to MongoDB Atlas (production) or local Docker MongoDB (dev).
 * Handles connection lifecycle events and graceful shutdown.
 * 
 * WHY: Centralizing DB connection prevents multiple connection attempts
 * and ensures we log connection issues clearly.
 */

const mongoose = require('mongoose');
const { logger } = require('./logger');

const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 has good defaults, but we set these explicitly for clarity
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

/**
 * Gracefully close MongoDB connection.
 * Called during SIGTERM/SIGINT handling in server.js.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

module.exports = { connectDB, disconnectDB };
