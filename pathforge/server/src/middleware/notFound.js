/**
 * 404 Not Found Handler
 * 
 * Catches any request that doesn't match a defined route
 * and passes a 404 error to the centralized error handler.
 */

const { AppError } = require('./errorHandler');

const notFound = (req, res, next) => {
  next(new AppError(`Not found: ${req.originalUrl}`, 404, 'ERR_NOT_FOUND'));
};

module.exports = { notFound };
