/**
 * Register Page
 * 
 * New user signup:
 * - Simple client-side Zod validation
 * - Instant account creation and auto-login
 * - Redirects directly to Dashboard
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const loginToStore = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const { user, accessToken } = response.data.data;
      loginToStore(user, accessToken);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Failed to create account. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="card max-w-md w-full p-8 shadow-card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 mb-3">
            <span className="font-heading font-bold text-primary-600 text-xl">P</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Create your account</h1>
          <p className="text-sm text-surface-muted mt-2">
            Start building your personalized learning roadmap today.
          </p>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
              <input
                type="text"
                placeholder="Ada Lovelace"
                {...register('name')}
                className="input-field pl-10"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-accent-rose">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
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

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
              Password
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

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted mb-1.5">
              Confirm Password
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 py-3 text-sm font-semibold shadow-card hover:shadow-glow"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-surface-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
