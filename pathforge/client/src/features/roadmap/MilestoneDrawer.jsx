/**
 * Milestone Slide-Over Drawer
 * 
 * Opens when a student clicks any milestone node in the visualizer.
 * Provides:
 * - Milestone description and estimated completion hours
 * - Curated educational resources (videos, docs, articles) with external links
 * - Interactive personal study notes scratchpad with automatic saving
 * - Milestone quiz launcher button
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRoadmapStore } from '@/store/roadmapStore';
import {
  X,
  Clock,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  GraduationCap,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const getResourceIcon = (type) => {
  switch (type) {
    case 'video':
      return <Video size={16} className="text-red-500" />;
    case 'doc':
      return <FileText size={16} className="text-blue-500" />;
    case 'course':
      return <GraduationCap size={16} className="text-purple-500" />;
    case 'article':
    default:
      return <BookOpen size={16} className="text-emerald-500" />;
  }
};

export default function MilestoneDrawer() {
  const { selectedNode, isDrawerOpen, closeDrawer, openQuiz, saveNodeNotes } = useRoadmapStore();
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setNotes(selectedNode.userNotes || '');
      setSavedSuccess(false);
      setIsMoreExpanded(false);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isDrawerOpen]);

  if (!isDrawerOpen || !selectedNode) return null;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await saveNodeNotes(selectedNode._id, notes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const isLocked = selectedNode.status === 'locked';
  const isCompleted = selectedNode.status === 'completed';

  return createPortal(
    <div
      onClick={closeDrawer}
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-primary-950 border-l border-primary-200 dark:border-primary-850 h-full flex flex-col shadow-2xl animate-slide-left z-50"
      >
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-primary-100 dark:border-primary-900 flex items-start justify-between bg-primary-50/50 dark:bg-primary-900/30">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                Milestone {selectedNode.order}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  Completed
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-surface-muted">
                  <Lock size={12} />
                  Locked
                </span>
              )}
            </div>
            <h3 className="text-xl font-heading font-bold text-surface-dark dark:text-white pt-1">
              {selectedNode.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-surface-muted pt-0.5">
              <Clock size={13} />
              Estimated Study Time: {selectedNode.estimatedHours} hours
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="p-2 rounded-xl text-surface-muted hover:text-surface-dark dark:hover:text-white hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Body Content ───────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-muted">
              Milestone Overview
            </h4>
            <p className="text-sm text-surface-dark dark:text-surface-light leading-relaxed">
              {selectedNode.description}
            </p>
          </div>

          {/* Educational Resources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-muted flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary-600" />
                Curated Learning Resources ({selectedNode.resources?.length || 0})
              </h4>
            </div>

            {(!selectedNode.resources || selectedNode.resources.length === 0) ? (
              <p className="text-xs text-surface-muted italic">No external resources attached to this milestone.</p>
            ) : (() => {
              const allResources = selectedNode.resources;
              // 1. Primary Explainer: marked "Start here"
              const startHere = allResources.find((r) => r.isStartHere) || allResources[0];
              // 2. Official Doc: labeled as reference
              const officialDoc = allResources.find((r) => r.isOfficialDoc && r._id !== startHere._id);
              // 3. More Resources: all others
              const moreList = allResources.filter(
                (r) => r._id !== startHere._id && (!officialDoc || r._id !== officialDoc._id)
              );

              const renderResourceCard = (res, isPrimary = false, isOfficial = false) => {
                const isAI = res.source === 'ai_suggested';
                return (
                  <a
                    key={res._id || res.title}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block p-4 rounded-2xl border transition-all duration-200 group relative ${
                      isPrimary
                        ? 'border-primary-400 dark:border-primary-600 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-900/40 dark:to-primary-950 shadow-soft hover:shadow-card hover:border-primary-500'
                        : isOfficial
                        ? 'border-primary-200 dark:border-primary-850 bg-white/60 dark:bg-primary-900/20 hover:border-primary-350 dark:hover:border-primary-700'
                        : 'border-primary-100 dark:border-primary-900 bg-white dark:bg-primary-950 hover:border-primary-300 dark:hover:border-primary-800'
                    }`}
                  >
                    {/* Header Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-2">
                      {isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary-600 text-white shadow-xs">
                          <Sparkles size={11} />
                          Start Here
                        </span>
                      )}

                      {isOfficial && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          Official Reference
                        </span>
                      )}

                      {/* Provenance Badge */}
                      {isAI ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          title="Generated by AI curriculum engine. Eligible for curator promotion."
                        >
                          <Sparkles size={10} />
                          AI Suggested
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          title="Verified & approved by PathForge curriculum review."
                        >
                          <CheckCircle2 size={10} />
                          Verified
                        </span>
                      )}

                      {/* Difficulty Chip */}
                      {res.difficulty && (
                        <span className="ml-auto text-[10px] font-medium text-surface-muted bg-primary-50 dark:bg-primary-900 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-800">
                          {res.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Title and Icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-white dark:bg-primary-900 border border-primary-100 dark:border-primary-800 shadow-xs shrink-0 mt-0.5">
                          {getResourceIcon(res.type)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-semibold text-surface-dark dark:text-white leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {res.title}
                          </h5>

                          {/* Time estimate & Format info */}
                          <div className="flex items-center gap-2 text-xs text-surface-muted pt-1">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {res.duration || '12 min read'}
                            </span>
                            <span>•</span>
                            <span className="capitalize font-medium">{res.type}</span>
                            {isOfficial && (
                              <>
                                <span>•</span>
                                <span className="text-[11px] italic text-surface-muted">Not required reading</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <ExternalLink
                        size={15}
                        className="text-surface-muted group-hover:text-primary-600 transition-colors shrink-0 mt-1"
                      />
                    </div>
                  </a>
                );
              };

              return (
                <div className="space-y-3">
                  {/* 1. Primary Start Here */}
                  {startHere && renderResourceCard(startHere, true, false)}

                  {/* 2. Official Reference */}
                  {officialDoc && renderResourceCard(officialDoc, false, true)}

                  {/* 3. Collapsed More Resources Expander */}
                  {moreList.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-primary-200 dark:border-primary-800 hover:border-primary-400 bg-primary-50/40 dark:bg-primary-900/20 text-xs font-semibold text-primary-700 dark:text-primary-300 flex items-center justify-between transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen size={13} />
                          {isMoreExpanded
                            ? `Hide extra resources`
                            : `More resources (${moreList.length})`}
                        </span>
                        {isMoreExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isMoreExpanded && (
                        <div className="mt-2.5 space-y-2.5 animate-slide-up">
                          {moreList.map((res) => renderResourceCard(res, false, false))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Personal Notes Scratchpad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-muted">
                Personal Study Notes
              </h4>
              {savedSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Saved
                </span>
              )}
            </div>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down key takeaways, code snippets, or ideas for this milestone..."
              className="input-field text-sm font-mono leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
              >
                <Save size={13} />
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Bottom Actions ─────────────────────────────────────────── */}
        <div className="p-6 border-t border-primary-100 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-900/30">
          {isLocked ? (
            <div className="p-3.5 rounded-xl bg-primary-100/50 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 text-xs text-surface-muted text-center flex items-center justify-center gap-2">
              <Lock size={14} />
              Complete Milestone {selectedNode.order - 1} quiz to unlock this stage.
            </div>
          ) : (
            <button
              onClick={openQuiz}
              className="w-full btn-primary py-3 inline-flex items-center justify-center gap-2 shadow-soft font-semibold"
            >
              <Sparkles size={16} />
              {isCompleted ? 'Review Milestone Quiz' : 'Take Milestone Quiz (+50 XP)'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
