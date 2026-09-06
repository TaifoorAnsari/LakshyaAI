/**
 * User Controller
 * 
 * Handles user profile management, onboarding answers, password updates,
 * and GDPR-compliant account deletion.
 */

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middleware/errorHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenCookieOptions,
} = require('../utils/jwt');

/**
 * Format user for API response, omitting sensitive fields
 */
const sanitizeUser = (user) => ({
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
  badges: user.badges,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * GET /api/v1/users/me
 * Returns profile for currently authenticated user.
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me
 * Update display name or avatar URL.
 */
const updateMe = async (req, res, next) => {
  try {
    const { name, avatarUrl } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/onboarding
 * Saves student onboarding answers (goal, skill level, hours/week, learning style).
 */
const saveOnboarding = async (req, res, next) => {
  try {
    const { goalText, skillLevel, hoursPerWeek, learningStyle } = req.body;
    const user = req.user;

    user.onboarding = {
      goalText,
      skillLevel,
      hoursPerWeek,
      learningStyle,
      completedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully!',
      data: {
        onboarding: user.onboarding,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/change-password
 * Updates account password, revoking older sessions across other devices.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Explicitly load passwordHash
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect.', 400, 'ERR_INCORRECT_PASSWORD'));
    }

    // Set new password (pre-save hook hashes it)
    user.passwordHash = newPassword;

    // Increment refreshTokenVersion to invalidate all existing refresh tokens
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
    await user.save();

    // Issue fresh tokens for the current browser session
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

    // Write audit record
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      await AuditLog.create({
        userId: user._id,
        action: 'password_change',
        ipAddress: String(ipAddress),
        userAgent: String(req.headers['user-agent'] || 'unknown'),
      });
    } catch (e) {
      console.error('AuditLog error:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
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
 * DELETE /api/v1/users/me
 * GDPR-style account deletion: permanently purges user record.
 */
const deleteMe = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    // Record audit event
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      await AuditLog.create({
        userId: null,
        action: 'account_deleted',
        ipAddress: String(ipAddress),
        userAgent: String(req.headers['user-agent'] || 'unknown'),
        metadata: { deletedUserId: userId },
      });
    } catch (e) {
      console.error('AuditLog error:', e.message);
    }

    // Clear refresh cookie
    res.clearCookie('refreshToken', getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  saveOnboarding,
  changePassword,
  deleteMe,
};
