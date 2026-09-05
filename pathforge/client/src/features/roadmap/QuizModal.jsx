/**
 * Interactive Milestone Quiz Modal
 * 
 * Tests comprehension of milestone concepts before unlocking the next milestone.
 * Features:
 * - Option selection with clear visual feedback
 * - Grading calculation with 70% passing threshold
 * - Explanation breakdowns for every question
 * - Celebratory XP gain banner (+50 XP) and next node unlock notification
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRoadmapStore } from '@/store/roadmapStore';
import { X, CheckCircle2, AlertCircle, Award, ArrowRight, RotateCcw, HelpCircle } from 'lucide-react';

export default function QuizModal({ node }) {
  const { isQuizOpen, closeQuiz, submitQuiz, quizResult } = useRoadmapStore();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isQuizOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isQuizOpen]);

  if (!isQuizOpen || !node) return null;

  const questions = node.quizQuestions || [];

  const handleSelectOption = (questionIdx, optionIdx) => {
    if (quizResult) return; // Locked once graded
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const unanswered = questions.some((_, idx) => selectedAnswers[idx] === undefined);
    if (unanswered) {
      setErrorMsg('Please answer all questions before submitting.');
      return;
    }

    const answersArray = questions.map((_, idx) => selectedAnswers[idx]);
    setIsSubmitting(true);
    try {
      await submitQuiz(node._id, answersArray);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    useRoadmapStore.setState({ quizResult: null });
    setErrorMsg('');
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-primary-100 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-900/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Milestone {node.order} Assessment
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                  {questions.length} Questions
                </span>
              </div>
              <h3 className="text-xl font-heading font-bold text-surface-dark dark:text-white">
                {node.title}
              </h3>
            </div>
            <button
              onClick={closeQuiz}
              className="p-2 rounded-xl text-surface-muted hover:text-surface-dark dark:hover:text-white hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Question Answered Progress */}
          {!quizResult && questions.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-surface-muted">
                <span>
                  Answered: {Object.keys(selectedAnswers).length} of {questions.length}
                </span>
                <span>
                  {Math.round((Object.keys(selectedAnswers).length / questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-primary-100 dark:bg-primary-900 overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Body: Quiz Questions or Results ────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* ─── Result Banner (if submitted) ─────────────────────────── */}
          {quizResult && (
            <div
              className={`p-6 rounded-2xl border text-center space-y-3 ${
                quizResult.passed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-white dark:bg-primary-900 shadow-soft">
                {quizResult.passed ? (
                  <Award size={32} className="text-emerald-500 animate-bounce" />
                ) : (
                  <RotateCcw size={28} className="text-amber-500" />
                )}
              </div>

              <div>
                <h4 className="text-2xl font-heading font-bold">
                  {quizResult.passed ? 'Milestone Cleared!' : 'Needs A Little More Study'}
                </h4>
                <p className="text-sm opacity-90 mt-1">
                  You scored {quizResult.score}% ({quizResult.correctCount}/{quizResult.totalQuestions} correct). Passing requirement: 70%.
                </p>
              </div>

              {quizResult.passed && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold/20 text-accent-gold text-xs font-bold">
                    +{quizResult.xpAwarded} XP Earned
                  </span>
                  {quizResult.unlockedNextNode && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                      <CheckCircle2 size={13} />
                      Next Milestone Unlocked
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Questions List ────────────────────────────────────────── */}
          {questions.length === 0 ? (
            <div className="text-center py-8 text-surface-muted">
              <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
              No quiz questions available for this milestone.
            </div>
          ) : (
            questions.map((q, qIdx) => {
              const isGraded = !!quizResult;
              const feedback = quizResult?.answerFeedback?.find((f) => f.questionIndex === qIdx);
              const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

              return (
                <div
                  key={q._id || qIdx}
                  className="p-5 rounded-2xl border border-primary-100 dark:border-primary-900 bg-white dark:bg-primary-900/40 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <p className="font-semibold text-surface-dark dark:text-white text-base leading-snug">
                        {q.question}
                      </p>
                    </div>

                    <span className="text-[11px] font-semibold text-surface-muted shrink-0">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pl-9">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      let optionStyle =
                        'border-primary-200 dark:border-primary-800 hover:border-primary-400 bg-white dark:bg-primary-900/50';

                      if (isGraded) {
                        if (optIdx === q.correctIndex) {
                          optionStyle =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold';
                        } else if (isSelected && optIdx !== q.correctIndex) {
                          optionStyle =
                            'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200 line-through';
                        } else {
                          optionStyle = 'opacity-50 border-primary-100 dark:border-primary-900';
                        }
                      } else if (isSelected) {
                        optionStyle =
                          'border-primary-600 bg-primary-50 dark:bg-primary-900/80 text-primary-900 dark:text-primary-100 font-semibold ring-2 ring-primary-500/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          disabled={isGraded}
                          className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${optionStyle}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="w-5 h-5 rounded-md bg-black/5 dark:bg-white/10 text-xs font-bold flex items-center justify-center shrink-0">
                              {OPTION_LETTERS[optIdx] || optIdx + 1}
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                          {isGraded && optIdx === q.correctIndex && (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation (shown after grading) */}
                  {isGraded && (
                    <div className="ml-9 p-3.5 rounded-xl bg-primary-50/70 dark:bg-primary-950/80 border border-primary-100 dark:border-primary-900 text-xs text-surface-muted leading-relaxed">
                      <span className="font-bold text-primary-700 dark:text-primary-300 block mb-1">
                        Pedagogical Explanation:
                      </span>
                      {feedback?.explanation || q.explanation || 'Review the core concepts in the milestone resources.'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ─── Footer Action Bar ──────────────────────────────────────── */}
        <div className="p-6 border-t border-primary-100 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-900/30 flex items-center justify-between">
          <button onClick={closeQuiz} className="btn-secondary text-sm">
            {quizResult?.passed ? 'Close' : 'Cancel'}
          </button>

          {!quizResult ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || questions.length === 0}
              className="btn-primary text-sm inline-flex items-center gap-2 shadow-soft font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Grading Quiz...
                </>
              ) : (
                <>
                  Submit Answers ({Object.keys(selectedAnswers).length}/{questions.length})
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : quizResult.passed ? (
            <button onClick={closeQuiz} className="btn-primary text-sm inline-flex items-center gap-2 shadow-soft">
              Back to Roadmap (+50 XP)
              <CheckCircle2 size={16} />
            </button>
          ) : (
            <button onClick={handleRetry} className="btn-secondary text-sm inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
