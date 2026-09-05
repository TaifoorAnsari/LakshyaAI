/**
 * User Request Validation Schemas (Zod)
 * 
 * Validates onboarding preferences, profile modifications, and password changes.
 */

const { z } = require('zod');

const onboardingSchema = z.object({
  body: z.object({
    goalText: z
      .string({ required_error: 'Learning goal is required' })
      .trim()
      .min(2, 'Please describe your goal with at least 2 characters')
      .max(200, 'Goal description cannot exceed 200 characters'),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
      required_error: 'Skill level is required (beginner, intermediate, or advanced)',
    }),
    hoursPerWeek: z.coerce
      .number({ required_error: 'Hours per week is required' })
      .min(1, 'Minimum 1 hour per week')
      .max(80, 'Maximum 80 hours per week'),
    learningStyle: z.enum(['visual', 'reading', 'hands-on'], {
      required_error: 'Learning style is required (visual, reading, or hands-on)',
    }),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'New password must be at least 6 characters long')
      .max(100, 'New password cannot exceed 100 characters'),
  }),
});

module.exports = {
  onboardingSchema,
  updateProfileSchema,
  changePasswordSchema,
};
