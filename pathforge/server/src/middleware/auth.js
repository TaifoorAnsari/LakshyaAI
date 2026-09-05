/**
 * Authentication Middleware
 * 
 * Verifies the JWT Access Token supplied in the Authorization header:
 * - Checks format: Bearer <token>
 * - Verifies cryptographic signature with JWT_ACCESS_SECRET
 * - Confirms token expiration
 * - Fetches active user from database
 * - Validates refreshTokenVersion against the user's current version
 *   (enforces immediate revocation upon password changes or session logout)
 * - Attaches user document to req.user
 */

const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401, 'ERR_UNAUTHORIZED'));
    }

    // Verify token cryptographic validity
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please refresh your token.', 401, 'ERR_TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid authentication token.', 401, 'ERR_INVALID_TOKEN'));
    }

    // Find the associated user in MongoDB
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('The account associated with this token no longer exists.', 401, 'ERR_USER_NOT_FOUND'));
    }

    // Check if token version matches (invalidation check)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.refreshTokenVersion) {
      return next(
        new AppError('Session invalidated due to password change or logout. Please log in again.', 401, 'ERR_SESSION_REVOKED')
      );
    }

    // Attach authenticated user to request context
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware:
 * Attaches user if valid token exists, but doesn't throw 401 if missing.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (user && decoded.tokenVersion === user.refreshTokenVersion) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
};
