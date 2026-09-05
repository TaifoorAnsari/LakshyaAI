/**
 * Authenticated Dashboard Page (Placeholder for Phase 3/7)
 * 
 * Demonstrates authenticated user session:
 * - Displays active user profile
 * - Warns if email is unverified with resend action
 * - Shows gamification stats (XP, Level, Streak)
 */

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Sparkles, Flame, Zap, ShieldAlert, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import api from '@/lib/axios';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [resendStatus, setResendStatus] = useState('');

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      await api.post('/auth/resend-verification', { email: user?.email });
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">
            Welcome back, <span className="text-gradient">{user?.name || 'Explorer'}</span>!
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            Ready to continue where you left off?
          </p>
        </div>

        <a href="/onboarding" className="btn-primary">
          <Sparkles size={16} />
          Create New Roadmap
        </a>
      </div>

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

      {/* ─── Active Roadmap Placeholder ─────────────────────────────── */}
      <div className="card p-8 text-center border-dashed border-2 border-primary-300 dark:border-primary-800">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mx-auto text-primary-600">
            <Sparkles size={28} />
          </div>
          <h3 className="text-xl font-heading font-semibold">No active roadmap yet</h3>
          <p className="text-sm text-surface-muted leading-relaxed">
            Tell us your learning goal and our cluster-matching engine will build your personalized path.
          </p>
          <div className="pt-2">
            <a href="/onboarding" className="btn-primary inline-flex items-center gap-2">
              Start Onboarding Wizard
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
