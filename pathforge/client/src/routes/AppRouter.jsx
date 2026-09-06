/**
 * Application Router
 * 
 * Central routing configuration using React Router v6.
 * All pages render inside the Layout wrapper (navbar + footer).
 * 
 * Guards:
 * - ProtectedRoute: Gated to authenticated users
 * - PublicOnlyRoute: Gated to unauthenticated guests (redirects signed-in users to /dashboard)
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import BadgeUnlockModal from '@/components/BadgeUnlockModal';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';

export default function AppRouter() {
  return (
    <>
      <BadgeUnlockModal />
      <Routes>
      <Route element={<Layout />}>
        {/* Public home page */}
        <Route path="/" element={<HomePage />} />

        {/* Public-only authentication routes */}
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Public token verification */}
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        {/* Protected student routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Gamification routes */}
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/roadmap" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-6xl font-heading font-bold text-primary-300">404</h1>
              <p className="mt-4 text-lg text-surface-muted">
                This path hasn&apos;t been forged yet.
              </p>
              <a href="/" className="mt-6 btn-primary">
                Go home
              </a>
            </div>
          }
        />
      </Route>
    </Routes>
    </>
  );
}
