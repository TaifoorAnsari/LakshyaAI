/**
 * Logging Configuration (Winston)
 * 
 * Replaces console.log entirely. Structured JSON in production,
 * colorized human-readable in development.
 * 
 * WHY: console.log is unstructured, unsearchable, and has no levels.
 * Winston gives us error/warn/info/debug levels, file output,
 * and structured JSON for log aggregation services.
 */

const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  })
);

// Structured JSON format for production (consumed by log aggregation tools)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const isDev = process.env.NODE_ENV !== 'production';

const transports = [
  // Always log to console
  new winston.transports.Console({
    format: isDev ? devFormat : prodFormat,
  }),
];

// In production, also write to files
if (!isDev) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: prodFormat,
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: prodFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  transports,
  // Don't crash the app if logging fails
  exitOnError: false,
});

// Create a Morgan-compatible write stream so HTTP request logs flow through Winston
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = { logger };
