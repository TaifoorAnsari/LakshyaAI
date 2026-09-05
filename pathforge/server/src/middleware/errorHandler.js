/**
 * Centralized Error Handler
 * 
 * Every error in the app flows through here. Returns a consistent
 * JSON envelope: { success: false, error: { message, code } }.
 * 
 * WHY: Without this, Express sends HTML error pages or leaks stack traces.
 * A single handler ensures consistent error responses and proper logging.
 */

const { logger } = require('../config/logger');

/**
 * Custom application error class.
 * Use this to throw errors with specific HTTP status codes.
 * 
 * Example: throw new AppError('User not found', 404);
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.isOperational = true; // Distinguishes expected errors from bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware (4 arguments = error handler).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default to 500 if no status code set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'ERR_INTERNAL';

  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'ERR_VALIDATION';
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // Mongoose duplicate key error → 409
  if (err.code === 11000) {
    statusCode = 409;
    code = 'ERR_DUPLICATE';
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for: ${field}`;
  }

  // Mongoose bad ObjectId → 400
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'ERR_INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'ERR_INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'ERR_TOKEN_EXPIRED';
    message = 'Token expired';
  }

  // Log the error (full stack in dev, structured in prod)
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Client error:', {
      message,
      code,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Never leak stack traces in production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(isDev && { stack: err.stack }),
    },
  });
};

module.exports = { AppError, errorHandler };
