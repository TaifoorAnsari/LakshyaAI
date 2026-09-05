/**
 * User Mongoose Model
 * 
 * Implements the full user schema as specified in Section 8 & Section 10:
 * - Credentials & security: bcrypt password hashing (12 salt rounds), select:false on passwordHash
 * - Session invalidation: refreshTokenVersion counter (bumped on password change / logout-all)
 * - Email verification: crypto tokens with 24h expiration
 * - Password reset: crypto tokens with 1h expiration
 * - Gamification fields: xp, level, streaks, badges (referenced for Phase 8)
 * - Onboarding answers: goal, skill level, hours/week, learning style (Phase 3)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return password in queries unless explicitly requested with .select('+passwordHash')
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [50, 'Name cannot exceed 50 characters'],
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Bumped to invalidate all active refresh tokens for this user
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
    // Onboarding answers captured after first login
    onboarding: {
      goalText: { type: String, default: null },
      skillLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', null],
        default: null,
      },
      hoursPerWeek: { type: Number, default: null },
      learningStyle: {
        type: String,
        enum: ['visual', 'reading', 'hands-on', null],
        default: null,
      },
      completedAt: { type: Date, default: null },
    },
    // Gamification attributes (Section 11)
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    streakFreezesAvailable: {
      type: Number,
      default: 1,
      min: 0,
      max: 3,
    },
    badges: [
      {
        badgeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Badge',
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save hook: Hash password with bcrypt ──────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    // 12 salt rounds minimum per Section 10 security specification
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Instance Method: Compare candidate password with hash ──────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Instance Method: Generate email verification token ─────────────────
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store SHA-256 hash in DB so database breaches do not expose active tokens
  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  // Token valid for 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return rawToken; // Return unhashed token to be emailed to user
};

// ─── Instance Method: Generate password reset token ─────────────────────
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store SHA-256 hash in DB
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  // Token valid for 1 hour
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  return rawToken; // Return unhashed token to be emailed to user
};

// Static helper to hash a raw token for lookup
userSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
