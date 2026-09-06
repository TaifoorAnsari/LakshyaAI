/**
 * Authentication Controller
 * 
 * Implements complete authentication lifecycle:
 * - register: Create account, generate 24h verification token, dispatch email
 * - verifyEmail: Validate token, mark verified
 * - resendVerification: Reissue verification email
 * - login: Validate credentials, issue access token and rotating httpOnly refresh cookie
 * - refreshToken: Validate refresh token & token version, issue new access token and rotate cookie
 * - logout: Clear cookie, register audit log
 * - forgotPassword: Generate 1h reset token, send email (generic response to prevent enumeration)
 * - resetPassword: Set new password, bump refreshTokenVersion to revoke all active sessions
 */

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenCookieOptions,
} = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email/emailService');

/**
 * Strips sensitive internal properties before returning user to client
 */
const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    onboarding: user.onboarding,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    createdAt: user.createdAt,
  };
};

/**
 * Helper to record audit events safely without blocking primary flow
 */
const logAudit = async ({ userId = null, action, req, metadata = {} }) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await AuditLog.create({
      userId,
      action,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
      metadata,
    });
  } catch (error) {
    // Audit logging failure should not crash request
    console.error('Failed to write audit log:', error.message);
  }
};

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing account
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409, 'ERR_DUPLICATE_EMAIL'));
    }

    // Initialize user instance (pre-save hook hashes passwordHash)
    const user = new User({
      name,
      email,
      passwordHash: password,
    });

    // Mark email verified by default for now
    user.isEmailVerified = true;
    await user.save();

    // Issue tokens immediately so user is logged in
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    // Record audit trail
    await logAudit({
      userId: user._id,
      action: 'register',
      req,
      metadata: { email: user.email },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        accessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/verify-email/:token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = User.hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new AppError('Verification link is invalid or has expired. Please request a new one.', 400, 'ERR_INVALID_TOKEN')
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await logAudit({
      userId: user._id,
      action: 'verify_email',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully! You can now log in.',
      data: {
        isEmailVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/resend-verification
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success response anyway to avoid email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an unverified account exists with that email, a new verification link has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'This email address is already verified. You can log in.',
      });
    }

    const rawToken = user.createEmailVerificationToken();
    await user.save();

    await sendVerificationEmail({
      toEmail: user.email,
      name: user.name,
      token: rawToken,
    });

    await logAudit({
      userId: user._id,
      action: 'resend_verification',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'A fresh verification link has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Must explicitly select passwordHash since select: false is set on schema
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      await logAudit({
        userId: null,
        action: 'login_failed',
        req,
        metadata: { attemptedEmail: email, reason: 'user_not_found' },
      });
      return next(new AppError('Invalid email or password.', 401, 'ERR_INVALID_CREDENTIALS'));
    }

    // Verify bcrypt password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit({
        userId: user._id,
        action: 'login_failed',
        req,
        metadata: { attemptedEmail: email, reason: 'incorrect_password' },
      });
      return next(new AppError('Invalid email or password.', 401, 'ERR_INVALID_CREDENTIALS'));
    }

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set rotating refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    await logAudit({
      userId: user._id,
      action: 'login',
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * 
 * Token rotation endpoint:
 * Reads httpOnly refresh cookie, verifies it, checks token version,
 * issues a new access token AND rotates the refresh token cookie.
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return next(new AppError('Refresh token not found. Please log in.', 401, 'ERR_NO_REFRESH_TOKEN'));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      // Clear invalid cookie
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401, 'ERR_INVALID_REFRESH_TOKEN'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      return next(new AppError('Account no longer exists.', 401, 'ERR_USER_NOT_FOUND'));
    }

    // Verify token version (invalidates tokens issued prior to password change/logout)
    if (decoded.tokenVersion !== user.refreshTokenVersion) {
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      return next(
        new AppError('Session invalidated. Please log in again.', 401, 'ERR_SESSION_REVOKED')
      );
    }

    // Issue new access token and rotate refresh token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Clear refresh cookie
    res.clearCookie('refreshToken', getRefreshTokenCookieOptions());

    if (req.user) {
      await logAudit({
        userId: req.user._id,
        action: 'logout',
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const rawResetToken = user.createPasswordResetToken();
      await user.save();

      await sendPasswordResetEmail({
        toEmail: user.email,
        name: user.name,
        token: rawResetToken,
      });

      await logAudit({
        userId: user._id,
        action: 'password_reset_request',
        req,
      });
    }

    // Always respond with identical message to prevent user enumeration
    res.status(200).json({
      success: true,
      message: 'If an account with that email address exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = User.hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new AppError('Password reset link is invalid or has expired. Please request a new one.', 400, 'ERR_INVALID_TOKEN')
      );
    }

    // Set new password (pre-save hook hashes it)
    user.passwordHash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Bump refreshTokenVersion: invalidates ALL active refresh tokens across all devices!
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
    await user.save();

    // Clear any existing cookie on the client performing the reset
    res.clearCookie('refreshToken', getRefreshTokenCookieOptions());

    await logAudit({
      userId: user._id,
      action: 'password_reset_complete',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful! Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
