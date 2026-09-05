/**
 * Onboarding Wizard Component
 * 
 * 4-Step Interactive Questionnaire:
 * 1. Goal: Free text input with popular quick-select topics
 * 2. Skill Level: Beginner / Intermediate / Advanced cards
 * 3. Weekly Hours: Interactive range slider with pacing advice
 * 4. Learning Style: Hands-on / Video / Reading preferences
 * 
 * Captures data required by Section 7 for personalized roadmap generation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  Code2,
  BookOpen,
  Video,
  Hammer,
  Clock,
  Zap,
  RefreshCw,
  Award,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const POPULAR_GOALS = [
  'Full-Stack MERN Development',
  'Backend Engineering (Node.js & MongoDB)',
  'Frontend Web Development (React & Tailwind)',
  'Data Structures & Algorithms (Placements)',
  'Data Science & Analytics (Python)',
  'Machine Learning Fundamentals',
  'DevOps & Cloud with Docker & AWS',
  'Mobile App Development with Flutter',
];

const SKILL_LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    desc: 'New to this topic. Start with fundamentals and core syntax.',
    icon: Compass,
    badge: 'Step 1',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    desc: 'Comfortable with basics. Ready for full projects and architecture.',
    icon: Code2,
    badge: 'Recommended',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    desc: 'Solid experience. Focus on optimization, scale, and deep mastery.',
    icon: Award,
    badge: 'Specialist',
  },
];

const LEARNING_STYLES = [
  {
    id: 'hands-on',
    title: 'Hands-on Projects',
    desc: 'Learn by building real-world applications from day one.',
    icon: Hammer,
  },
  {
    id: 'visual',
    title: 'Visual & Video',
    desc: 'Follow along with video lessons, screen recordings, and diagrams.',
    icon: Video,
  },
  {
    id: 'reading',
    title: 'Reading & Docs',
    desc: 'Deep comprehension through documentation, books, and articles.',
    icon: BookOpen,
  },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const [goalText, setGoalText] = useState(user?.onboarding?.goalText || '');
  const [skillLevel, setSkillLevel] = useState(user?.onboarding?.skillLevel || 'beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState(user?.onboarding?.hoursPerWeek || 10);
  const [learningStyle, setLearningStyle] = useState(user?.onboarding?.learningStyle || 'hands-on');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nextStep = () => {
    setError('');
    if (step === 1 && !goalText.trim()) {
      setError('Please type or select what you want to learn.');
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        goalText: goalText.trim(),
        skillLevel,
        hoursPerWeek: Number(hoursPerWeek),
        learningStyle,
      };

      const response = await api.post('/users/me/onboarding', payload);
      const updatedUser = response.data.data.user;

      setUser(updatedUser);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ─── Progress Bar & Step Header ───────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-surface-muted uppercase tracking-wider mb-2">
          <span>Step {step} of 4</span>
          <span>{Math.round(progressPercent)}% completed</span>
        </div>
        <div className="w-full h-2 rounded-full bg-primary-100 dark:bg-primary-900/50 overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ─── Error Message Banner ─────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
          {error}
        </div>
      )}

      {/* ─── Step Content ─────────────────────────────────────────── */}
      <div className="card p-6 sm:p-8 shadow-card">
        {/* STEP 1: GOAL */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-3">
                <Sparkles size={14} />
                Your Learning Goal
              </div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                What do you want to learn?
              </h2>
              <p className="text-sm text-surface-muted mt-1">
                Tell us your target in plain words. We&apos;ll build your path around it.
              </p>
            </div>

            <div>
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={3}
                placeholder="e.g. I want to become a backend developer with Node.js and PostgreSQL"
                className="input-field resize-none text-base"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider mb-2.5">
                Popular Learning Paths:
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_GOALS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGoalText(preset)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      goalText === preset
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-surface-dark border-primary-200 dark:border-primary-800 text-surface-dark dark:text-white hover:border-primary-500'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SKILL LEVEL */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-3">
                <Compass size={14} />
                Current Experience
              </div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                What is your current level?
              </h2>
              <p className="text-sm text-surface-muted mt-1">
                This helps us skip what you already know or start from first principles.
              </p>
            </div>

            <div className="grid gap-3">
              {SKILL_LEVELS.map((item) => {
                const Icon = item.icon;
                const isSelected = skillLevel === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSkillLevel(item.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/20'
                        : 'border-primary-100 dark:border-primary-900 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-surface-dark dark:text-white">
                          {item.title}
                        </h3>
                        {isSelected && <Check size={18} className="text-primary-600" />}
                      </div>
                      <p className="text-xs text-surface-muted mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: WEEKLY TIME */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-3">
                <Clock size={14} />
                Time Commitment
              </div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                How many hours per week can you study?
              </h2>
              <p className="text-sm text-surface-muted mt-1">
                We pace your milestones and node deadlines according to your available time.
              </p>
            </div>

            <div className="py-6 text-center">
              <div className="text-5xl font-heading font-bold text-primary-600 mb-2">
                {hoursPerWeek} <span className="text-xl font-normal text-surface-muted">hrs/week</span>
              </div>
              <p className="text-xs text-surface-muted">
                {hoursPerWeek <= 5 && 'Steady & manageable: ~45 mins per day'}
                {hoursPerWeek > 5 && hoursPerWeek <= 15 && 'Ideal pacing: ~1.5 to 2 hours per day'}
                {hoursPerWeek > 15 && hoursPerWeek <= 25 && 'Accelerated learning: ~3 hours per day'}
                {hoursPerWeek > 25 && 'Intensive bootcamp pace: ~4+ hours per day'}
              </p>

              <div className="mt-8 max-w-md mx-auto">
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-surface-muted mt-2">
                  <span>2 hrs (Light)</span>
                  <span>15 hrs (Moderate)</span>
                  <span>40 hrs (Intensive)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex justify-center gap-2 mt-6">
                {[5, 10, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHoursPerWeek(preset)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                      hoursPerWeek === preset
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-primary-200 dark:border-primary-800 text-surface-muted hover:border-primary-400'
                    }`}
                  >
                    {preset} hrs
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LEARNING STYLE */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-3">
                <Zap size={14} />
                Preferred Style
              </div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                How do you learn best?
              </h2>
              <p className="text-sm text-surface-muted mt-1">
                We&apos;ll prioritize this resource type across your roadmap nodes.
              </p>
            </div>

            <div className="grid gap-3">
              {LEARNING_STYLES.map((item) => {
                const Icon = item.icon;
                const isSelected = learningStyle === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setLearningStyle(item.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/20'
                        : 'border-primary-100 dark:border-primary-900 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-surface-dark dark:text-white">
                          {item.title}
                        </h3>
                        {isSelected && <Check size={18} className="text-primary-600" />}
                      </div>
                      <p className="text-xs text-surface-muted mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Navigation Buttons ───────────────────────────────────── */}
        <div className="flex items-center justify-between pt-6 border-t border-primary-100 dark:border-primary-900 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn-secondary text-sm py-2.5 px-4 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-1.5"
            >
              Next Step
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-1.5 shadow-card hover:shadow-glow"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saving preferences...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
