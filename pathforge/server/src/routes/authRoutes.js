/**
 * Authentication Routes
 * 
 * Mounts all auth endpoints under /api/v1/auth:
 * - POST /register
 * - GET  /verify-email/:token
 * - POST /resend-verification
 * - POST /login
 * - POST /refresh
 * - POST /logout
 * - POST /forgot-password
 * - POST /reset-password/:token
 * 
 * Enforces Zod validation, rate limiting, and slow-down defense.
 */

const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authLimiter, authSpeedLimiter } = require('../middleware/rateLimit');
const { optionalAuth } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} = require('../validators/authValidators');

const router = express.Router();

// Registration & Verification
router.post('/register', authSpeedLimiter, authLimiter, validate(registerSchema), authController.register);
router.get('/verify-email/:token', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', authLimiter, validate(resendVerificationSchema), authController.resendVerification);

// Login & Session Management
router.post('/login', authSpeedLimiter, authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', optionalAuth, authController.logout);

// Password Recovery
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
