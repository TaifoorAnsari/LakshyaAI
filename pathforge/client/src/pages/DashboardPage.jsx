/**
 * Authenticated Student Dashboard Page
 * 
 * Demonstrates:
 * - Active user profile details
 * - Current learning target from onboarding preferences
 * - Gamification stats (XP, Level, Streak)
 * - Quick link to configure or re-run onboarding
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sparkles, Flame, Zap, ArrowRight, BookOpen, Compass, Clock, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const hasCompletedOnboarding = !!user?.onboarding?.completedAt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">
            Welcome back, <span className="text-gradient">{user?.name || 'Explorer'}</span>!
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            Track your milestones and forge your path forward.
          </p>
        </div>

        <Link to="/onboarding" className="btn-primary">
          <Sparkles size={16} />
          {hasCompletedOnboarding ? 'Update Goal' : 'Start Onboarding'}
        </Link>
      </div>

      {/* ─── Onboarding Prompt Banner (if not completed yet) ─────────── */}
      {!hasCompletedOnboarding && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
              <Sparkles size={13} />
              Setup Required
            </span>
            <h2 className="text-xl font-heading font-bold pt-1">
              Set up your personalized learning roadmap
            </h2>
            <p className="text-sm text-primary-100 leading-relaxed">
              Tell PathForge what you want to learn, your background, and your schedule. Our AI cluster engine will tailor your study path.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="btn bg-white text-primary-700 hover:bg-primary-50 py-3 px-6 text-sm font-semibold shrink-0 shadow-soft inline-flex items-center gap-2"
          >
            Launch Onboarding Wizard
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ─── Active Target Card (if onboarding is completed) ─────────── */}
      {hasCompletedOnboarding && (
        <div className="card p-6 sm:p-8 bg-white dark:bg-primary-900/40 border-primary-200 dark:border-primary-800/80 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-primary-100 dark:border-primary-900">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-teal uppercase tracking-wider mb-1">
                <CheckCircle2 size={14} />
                Active Learning Target
              </div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                {user.onboarding.goalText}
              </h2>
            </div>
            <Link
              to="/onboarding"
              className="btn-secondary text-xs py-2 px-3 self-start md:self-auto"
            >
              Modify Target
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30">
              <Compass size={20} className="text-primary-600 shrink-0" />
              <div>
                <div className="text-xs text-surface-muted">Level</div>
                <div className="font-semibold capitalize text-surface-dark dark:text-white">
                  {user.onboarding.skillLevel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30">
              <Clock size={20} className="text-primary-600 shrink-0" />
              <div>
                <div className="text-xs text-surface-muted">Schedule</div>
                <div className="font-semibold text-surface-dark dark:text-white">
                  {user.onboarding.hoursPerWeek} hrs / week
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30">
              <Zap size={20} className="text-accent-gold shrink-0" />
              <div>
                <div className="text-xs text-surface-muted">Format</div>
                <div className="font-semibold capitalize text-surface-dark dark:text-white">
                  {user.onboarding.learningStyle}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-gold/10 flex items-center justify-center shrink-0">
            <Zap size={24} className="text-accent-gold" />
          </div>
          <div>
            <div className="text-xs text-surface-muted uppercase font-semibold">Total XP</div>
            <div className="text-2xl font-heading font-bold text-accent-gold">{user?.xp || 0}</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
            <span className="font-heading font-bold text-primary-600 text-lg">Lv</span>
          </div>
          <div>
            <div className="text-xs text-surface-muted uppercase font-semibold">Current Level</div>
            <div className="text-2xl font-heading font-bold text-primary-600">{user?.level || 1}</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <Flame size={24} className="text-orange-500" />
          </div>
          <div>
            <div className="text-xs text-surface-muted uppercase font-semibold">Day Streak</div>
            <div className="text-2xl font-heading font-bold text-orange-500">{user?.currentStreak || 0}</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center shrink-0">
            <BookOpen size={24} className="text-accent-teal" />
          </div>
          <div>
            <div className="text-xs text-surface-muted uppercase font-semibold">Streak Freezes</div>
            <div className="text-2xl font-heading font-bold text-accent-teal">{user?.streakFreezesAvailable || 1}</div>
          </div>
        </div>
      </div>

      {/* ─── Roadmap Generation Teaser ──────────────────────────────── */}
      <div className="card p-8 text-center border-dashed border-2 border-primary-300 dark:border-primary-800">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mx-auto text-primary-600">
            <Sparkles size={28} />
          </div>
          <h3 className="text-xl font-heading font-semibold">
            {hasCompletedOnboarding ? 'Roadmap Ready for Generation' : 'No active roadmap yet'}
          </h3>
          <p className="text-sm text-surface-muted leading-relaxed">
            {hasCompletedOnboarding
              ? `Your preferences for "${user.onboarding.goalText}" are configured. In Phase 4, our cluster matching engine will build your step-by-step tree.`
              : 'Complete the onboarding wizard so PathForge can generate your custom step-by-step roadmap.'}
          </p>
          <div className="pt-2">
            <Link
              to="/onboarding"
              className="btn-primary inline-flex items-center gap-2"
            >
              {hasCompletedOnboarding ? 'Review Target' : 'Start Onboarding Wizard'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
