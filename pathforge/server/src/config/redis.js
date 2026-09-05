/**
 * Redis Connection (ioredis)
 * 
 * Used for: caching cluster-match results, rate limiting backing,
 * refresh-token blocklist, BullMQ queue backend, leaderboard cache.
 * 
 * In DEVELOPMENT: Redis is optional. If it can't connect, the app
 * continues without it and `getRedisClient()` returns null.
 * Any code using Redis should check for null first.
 * 
 * In PRODUCTION: Redis is required and the app will keep retrying.
 * 
 * WHY ioredis over node-redis: better TypeScript types, built-in cluster support,
 * and BullMQ requires ioredis specifically.
 */

const Redis = require('ioredis');
const { logger } = require('./logger');

let redisClient = null;
let redisAvailable = false;

const connectRedis = (url) => {
  const isDev = process.env.NODE_ENV !== 'production';

  redisClient = new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: true,
    lazyConnect: isDev, // In dev, don't block startup
    retryStrategy(times) {
      if (isDev && times > 3) {
        // In dev, stop retrying after 3 attempts — Redis is optional
        logger.warn('Redis unavailable — running without it (dev mode)');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis retry attempt ${times}, next retry in ${delay}ms`);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('ready', () => {
    redisAvailable = true;
    logger.info('Redis ready to accept commands');
  });

  redisClient.on('error', (err) => {
    // Only log once in dev to avoid spamming the console
    if (!isDev || redisAvailable) {
      logger.error('Redis connection error:', err.message);
    }
    redisAvailable = false;
  });

  redisClient.on('close', () => {
    redisAvailable = false;
    if (!isDev) {
      logger.warn('Redis connection closed');
    }
  });

  // In dev, attempt connection but don't crash if it fails
  if (isDev) {
    redisClient.connect().catch(() => {
      logger.warn('⚠️  Redis not available — running without cache/queues (dev mode)');
      logger.warn('   Install Redis or Memurai for full functionality');
    });
  }

  return redisClient;
};

/**
 * Get the active Redis client instance.
 * Returns null if Redis is not available (dev mode without Redis).
 * Callers should always check: if (redis) { ... }
 */
const getRedisClient = () => {
  if (!redisAvailable) {
    return null;
  }
  return redisClient;
};

/**
 * Check if Redis is currently connected and usable.
 */
const isRedisAvailable = () => redisAvailable;

/**
 * Gracefully close Redis connection.
 */
const disconnectRedis = async () => {
  if (redisClient && redisAvailable) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch {
      // Already disconnected
    }
  }
};

module.exports = { connectRedis, getRedisClient, isRedisAvailable, disconnectRedis };
