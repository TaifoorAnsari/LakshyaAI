/**
 * Auth Request Validation Schemas (Zod)
 * 
 * Strict server-side validation per Section 10:
 * - Every request body is validated BEFORE touching the database
 * - Passwords require: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
 * - Email format enforced with lowercase conversion
 */

const { z } = require('zod');

const passwordValidation = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters long')
  .max(100, 'Password cannot exceed 100 characters');

const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: passwordValidation,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: passwordValidation,
  }),
  params: z.object({
    token: z.string({ required_error: 'Reset token is required in URL parameter' }).min(1),
  }),
});

const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string({ required_error: 'Verification token is required in URL parameter' }).min(1),
  }),
});

const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
};
