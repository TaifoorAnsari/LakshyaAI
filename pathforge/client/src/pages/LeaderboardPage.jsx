/**
 * Global Student Leaderboard Page
 * 
 * Demonstrates:
 * - Top 3 podium (Gold 1st, Silver 2nd, Bronze 3rd) with crowns and pedestals
 * - Authenticated student's current global rank card
 * - Full ranked table with live XP, levels, streaks, and badge counts
 */

import React, { useEffect, useState } from 'react';
import { useGamificationStore } from '@/store/gamificationStore';
import { useAuthStore } from '@/store/authStore';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  Award,
  Sparkles,
  RefreshCw,
  User as UserIcon,
  Search,
} from 'lucide-react';

export default function LeaderboardPage() {
  const { user: currentUser } = useAuthStore();
  const {
    leaderboard,
    currentUserRank,
    isLoadingLeaderboard,
    fetchLeaderboard,
  } = useGamificationStore();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const allFilteredStudents = leaderboard.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-10">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-gold">
            <Trophy size={14} />
            Hall of Fame
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-surface-dark dark:text-white pt-1">
            Global Learner <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            Recognizing all registered learners, daily streaks, and milestones across PathForge.
          </p>
        </div>

        <button
          onClick={() => fetchLeaderboard()}
          disabled={isLoadingLeaderboard}
          className="btn-secondary text-sm inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
          Refresh Rankings
        </button>
      </div>

      {/* ─── Current User Rank Banner ─────────────────────────────────── */}
      {currentUserRank && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-accent-gold text-2xl font-heading font-bold shrink-0">
              #{currentUserRank.rank}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                Your Current Standing
              </span>
              <h3 className="text-xl font-heading font-bold pt-0.5">
                {currentUser?.name || 'Explorer'}
              </h3>
              <p className="text-xs text-primary-200 mt-0.5">
                Keep completing milestones and quizzes to climb the podium!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-black/20 py-2.5 px-5 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-xl font-heading font-bold text-accent-gold">
                {currentUserRank.xp}
              </div>
              <div className="text-[10px] uppercase font-semibold text-primary-200">Total XP</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-xl font-heading font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame size={16} />
                {currentUser?.currentStreak || 0}
              </div>
              <div className="text-[10px] uppercase font-semibold text-primary-200">Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Podium Showcase (Adapts to available learners) ──────────── */}
      {topThree.length > 0 && (
        <div className="pt-4 pb-2">
          <div
            className={`grid gap-6 items-end max-w-4xl mx-auto ${
              topThree.length === 1
                ? 'grid-cols-1 max-w-sm'
                : topThree.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {/* 2nd Place (Silver) - if at least 2 users */}
            {topThree.length >= 2 && (
              <div className="order-2 sm:order-1 card p-6 text-center border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-primary-950 flex flex-col items-center relative shadow-soft sm:translate-y-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm absolute -top-4 border-2 border-white dark:border-primary-950 shadow-soft">
                  <Medal size={20} className="text-slate-400" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-heading font-bold text-xl mt-3 shadow-xs">
                  {topThree[1].name.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-heading font-bold text-base text-surface-dark dark:text-white mt-3 truncate max-w-full">
                  {topThree[1].name}
                </h4>
                <span className="text-xs text-surface-muted font-medium">
                  Level {topThree[1].level}
                </span>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <Zap size={13} className="text-accent-gold" />
                  {topThree[1].xp} XP
                </div>
                <div className="mt-3 text-[11px] font-semibold text-orange-500 inline-flex items-center gap-1">
                  <Flame size={12} /> {topThree[1].currentStreak}d Streak
                </div>
              </div>
            )}

            {/* 1st Place (Gold Crown) - Always rendered */}
            <div className="order-1 sm:order-2 card p-8 text-center border-accent-gold/60 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-primary-950 flex flex-col items-center relative shadow-card ring-2 ring-accent-gold/40 sm:-translate-y-2">
              <div className="w-12 h-12 rounded-full bg-accent-gold text-white flex items-center justify-center font-bold text-base absolute -top-6 border-4 border-white dark:border-primary-950 shadow-soft">
                <Crown size={24} className="text-white fill-white" />
              </div>
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-accent-gold via-amber-400 to-amber-200 text-primary-950 flex items-center justify-center font-heading font-extrabold text-2xl mt-2 shadow-soft">
                {topThree[0].name.charAt(0).toUpperCase()}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <h4 className="font-heading font-bold text-lg text-surface-dark dark:text-white truncate max-w-[200px]">
                  {topThree[0].name}
                </h4>
                <Sparkles size={14} className="text-accent-gold shrink-0" />
              </div>
              <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                Grand Champion • Level {topThree[0].level}
              </span>
              <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-gold/20 text-accent-gold text-sm font-extrabold shadow-xs">
                <Zap size={14} />
                {topThree[0].xp} XP
              </div>
              <div className="mt-3 text-xs font-bold text-orange-500 inline-flex items-center gap-1">
                <Flame size={14} /> {topThree[0].currentStreak}d Streak
              </div>
            </div>

            {/* 3rd Place (Bronze) - if at least 3 users */}
            {topThree.length >= 3 && (
              <div className="order-3 card p-6 text-center border-amber-800/20 bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-950/20 dark:to-primary-950 flex flex-col items-center relative shadow-soft sm:translate-y-6">
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm absolute -top-4 border-2 border-white dark:border-primary-950 shadow-soft">
                  <Medal size={20} className="text-amber-200" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center font-heading font-bold text-xl mt-3 shadow-xs">
                  {topThree[2].name.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-heading font-bold text-base text-surface-dark dark:text-white mt-3 truncate max-w-full">
                  {topThree[2].name}
                </h4>
                <span className="text-xs text-surface-muted font-medium">
                  Level {topThree[2].level}
                </span>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  <Zap size={13} className="text-accent-gold" />
                  {topThree[2].xp} XP
                </div>
                <div className="mt-3 text-[11px] font-semibold text-orange-500 inline-flex items-center gap-1">
                  <Flame size={12} /> {topThree[2].currentStreak}d Streak
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Full Ranked Table: ALL Students Shown ────────────────────── */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading font-bold text-surface-dark dark:text-white">
                All Enrolled Students
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                {leaderboard.length} Total
              </span>
            </div>
            <p className="text-xs text-surface-muted mt-0.5">
              Every student who created an account, ranked by verified milestone progress and streaks.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3.5 top-3 text-surface-muted" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-xs py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary-100 dark:border-primary-900 text-xs font-bold uppercase tracking-wider text-surface-muted">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Streak</th>
                <th className="py-3 px-4">Badges</th>
                <th className="py-3 px-4 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100 dark:divide-primary-900/50">
              {allFilteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-muted text-sm">
                    {searchTerm
                      ? `No students found matching "${searchTerm}".`
                      : 'No student accounts found yet.'}
                  </td>
                </tr>
              ) : (
                allFilteredStudents.map((entry) => {
                  const isMe =
                    (currentUser?.id && (entry._id === currentUser.id || entry._id === currentUser._id)) ||
                    (currentUser?._id && (entry._id === currentUser._id || entry._id === currentUser.id)) ||
                    (currentUser?.name && entry.name === currentUser.name && entry.xp === (currentUserRank?.xp ?? currentUser.xp));

                  return (
                    <tr
                      key={entry._id}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-primary-100/70 dark:bg-primary-900/40 font-semibold border-l-4 border-l-primary-600'
                          : 'hover:bg-primary-50/40 dark:hover:bg-primary-900/20'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        {entry.rank === 1 ? (
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-accent-gold/20 text-accent-gold font-bold text-sm shadow-xs"
                            title="1st Place Champion"
                          >
                            🥇
                          </span>
                        ) : entry.rank === 2 ? (
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-xs"
                            title="2nd Place"
                          >
                            🥈
                          </span>
                        ) : entry.rank === 3 ? (
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-700/20 text-amber-700 dark:text-amber-300 font-bold text-sm shadow-xs"
                            title="3rd Place"
                          >
                            🥉
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-800 text-xs font-bold text-primary-700 dark:text-primary-300">
                            #{entry.rank}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {entry.name ? entry.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                          </div>
                          <div>
                            <div className="font-semibold text-surface-dark dark:text-white flex items-center gap-2">
                              <span>{entry.name}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-600 text-white">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                          Lv {entry.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                          <Flame size={13} />
                          {entry.currentStreak}d
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-surface-muted font-medium">
                          <Award size={14} className="text-accent-gold" />
                          {entry.badgeCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-heading font-bold text-base text-accent-gold">
                          {entry.xp} XP
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
