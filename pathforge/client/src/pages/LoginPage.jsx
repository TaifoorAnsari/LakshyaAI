/**
 * Login Page
 * 
 * Authenticates returning students:
 * - Client-side validation via React Hook Form + Zod
 * - Stores JWT access token in Zustand memory store
 * - Redirects to previous URL or dashboard upon success
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const loginToStore = useAuthStore((state) => state.login);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');

    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken } = response.data.data;

      // Update Zustand state
      loginToStore(user, accessToken);

      // Navigate to destination
      navigate(from, { replace: true });
    } catch (err) {
      const errorData = err.response?.data?.error;
      const message = errorData?.message || 'Unable to log in. Please check your credentials.';
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Welcome back</h1>
          <p className="text-sm text-surface-muted mt-2">
            Sign in to continue your learning journey.
          </p>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-muted">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 py-3 text-sm font-semibold shadow-card hover:shadow-glow"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-surface-muted">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
