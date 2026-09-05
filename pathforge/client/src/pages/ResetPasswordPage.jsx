/**
 * Reset Password Page
 * 
 * Sets a new password using the cryptographically verified token from URL:
 * /reset-password/:token
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message ||
          'Reset link is invalid or has expired. Please request a new one.'
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="card max-w-md w-full text-center p-8 animate-slide-up">
          <div className="w-16 h-16 bg-accent-teal/10 text-accent-teal rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-heading font-bold">Password reset complete</h2>
          <p className="mt-3 text-sm text-surface-muted leading-relaxed">
            Your password has been changed successfully. All previous active sessions have been
            securely terminated.
          </p>
          <div className="mt-8 pt-6 border-t border-primary-100 dark:border-primary-900">
            <Link to="/login" className="btn-primary w-full py-2.5">
              Sign in with new password
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="card max-w-md w-full p-8 shadow-card">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Choose a new password</h1>
          <p className="text-sm text-surface-muted mt-2">
            Enter a new password for your PathForge account.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input
                type="password"
                placeholder="••••••••••••"
                {...register('password')}
                className="input-field pl-10"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-accent-rose">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input
                type="password"
                placeholder="••••••••••••"
                {...register('confirmPassword')}
                className="input-field pl-10"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-accent-rose">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 py-3 text-sm font-semibold shadow-card"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Updating password...
              </>
            ) : (
              <>
                Update password
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-muted">
          Back to{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
