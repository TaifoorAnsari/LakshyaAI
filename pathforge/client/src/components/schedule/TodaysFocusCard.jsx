/**
 * Today's Focus Widget
 * 
 * Embeds in the main student dashboard:
 * - Shows today's scheduled study sessions
 * - Displays active milestone context & quick resource jump
 * - Allows 1-click completion toggle (+streak encouragement)
 * - If no schedule exists, shows a 1-click generator CTA
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScheduleStore } from '@/store/scheduleStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export default function TodaysFocusCard() {
  const { todayData, fetchTodaySessions, updateSessionStatus, isGenerating } = useScheduleStore();
  const { activeRoadmap } = useRoadmapStore();

  useEffect(() => {
    fetchTodaySessions();
  }, [fetchTodaySessions]);

  const sessions = todayData?.sessions || [];
  const activeMilestone = todayData?.activeMilestone || null;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const allCompletedToday = sessions.length > 0 && completedCount === sessions.length;

  // If student doesn't have an active roadmap yet, hide or show quiet prompt
  if (!activeRoadmap) return null;

  return (
    <div className="card p-6 border-primary-200/80 dark:border-primary-800/60 bg-gradient-to-br from-white via-primary-50/10 to-primary-100/20 dark:from-surface-card dark:via-primary-950/20 dark:to-primary-900/10 relative overflow-hidden">
      {/* Decorative accent background pill */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-primary-100 dark:border-primary-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-surface-dark dark:text-white flex items-center gap-2">
              Today&apos;s Focus
              {sessions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300">
                  {completedCount}/{sessions.length} done
                </span>
              )}
            </h2>
            <p className="text-xs text-surface-muted">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/schedule"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
          >
            Full Timetable <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ─── State 1: Scheduled Sessions Exist Today ─────────────────── */}
      {sessions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {sessions.map((session) => {
            const isDone = session.status === 'completed';
            return (
              <div
                key={session._id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 opacity-90'
                    : 'bg-white/80 dark:bg-surface-card border-primary-100 dark:border-primary-800 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSessionStatus(session._id, isDone ? 'scheduled' : 'completed');
                    }}
                    className={`mt-0.5 p-1 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer relative z-10 ${
                      isDone
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-surface-muted hover:text-primary-600'
                    }`}
                    aria-label={isDone ? 'Mark uncompleted' : 'Mark completed (+Streak)'}
                    title={isDone ? 'Mark uncompleted' : 'Mark completed (+Streak)'}
                  >
                    {isDone ? <CheckCircle2 size={22} className="text-emerald-500 fill-emerald-500/20" /> : <Circle size={22} />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                        Milestone #{session.milestoneOrder}
                      </span>
                      <span className="text-surface-muted text-xs">•</span>
                      <span className="text-xs text-surface-muted flex items-center gap-1 font-medium">
                        <Clock size={12} />
                        {session.startTime} - {session.endTime} ({session.durationMinutes} min)
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-semibold ${
                        isDone
                          ? 'line-through text-surface-muted'
                          : 'text-surface-dark dark:text-white'
                      }`}
                    >
                      {session.milestoneTitle}
                    </h3>
                    {session.topicsCovered?.length > 0 && (
                      <p className="text-xs text-surface-muted">
                        {session.topicsCovered.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to="/roadmap"
                    className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                  >
                    <BookOpen size={13} />
                    Open Resources
                  </Link>
                </div>
              </div>
            );
          })}

          {allCompletedToday && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>
                Awesome work! All scheduled sessions for today are complete. Your streak is protected!
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ─── State 2: No Sessions Scheduled for Today ─────────────── */
        <div className="mt-4 p-5 rounded-2xl bg-white/60 dark:bg-primary-950/30 border border-dashed border-primary-200 dark:border-primary-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 mx-auto flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-surface-dark dark:text-white">
              No Study Sessions Scheduled for Today
            </h3>
            <p className="text-xs text-surface-muted max-w-md mx-auto">
              {activeMilestone
                ? `You can still review "${activeMilestone.title}" at your own pace, or customize your study days in your timetable.`
                : 'Configure your weekly availability to generate a structured timetable that fits your goals.'}
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            <Link to="/schedule" className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5">
              <Calendar size={14} />
              Open Study Timetable
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
