/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Enforces role restrictions per Section 10:
 * - Checks req.user.role against permitted roles
 * - Denies 403 Forbidden if user lacks sufficient privilege
 * - Never trusts role claims from client payloads
 */

const { AppError } = require('./errorHandler');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'ERR_UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Permission denied. Role '${req.user.role}' is not authorized to access this resource.`,
          403,
          'ERR_FORBIDDEN'
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
