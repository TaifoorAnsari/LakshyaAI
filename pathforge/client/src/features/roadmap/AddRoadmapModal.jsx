/**
 * Add / Enroll In Another Roadmap Modal
 * 
 * Enables students to maintain 2-3+ concurrent roadmaps (e.g. MERN Stack + DSA in C++):
 * - Free text input with popular quick-select pills
 * - Skill Level & Hours per week configuration
 * - Triggers zero-cost cluster match or AI generation
 * - Seamlessly appends the new path to the student's active roadmap switcher!
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRoadmapStore } from '@/store/roadmapStore';
import { X, Sparkles, Compass, Clock, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

const POPULAR_PATHS = [
  'Data Structures and Algorithms in C++',
  'Data Structures and Algorithms in Java',
  'Full-Stack MERN Development',
  'Frontend Web Development with React',
  'DevOps & Containerization with Docker and Kubernetes',
  'Python for Data Science & Machine Learning',
  'Cross-Platform Mobile Apps with Flutter & Dart',
  'System Design Fundamentals',
];

export default function AddRoadmapModal() {
  const {
    isAddRoadmapModalOpen,
    closeAddRoadmapModal,
    generateAndEnroll,
    isGenerating,
    generationProgress,
    error,
  } = useRoadmapStore();

  const [goalText, setGoalText] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [validationError, setValidationError] = useState('');

  React.useEffect(() => {
    if (isAddRoadmapModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isAddRoadmapModalOpen]);

  if (!isAddRoadmapModalOpen) return null;

  const handleSelectPopular = (path) => {
    setGoalText(path);
    setValidationError('');
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!goalText.trim()) {
      setValidationError('Please enter a goal or choose a path below.');
      return;
    }

    setValidationError('');
    await generateAndEnroll({
      goalText: goalText.trim(),
      skillLevel,
      hoursPerWeek: Number(hoursPerWeek),
      learningStyle: 'hands-on',
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-primary-100 dark:border-primary-900 flex items-center justify-between bg-primary-50/50 dark:bg-primary-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900 text-primary-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-surface-dark dark:text-white">
                Add Another Roadmap
              </h3>
              <p className="text-xs text-surface-muted">
                Learn multiple tracks simultaneously (e.g. MERN + DSA)
              </p>
            </div>
          </div>

          <button
            onClick={closeAddRoadmapModal}
            disabled={isGenerating}
            className="p-2 rounded-xl text-surface-muted hover:text-surface-dark dark:hover:text-white hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Form Body ──────────────────────────────────────────────── */}
        <form onSubmit={handleEnroll} className="p-6 overflow-y-auto space-y-6 flex-1">
          {(validationError || error) && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              {validationError || error}
            </div>
          )}

          {/* Goal Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-muted">
              What do you want to master next?
            </label>
            <input
              type="text"
              value={goalText}
              onChange={(e) => {
                setGoalText(e.target.value);
                setValidationError('');
              }}
              disabled={isGenerating}
              placeholder="e.g. Data Structures and Algorithms in C++, Flutter Apps..."
              className="input-field text-base font-semibold"
            />
          </div>

          {/* Popular Pills */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-surface-muted">
              Popular Tracks:
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_PATHS.map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => handleSelectPopular(path)}
                  disabled={isGenerating}
                  className={`text-xs py-1.5 px-3 rounded-xl border transition-all text-left ${
                    goalText === path
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                      : 'bg-primary-50/50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-surface-dark dark:text-surface-light hover:border-primary-400'
                  }`}
                >
                  {path}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level & Hours Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-muted">
                <Compass size={13} className="inline mr-1" />
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                disabled={isGenerating}
                className="input-field text-sm"
              >
                <option value="beginner">Beginner (Zero to hero)</option>
                <option value="intermediate">Intermediate (Build projects)</option>
                <option value="advanced">Advanced (Deep internals)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-muted">
                <Clock size={13} className="inline mr-1" />
                Commitment
              </label>
              <select
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                disabled={isGenerating}
                className="input-field text-sm"
              >
                <option value={5}>5 hrs/week (Casual)</option>
                <option value={10}>10 hrs/week (Balanced)</option>
                <option value={15}>15 hrs/week (Dedicated)</option>
                <option value={20}>20+ hrs/week (Intensive)</option>
              </select>
            </div>
          </div>

          {/* Generation Progress Bar (shown when forging) */}
          {isGenerating && (
            <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 space-y-3">
              <div className="flex items-center gap-3">
                <RefreshCw size={18} className="animate-spin text-primary-600" />
                <span className="text-sm font-semibold text-surface-dark dark:text-white">
                  {generationProgress < 50
                    ? 'Matching roadmap templates...'
                    : generationProgress < 85
                    ? 'Generating milestone curriculum...'
                    : 'Enrolling roadmap into your profile...'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-primary-200 dark:bg-primary-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-accent-teal transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-primary-100 dark:border-primary-900 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeAddRoadmapModal}
              disabled={isGenerating}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !goalText.trim()}
              className="btn-primary text-sm inline-flex items-center gap-2 shadow-soft font-semibold"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Forging Roadmap...
                </>
              ) : (
                <>
                  Forge & Enroll
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
