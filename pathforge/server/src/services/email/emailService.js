/**
 * Transactional Email Service
 * 
 * Sends verification emails and password reset links.
 * 
 * In PRODUCTION: Integrates with Nodemailer / transactional provider (SendGrid, Resend, or SMTP).
 * In DEVELOPMENT (or if no API key configured):
 *   Renders the branded HTML and outputs the action link directly to Winston logger
 *   so you can click the link and test the full flow without external dependencies.
 */

const nodemailer = require('nodemailer');
const { env } = require('../../config/env');
const { logger } = require('../../config/logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // If credentials are provided, configure nodemailer transport
  if (env.EMAIL_PROVIDER_API_KEY) {
    transporter = nodemailer.createTransport({
      service: 'SendGrid', // Or SMTP host configuration
      auth: {
        user: 'apikey',
        pass: env.EMAIL_PROVIDER_API_KEY,
      },
    });
  }

  return transporter;
};

/**
 * Generate standard PathForge email layout with brand colors
 */
const renderEmailHtml = ({ title, preheader, bodyContent, buttonText, buttonUrl }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F3FF; margin: 0; padding: 20px; color: #1E1B2E; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EDE9FE; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #7C3AED; padding: 28px 24px; text-align: center; }
    .brand { color: #FFFFFF; font-size: 24px; font-weight: 700; text-decoration: none; letter-spacing: -0.5px; }
    .content { padding: 32px 28px; line-height: 1.6; font-size: 16px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { background: #7C3AED; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #EDE9FE; }
    .raw-link { word-break: break-all; color: #7C3AED; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="brand">🔥 PathForge</span>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #3B0764;">${title}</h2>
      ${bodyContent}
      ${
        buttonText && buttonUrl
          ? `
        <div class="btn-container">
          <a href="${buttonUrl}" class="btn" target="_blank">${buttonText}</a>
        </div>
        <p style="font-size: 13px; color: #6B7280;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p class="raw-link"><a href="${buttonUrl}">${buttonUrl}</a></p>
      `
          : ''
      }
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} PathForge. All rights reserved. Built for learners, powered by AI.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send email verification link to new user
 */
const sendVerificationEmail = async ({ toEmail, name, token }) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email/${token}`;

  const subject = 'Verify your email address — PathForge';
  const html = renderEmailHtml({
    title: `Welcome to PathForge, ${name}!`,
    preheader: 'Please verify your email address to get started.',
    bodyContent: `
      <p>Thank you for joining PathForge! To activate your account and start generating your personalized AI learning roadmaps, please verify your email address.</p>
      <p>This verification link will expire in <strong>24 hours</strong>.</p>
    `,
    buttonText: 'Verify Email Address',
    buttonUrl: verifyUrl,
  });

  const mailer = getTransporter();

  if (mailer) {
    await mailer.sendMail({
      from: `"PathForge" <${env.EMAIL_FROM_ADDRESS}>`,
      to: toEmail,
      subject,
      html,
    });
    logger.info(`Verification email sent to ${toEmail}`);
  } else {
    // Development fallback: Log link directly to console for instant developer testing
    logger.info('────────────────────────────────────────────────────────────────────────');
    logger.info(`📧 [DEV EMAIL] Verification email for: ${toEmail}`);
    logger.info(`🔗 Click to verify: ${verifyUrl}`);
    logger.info('────────────────────────────────────────────────────────────────────────');
  }

  return { success: true, verifyUrl };
};

/**
 * Send password reset link to user
 */
const sendPasswordResetEmail = async ({ toEmail, name, token }) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password/${token}`;

  const subject = 'Reset your password — PathForge';
  const html = renderEmailHtml({
    title: 'Password Reset Request',
    preheader: 'Reset your PathForge account password.',
    bodyContent: `
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset the password for your PathForge account. Click the button below to choose a new password.</p>
      <p>This link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your account remains secure.</p>
    `,
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
  });

  const mailer = getTransporter();

  if (mailer) {
    await mailer.sendMail({
      from: `"PathForge" <${env.EMAIL_FROM_ADDRESS}>`,
      to: toEmail,
      subject,
      html,
    });
    logger.info(`Password reset email sent to ${toEmail}`);
  } else {
    logger.info('────────────────────────────────────────────────────────────────────────');
    logger.info(`📧 [DEV EMAIL] Password reset email for: ${toEmail}`);
    logger.info(`🔗 Click to reset password: ${resetUrl}`);
    logger.info('────────────────────────────────────────────────────────────────────────');
  }

  return { success: true, resetUrl };
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
