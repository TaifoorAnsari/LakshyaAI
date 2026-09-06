/**
 * Authenticated Student Dashboard Page
 * 
 * Demonstrates:
 * - Active user profile details & gamification stats (XP, Level, Streak)
 * - Current active personalized learning roadmap (`RoadmapVisualizer`)
 * - One-click roadmap generation & enrollment for newly onboarded students
 * - Live generation progress bar
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useGamificationStore } from '@/store/gamificationStore';
import RoadmapVisualizer from '@/features/roadmap/RoadmapVisualizer';
import BadgeIcon from '@/components/BadgeIcon';
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
  Trophy,
  Award,
  ChevronRight,
  Info,
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

  const {
    stats,
    badges,
    fetchStats,
    fetchBadges,
    showBadgeCelebration,
  } = useGamificationStore();

  const hasCompletedOnboarding = !!user?.onboarding?.completedAt;

  useEffect(() => {
    fetchActiveRoadmap();
    fetchStats();
    fetchBadges();
  }, [fetchActiveRoadmap, fetchStats, fetchBadges]);

  const handleStartGeneration = () => {
    if (!user?.onboarding?.goalText) return;
    generateAndEnroll({
      goalText: user.onboarding.goalText,
      skillLevel: user.onboarding.skillLevel,
      hoursPerWeek: user.onboarding.hoursPerWeek,
      learningStyle: user.onboarding.learningStyle,
    });
  };

  const currentLevel = stats?.level || user?.level || 1;
  const currentXp = stats?.xp ?? (user?.xp || 0);
  const levelProg = stats?.levelProgression || {
    xpCurrentLevel: 0,
    xpForNextLevel: 100,
    progressPercentage: 0,
    xpToNextLevel: 100,
  };
  const earnedBadges = badges.filter((b) => b.isEarned);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">
            Welcome back, <span className="text-gradient">{user?.name || 'Explorer'}</span>!
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            Track your milestones, protect your streak, and level up your mastery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/leaderboard"
            className="btn-secondary text-sm inline-flex items-center gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Trophy size={16} className="text-amber-500" />
            <span>Leaderboard</span>
          </Link>
          <Link to="/onboarding" className="btn-secondary text-sm">
            <Sparkles size={16} />
            {hasCompletedOnboarding ? 'Update Preferences' : 'Start Onboarding'}
          </Link>
        </div>
      </div>

      {/* ─── Enhanced Gamification Widgets Grid ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Level & XP Progression Card */}
        <div className="card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-primary-50/20 to-primary-100/30 dark:from-surface-card dark:via-primary-950/20 dark:to-primary-900/20 border-primary-200/80 dark:border-primary-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-surface-muted">
                Player Rank
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                  Level {currentLevel}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  {currentLevel < 3 ? 'Novice' : currentLevel < 7 ? 'Practitioner' : 'Master'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-teal text-white flex items-center justify-center font-heading font-bold text-xl shadow-soft">
              {currentLevel}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-surface-dark dark:text-surface-light flex items-center gap-1">
                <Zap size={14} className="text-accent-gold fill-accent-gold" />
                {currentXp} Total XP
              </span>
              <span className="text-surface-muted font-medium">
                {levelProg.xpToNextLevel} XP to Lv {currentLevel + 1}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-primary-100 dark:bg-primary-900/60 overflow-hidden p-0.5 border border-primary-200/50 dark:border-primary-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-teal transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(5, levelProg.progressPercentage))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-surface-muted pt-0.5">
              <span>{levelProg.xpCurrentLevel} XP</span>
              <span>{levelProg.xpForNextLevel} XP required</span>
            </div>
          </div>
        </div>

        {/* 2. Streak & Freeze Shield Card */}
        <div className="card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-orange-50/20 to-amber-100/20 dark:from-surface-card dark:via-orange-950/20 dark:to-amber-900/20 border-orange-200/60 dark:border-orange-900/40">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-surface-muted">
                Daily Discipline
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-orange-500">
                  {stats?.currentStreak || user?.currentStreak || 0} Day Streak
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-soft">
              <Flame size={26} className="animate-pulse fill-orange-500/30" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-orange-100 dark:border-orange-950 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-dark dark:text-white font-medium flex items-center gap-1.5">
                <Flame size={14} className="text-orange-500" />
                <span>All-Time Best:</span>
                <span className="font-bold text-orange-500">
                  {stats?.longestStreak || user?.longestStreak || 0} Days
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                {(stats?.currentStreak || user?.currentStreak || 0) > 0 ? 'Active Habit' : 'Start Today'}
              </span>
            </div>

            <p className="text-[11px] text-surface-muted leading-tight pt-0.5">
              {(stats?.currentStreak || user?.currentStreak || 0) > 0
                ? 'Pass a milestone quiz each day to keep your daily study streak burning!'
                : 'Study and pass a milestone assessment today to begin your streak!'}
            </p>
          </div>
        </div>

        {/* 3. Achievements & Badges Showcase Card */}
        <div className="card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-yellow-100/20 dark:from-surface-card dark:via-amber-950/20 dark:to-yellow-900/20 border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-surface-muted">
                Achievements
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                  {earnedBadges.length} / {badges.length || 12}
                </span>
                <span className="text-xs text-surface-muted font-medium">Unlocked</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-soft">
              <Award size={26} />
            </div>
          </div>

          <div className="mt-4 pt-3 space-y-3">
            {/* Badges Mini Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {badges.length === 0 ? (
                <span className="text-xs text-surface-muted">Loading achievements...</span>
              ) : (
                badges.slice(0, 6).map((badge) => {
                  const isEarned = badge.isEarned;
                  return (
                    <button
                      key={badge._id || badge.code}
                      onClick={() => showBadgeCelebration(badge)}
                      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shrink-0 ${
                        isEarned
                          ? 'bg-amber-500/15 border border-amber-500/50 shadow-sm cursor-pointer'
                          : 'bg-primary-100/60 dark:bg-primary-900/40 border border-dashed border-primary-300 dark:border-primary-800 opacity-40 grayscale cursor-default'
                      }`}
                      title={`${badge.name}: ${badge.description} (${badge.xpReward} XP)`}
                    >
                      <BadgeIcon icon={badge.icon} size={18} />
                      {isEarned && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-primary-950" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-surface-muted text-[11px]">
                {earnedBadges.length === 0
                  ? 'Complete a quiz to earn your first badge!'
                  : `Recent: ${earnedBadges[earnedBadges.length - 1]?.name}`}
              </span>
              <Link
                to="/leaderboard"
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline inline-flex items-center gap-0.5 text-xs"
              >
                Catalog <ChevronRight size={13} />
              </Link>
            </div>
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
