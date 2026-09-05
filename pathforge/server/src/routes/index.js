/**
 * API v1 Router
 * 
 * All API routes are mounted under /api/v1.
 * Currently only contains the health check — each feature phase
 * will add its own route module here.
 */

const express = require('express');
const mongoose = require('mongoose');
const { getRedisClient, isRedisAvailable } = require('../config/redis');

const router = express.Router();

/**
 * GET /api/v1/health
 * 
 * Health check endpoint for load balancers and uptime monitors.
 * Returns the status of the API, MongoDB, and Redis connections.
 * In dev mode, the server is considered healthy even without Redis.
 */
router.get('/health', async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let redisStatus = 'not configured';
  try {
    const redis = getRedisClient();
    if (redis) {
      const pong = await redis.ping();
      redisStatus = pong === 'PONG' ? 'connected' : 'disconnected';
    } else {
      redisStatus = isDev ? 'skipped (dev mode)' : 'disconnected';
    }
  } catch {
    redisStatus = isDev ? 'skipped (dev mode)' : 'disconnected';
  }

  // In dev, only MongoDB is required. In prod, both are required.
  const mongoOk = mongoStatus === 'connected';
  const redisOk = isRedisAvailable();
  const isHealthy = isDev ? mongoOk : (mongoOk && redisOk);

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
    },
  });
});

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const clusterRoutes = require('./clusterRoutes');
const roadmapRoutes = require('./roadmapRoutes');

// Mount Feature Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clusters', clusterRoutes);
router.use('/roadmaps', roadmapRoutes);

module.exports = router;
