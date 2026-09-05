/**
 * Forgot Password Page
 * 
 * Initiates password reset by submitting user's email address.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await api.post('/auth/forgot-password', data);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="card max-w-md w-full text-center p-8 animate-slide-up">
          <div className="w-16 h-16 bg-accent-teal/10 text-accent-teal rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-heading font-bold">Check your inbox</h2>
          <p className="mt-3 text-sm text-surface-muted leading-relaxed">
            If an account exists for <strong className="text-surface-dark dark:text-white">{submittedEmail}</strong>,
            we sent a password reset link. Please check your inbox and spam folders.
          </p>
          <div className="mt-8 pt-6 border-t border-primary-100 dark:border-primary-900">
            <Link to="/login" className="btn-primary w-full py-2.5">
              Return to Sign in
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Reset your password</h1>
          <p className="text-sm text-surface-muted mt-2">
            Enter your email address and we&apos;ll send you a link to choose a new password.
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
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="input-field pl-10"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-accent-rose">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 py-3 text-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-muted">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
