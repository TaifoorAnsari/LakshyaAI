/**
 * AuditLog Mongoose Model
 * 
 * Records critical security and identity events per Section 10 requirement:
 * - Login attempts (successful & failed)
 * - Registrations and email verifications
 * - Password changes and reset requests
 * - Logouts and session revocations
 * - Role modifications and account deletions
 * 
 * Captures IP address and User Agent for forensic and compliance tracking.
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null if action was for an unregistered email (e.g. failed login)
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'login_failed',
        'register',
        'verify_email',
        'resend_verification',
        'password_change',
        'password_reset_request',
        'password_reset_complete',
        'logout',
        'token_refresh',
        'role_change',
        'account_deleted',
      ],
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL Index: automatically archive / delete audit logs older than 90 days to keep database lean
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
