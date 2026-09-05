/**
 * Rate Limiting and Slow-Down Middleware
 * 
 * Implements Section 10 security requirement:
 * - authLimiter: Limits brute-force login and registration attempts
 * - authSpeedLimiter: Progressively slows down responses after repeated requests before hard cutoff
 * - apiLimiter: General rate limit across all public endpoints
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { env } = require('../config/env');

const isDev = env.NODE_ENV === 'development';

/**
 * Auth rate limiter:
 * Production: 10 requests per 15 minutes per IP
 * Development: 50 requests per 15 minutes to allow smooth manual testing
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'ERR_RATE_LIMIT_EXCEEDED',
    },
  },
});

/**
 * Auth slow-down middleware:
 * Adds 500ms delay per request once 5 attempts occur within the window,
 * ramping up gradually to discourage rapid automated credential stuffing.
 */
const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: isDev ? 20 : 5,
  delayMs: (hits) => (hits - (isDev ? 20 : 5)) * 500,
  maxDelayMs: 4000,
});

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please slow down.',
      code: 'ERR_RATE_LIMIT_EXCEEDED',
    },
  },
});

module.exports = {
  authLimiter,
  authSpeedLimiter,
  apiLimiter,
};
