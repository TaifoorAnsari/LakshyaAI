/**
 * Authenticated Student Dashboard Page
 * 
 * Demonstrates:
 * - Active user profile details & gamification stats (XP, Level, Streak)
 * - Current active personalized learning roadmap (`RoadmapVisualizer`)
 * - One-click roadmap generation & enrollment for newly onboarded students
 * - Live generation progress bar
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import RoadmapVisualizer from '@/features/roadmap/RoadmapVisualizer';
import {
  Sparkles,
  Flame,
  Zap,
  ArrowRight,
  BookOpen,
  Compass,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    activeRoadmap,
    isLoading,
    isGenerating,
    generationProgress,
    error,
    fetchActiveRoadmap,
    generateAndEnroll,
  } = useRoadmapStore();

  const hasCompletedOnboarding = !!user?.onboarding?.completedAt;

  useEffect(() => {
    fetchActiveRoadmap();
  }, [fetchActiveRoadmap]);

  const handleStartGeneration = () => {
    if (!user?.onboarding?.goalText) return;
    generateAndEnroll({
      goalText: user.onboarding.goalText,
      skillLevel: user.onboarding.skillLevel,
      hoursPerWeek: user.onboarding.hoursPerWeek,
      learningStyle: user.onboarding.learningStyle,
    });
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
            Track your milestones and forge your path forward.
          </p>
        </div>

        <Link to="/onboarding" className="btn-secondary text-sm">
          <Sparkles size={16} />
          {hasCompletedOnboarding ? 'Update Goal & Style' : 'Start Onboarding'}
        </Link>
      </div>

      {/* ─── Gamification Stats Grid ─────────────────────────────────── */}
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

      {/* ─── Onboarding Prompt Banner (if not completed yet) ─────────── */}
      {!hasCompletedOnboarding && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
              <Sparkles size={13} />
              Setup Required
            </span>
            <h2 className="text-2xl font-heading font-bold pt-1">
              Set up your personalized learning roadmap
            </h2>
            <p className="text-sm text-primary-100 leading-relaxed">
              Tell PathForge what you want to learn, your background, and your schedule. Our AI cluster engine will tailor your study path.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="btn bg-white text-primary-700 hover:bg-primary-50 py-3.5 px-6 text-sm font-semibold shrink-0 shadow-soft inline-flex items-center gap-2"
          >
            Launch Onboarding Wizard
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ─── Active Roadmap Section ─────────────────────────────────── */}
      {isLoading ? (
        <div className="card p-12 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 mx-auto" />
          <div className="h-4 bg-primary-100 dark:bg-primary-900 rounded max-w-xs mx-auto" />
          <div className="h-3 bg-primary-50 dark:bg-primary-950 rounded max-w-sm mx-auto" />
        </div>
      ) : activeRoadmap ? (
        <RoadmapVisualizer roadmap={activeRoadmap} />
      ) : hasCompletedOnboarding ? (
        /* ─── Forge Your Roadmap CTA (When Onboarded but no active roadmap) ─── */
        <div className="card p-8 sm:p-10 text-center border-dashed border-2 border-primary-300 dark:border-primary-800/80 bg-white/50 dark:bg-primary-950/40">
          <div className="max-w-lg mx-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mx-auto text-primary-600 shadow-soft">
              {isGenerating ? (
                <RefreshCw size={32} className="animate-spin text-primary-600" />
              ) : (
                <Sparkles size={32} />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                {isGenerating ? 'Forging Your Roadmap...' : 'Ready to Forge Your Path?'}
              </h3>
              <p className="text-sm text-surface-muted leading-relaxed">
                {isGenerating
                  ? 'Our two-tier engine is matching and generating your milestone curriculum with verified resources and quizzes.'
                  : `You're targeting "${user.onboarding.goalText}" at a ${user.onboarding.skillLevel} level with ${user.onboarding.hoursPerWeek} hrs/week.`}
              </p>
            </div>

            {/* Error notice if generation failed */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Live Progress Bar during generation */}
            {isGenerating && (
              <div className="space-y-2 max-w-sm mx-auto pt-2">
                <div className="w-full h-2.5 rounded-full bg-primary-100 dark:bg-primary-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-accent-teal transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="text-xs text-primary-600 font-semibold">
                  {generationProgress < 40
                    ? 'Checking curated templates...'
                    : generationProgress < 80
                    ? 'Synthesizing milestone nodes and resources...'
                    : 'Finalizing interactive quiz banks...'}
                </div>
              </div>
            )}

            {!isGenerating && (
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleStartGeneration}
                  className="btn-primary py-3.5 px-6 inline-flex items-center gap-2 shadow-card"
                >
                  <Sparkles size={16} />
                  Forge Roadmap Now
                </button>
                <Link to="/onboarding" className="btn-secondary py-3.5 px-5 text-sm">
                  Modify Preferences
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
