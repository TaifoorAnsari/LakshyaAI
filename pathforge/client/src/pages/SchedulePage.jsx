/**
 * Study Schedule & Calendar Page
 * 
 * Features:
 * - Timetable calendar & list view of scheduled study sessions
 * - Customization modal/form: Preferred days of week, start time, session duration, weekly hours
 * - One-click .ics Calendar Export (Google Calendar / Apple Calendar / Outlook compatible)
 * - Session completion toggle with status indicators
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScheduleStore } from '@/store/scheduleStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useAuthStore } from '@/store/authStore';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Download,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BookOpen,
  CalendarCheck,
  Flame,
  Check,
  AlertCircle,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function SchedulePage() {
  const { user } = useAuthStore();
  const { activeRoadmap, fetchActiveRoadmap } = useRoadmapStore();
  const {
    schedule,
    roadmap,
    isLoading,
    isGenerating,
    error,
    fetchSchedule,
    generateSchedule,
    updateSessionStatus,
    downloadCalendarICS,
  } = useScheduleStore();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming'); // 'upcoming', 'all', 'calendar'
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());

  // Form preferences state
  const [weeklyHours, setWeeklyHours] = useState(user?.onboarding?.hoursPerWeek || 10);
  const [preferredDays, setPreferredDays] = useState([1, 2, 3, 4, 5]);
  const [dailyStartTime, setDailyStartTime] = useState('18:00');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);

  useEffect(() => {
    fetchActiveRoadmap();
    fetchSchedule();
  }, [fetchActiveRoadmap, fetchSchedule]);

  useEffect(() => {
    if (schedule?.preferences) {
      if (schedule.preferences.weeklyHours) setWeeklyHours(schedule.preferences.weeklyHours);
      if (schedule.preferences.preferredDays) setPreferredDays(schedule.preferences.preferredDays);
      if (schedule.preferences.dailyStartTime) setDailyStartTime(schedule.preferences.dailyStartTime);
      if (schedule.preferences.sessionDurationMinutes)
        setSessionDurationMinutes(schedule.preferences.sessionDurationMinutes);
    }
  }, [schedule]);

  const toggleDay = (dayVal) => {
    if (preferredDays.includes(dayVal)) {
      if (preferredDays.length > 1) {
        setPreferredDays(preferredDays.filter((d) => d !== dayVal));
      }
    } else {
      setPreferredDays([...preferredDays, dayVal].sort());
    }
  };

  const handleSaveAndGenerate = async (e) => {
    e.preventDefault();
    await generateSchedule({
      weeklyHours,
      preferredDays,
      dailyStartTime,
      sessionDurationMinutes,
    });
    setIsConfigOpen(false);
  };

  const sessions = schedule?.sessions || [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingSessions = sessions.filter((s) => new Date(s.scheduledDate) >= now);
  const displayedSessions = selectedTab === 'upcoming' ? upcomingSessions : sessions;

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            <CalendarCheck size={14} />
            <span>Study Scheduler & Timetable</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-surface-dark dark:text-white mt-1">
            Personalized Study Schedule
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            {roadmap?.title || activeRoadmap?.title
              ? `Tailored to "${roadmap?.title || activeRoadmap?.title}"`
              : 'Keep your momentum consistent with structured daily study blocks.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Preferences</span>
          </button>
          <button
            onClick={downloadCalendarICS}
            disabled={sessions.length === 0}
            className="btn-primary text-sm inline-flex items-center gap-2 shadow-soft"
            title="Download .ics file for Google Calendar, Apple Calendar, or Outlook"
          >
            <Download size={16} />
            <span>Export to Calendar (.ics)</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Banner ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-primary-200/60 dark:border-primary-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-xs text-surface-muted uppercase font-bold tracking-wider">
              Total Sessions
            </span>
            <div className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
              {totalSessions}
            </div>
            <span className="text-xs text-surface-muted">{completedSessions} completed</span>
          </div>
        </div>

        <div className="card p-5 border-primary-200/60 dark:border-primary-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs text-surface-muted uppercase font-bold tracking-wider">
              Schedule Completion
            </span>
            <div className="text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </div>
            <span className="text-xs text-surface-muted">
              {totalSessions - completedSessions} remaining
            </span>
          </div>
        </div>

        <div className="card p-5 border-primary-200/60 dark:border-primary-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-500 flex items-center justify-center">
            <Flame size={24} />
          </div>
          <div>
            <span className="text-xs text-surface-muted uppercase font-bold tracking-wider">
              Weekly Target
            </span>
            <div className="text-2xl font-heading font-bold text-orange-500">
              {weeklyHours} hrs/wk
            </div>
            <span className="text-xs text-surface-muted">
              {preferredDays.length} days/week • {sessionDurationMinutes}m sessions
            </span>
          </div>
        </div>
      </div>

      {/* ─── Preference Config Modal ─────────────────────────────────── */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-4">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-primary-600" />
                <h2 className="text-xl font-heading font-bold text-surface-dark dark:text-white">
                  Study Timetable Preferences
                </h2>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-lg text-surface-muted hover:bg-primary-100 dark:hover:bg-primary-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAndGenerate} className="space-y-5">
              {/* Preferred Days */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-surface-dark dark:text-white block">
                  Study Days (Select at least 1)
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = preferredDays.includes(d.value);
                    return (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => toggleDay(d.value)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-soft'
                            : 'bg-primary-50 dark:bg-primary-950/60 text-surface-muted hover:bg-primary-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Time & Session Length */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-dark dark:text-white block">
                    Preferred Daily Time
                  </label>
                  <input
                    type="time"
                    value={dailyStartTime}
                    onChange={(e) => setDailyStartTime(e.target.value)}
                    className="input w-full text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-dark dark:text-white block">
                    Session Length
                  </label>
                  <select
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="input w-full text-sm"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes (1.5 hrs)</option>
                    <option value={120}>120 minutes (2 hrs)</option>
                  </select>
                </div>
              </div>

              {/* Weekly Study Hours */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Weekly Study Commitment</span>
                  <span className="text-primary-600">{weeklyHours} hours/week</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-primary-100 dark:border-primary-800">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
                >
                  {isGenerating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  Regenerate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Sessions Timetable / Agenda ─────────────────────────────── */}
      <div className="card p-6 border-primary-200/80 dark:border-primary-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary-100 dark:border-primary-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTab === 'upcoming'
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-surface-muted hover:bg-primary-50 dark:hover:bg-primary-900'
              }`}
            >
              Upcoming ({upcomingSessions.length})
            </button>
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTab === 'all'
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-surface-muted hover:bg-primary-50 dark:hover:bg-primary-900'
              }`}
            >
              All Sessions ({sessions.length})
            </button>
          </div>

          <div className="text-xs text-surface-muted">
            Click any checkbox to record study activity & protect your streak!
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-primary-600 mx-auto" />
            <p className="text-sm text-surface-muted">Loading your timetable...</p>
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 mx-auto flex items-center justify-center">
              <Calendar size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-bold text-surface-dark dark:text-white">
                No Scheduled Sessions Found
              </h3>
              <p className="text-sm text-surface-muted max-w-sm mx-auto">
                Configure your preferred study days and times to generate your personalized timetable.
              </p>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2"
            >
              <Sparkles size={16} />
              Generate Study Timetable
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {displayedSessions.map((session) => {
              const isDone = session.status === 'completed';
              const dateObj = new Date(session.scheduledDate);
              const isPast = dateObj < now && !isDone;

              return (
                <div
                  key={session._id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 opacity-85'
                      : isPast
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                      : 'bg-white dark:bg-surface-card border-primary-100 dark:border-primary-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSessionStatus(session._id, isDone ? 'scheduled' : 'completed');
                      }}
                      className={`mt-1 p-1 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer relative z-10 shrink-0 ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-surface-muted hover:text-primary-600'
                      }`}
                      aria-label={isDone ? 'Mark session uncompleted' : 'Mark session completed'}
                      title={isDone ? 'Mark as uncompleted' : 'Mark as complete (+Discipline)'}
                    >
                      {isDone ? <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-500/20" /> : <Circle size={24} />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                          Milestone #{session.milestoneOrder}
                        </span>
                        <span className="text-xs font-semibold text-surface-dark dark:text-surface-light">
                          {dateObj.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-surface-muted text-xs">•</span>
                        <span className="text-xs text-surface-muted flex items-center gap-1">
                          <Clock size={12} />
                          {session.startTime} - {session.endTime} ({session.durationMinutes}m)
                        </span>
                        {isPast && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                            Catch Up
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base font-semibold ${
                          isDone
                            ? 'line-through text-surface-muted'
                            : 'text-surface-dark dark:text-white'
                        }`}
                      >
                        {session.milestoneTitle}
                      </h3>

                      {session.topicsCovered?.length > 0 && (
                        <p className="text-xs text-surface-muted">
                          {session.topicsCovered.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    <Link
                      to="/roadmap"
                      className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5"
                    >
                      <BookOpen size={13} />
                      Study Milestone
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
