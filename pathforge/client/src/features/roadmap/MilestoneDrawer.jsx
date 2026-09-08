/**
 * Milestone Slide-Over Drawer
 * 
 * Opens when a student clicks any milestone node in the visualizer.
 * Provides:
 * - Milestone description and estimated completion hours
 * - Granular sub-topic breakdown with key concept tags and completion checkboxes
 * - Categorized study resources (Videos, Docs, Articles, Interactive Practice)
 * - Resource type filtering (All, Videos, Docs, Practice)
 * - Interactive personal study notes scratchpad with automatic saving
 * - Milestone comprehension quiz launcher button
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
  Circle,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code2,
  Layers,
  ListChecks,
} from 'lucide-react';

const getResourceTypeConfig = (type) => {
  switch (type) {
    case 'video':
      return {
        icon: <Video size={14} className="text-rose-500 shrink-0" />,
        label: 'Video Tutorial',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      };
    case 'doc':
      return {
        icon: <FileText size={14} className="text-sky-500 shrink-0" />,
        label: 'Documentation',
        badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900',
      };
    case 'interactive':
      return {
        icon: <Code2 size={14} className="text-emerald-500 shrink-0" />,
        label: 'Interactive Practice',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      };
    case 'course':
      return {
        icon: <GraduationCap size={14} className="text-indigo-500 shrink-0" />,
        label: 'Course',
        badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
      };
    case 'article':
    default:
      return {
        icon: <BookOpen size={14} className="text-amber-500 shrink-0" />,
        label: 'Guide & Article',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      };
  }
};

export default function MilestoneDrawer() {
  const {
    selectedNode,
    isDrawerOpen,
    closeDrawer,
    openQuiz,
    saveNodeNotes,
    toggleTopicCompletion,
  } = useRoadmapStore();

  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('all'); // 'all' | 'video' | 'doc' | 'interactive' | 'article'
  const [collapsedTopics, setCollapsedTopics] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setNotes(selectedNode.userNotes || '');
      setSavedSuccess(false);
      setIsMoreExpanded(false);
      setCollapsedTopics({});
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

  const toggleTopicCollapse = (topicId) => {
    setCollapsedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const isLocked = selectedNode.status === 'locked';
  const isCompleted = selectedNode.status === 'completed';

  const topics = selectedNode.topics || [];
  const hasTopics = topics.length > 0;
  const completedTopicsCount = topics.filter((t) => t.isCompleted).length;
  const topicProgressPercent = hasTopics
    ? Math.round((completedTopicsCount / topics.length) * 100)
    : 0;

  // Render resource card helper
  const renderResourceCard = (res, isPrimary = false, isOfficial = false) => {
    const config = getResourceTypeConfig(res.type);
    const isAI = res.source === 'ai_suggested';

    return (
      <a
        key={res._id || res.title || res.url}
        href={res.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-3.5 rounded-xl border transition-all duration-200 group relative ${
          isPrimary
            ? 'border-primary-400 dark:border-primary-600 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-900/40 dark:to-primary-950 shadow-soft hover:shadow-card hover:border-primary-500'
            : isOfficial
            ? 'border-primary-200 dark:border-primary-850 bg-white/60 dark:bg-primary-900/20 hover:border-primary-350 dark:hover:border-primary-700'
            : 'border-primary-100 dark:border-primary-850 bg-white dark:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700'
        }`}
      >
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2">
          {isPrimary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary-600 text-white shadow-xs">
              <Sparkles size={10} />
              Start Here
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}
          >
            {config.icon}
            {config.label}
          </span>

          {isOfficial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Official
            </span>
          )}

          {isAI ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary-100/50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50"
              title="Curated AI recommendation"
            >
              Curated
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              title="Verified Resource"
            >
              <CheckCircle2 size={9} />
              Verified
            </span>
          )}

          {res.difficulty && (
            <span className="ml-auto text-[10px] font-medium text-surface-muted bg-primary-50 dark:bg-primary-900 px-1.5 py-0.5 rounded border border-primary-100 dark:border-primary-800">
              {res.difficulty}
            </span>
          )}
        </div>

        {/* Title and Link Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h5 className="text-xs font-semibold text-surface-dark dark:text-white leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {res.title}
            </h5>
            {res.duration && (
              <div className="flex items-center gap-1 text-[11px] text-surface-muted pt-1">
                <Clock size={11} />
                <span>{res.duration}</span>
              </div>
            )}
          </div>

          <ExternalLink
            size={14}
            className="text-surface-muted group-hover:text-primary-600 transition-colors shrink-0 mt-0.5"
          />
        </div>
      </a>
    );
  };

  return createPortal(
    <div
      onClick={closeDrawer}
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl md:max-w-2xl bg-white dark:bg-primary-950 border-l border-primary-200 dark:border-primary-850 h-full flex flex-col shadow-2xl animate-slide-left z-50"
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
          {/* Milestone Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-muted">
              Milestone Overview
            </h4>
            <p className="text-sm text-surface-dark dark:text-surface-light leading-relaxed">
              {selectedNode.description}
            </p>
          </div>

          {/* Sub-Topics Progress Bar Header (if topics exist) */}
          {hasTopics && (
            <div className="p-4 rounded-2xl bg-primary-50/60 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks size={18} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-surface-dark dark:text-white">
                    Topics Mastery ({completedTopicsCount}/{topics.length})
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                  {topicProgressPercent}% Completed
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-primary-200/60 dark:bg-primary-850 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${topicProgressPercent}%` }}
                />
              </div>

              {/* Quick filter chips */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-medium text-surface-muted pr-1">Filter:</span>
                {[
                  { id: 'all', label: 'All Resources' },
                  { id: 'video', label: '🎥 Videos' },
                  { id: 'doc', label: '📖 Docs' },
                  { id: 'interactive', label: '💻 Practice' },
                  { id: 'article', label: '📝 Guides' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setResourceFilter(chip.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors shrink-0 ${
                      resourceFilter === chip.id
                        ? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600 shadow-xs'
                        : 'bg-white dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-surface-muted hover:text-surface-dark dark:hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Detailed Sub-Topics Section ───────────────────────────── */}
          {hasTopics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-surface-muted flex items-center gap-1.5">
                  <Layers size={14} className="text-primary-600" />
                  Detailed Topic Breakdown ({topics.length} Sub-Topics)
                </h4>
              </div>

              <div className="space-y-3.5">
                {topics.map((topic, index) => {
                  const isTopicCompleted = !!topic.isCompleted;
                  const isCollapsed = !!collapsedTopics[topic._id];

                  // Filter resources for this topic
                  const topicResources = (topic.resources || []).filter((r) => {
                    if (resourceFilter === 'all') return true;
                    return r.type === resourceFilter;
                  });

                  return (
                    <div
                      key={topic._id || index}
                      className={`rounded-2xl border transition-all duration-200 ${
                        isTopicCompleted
                          ? 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-primary-200/80 dark:border-primary-850 bg-white dark:bg-primary-950'
                      }`}
                    >
                      {/* Topic Card Header */}
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Completion Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => toggleTopicCompletion(selectedNode._id, topic._id)}
                            className="shrink-0 mt-0.5 p-1 rounded-lg text-surface-muted hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title={isTopicCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {isTopicCompleted ? (
                              <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : (
                              <Circle size={20} className="text-surface-muted hover:text-primary-600" />
                            )}
                          </button>

                          {/* Title & Description */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-muted bg-primary-100 dark:bg-primary-850 px-2 py-0.5 rounded">
                                Topic {index + 1}
                              </span>
                              {isTopicCompleted && (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Mastered
                                </span>
                              )}
                            </div>
                            <h5
                              className={`text-sm font-semibold pt-1 transition-colors ${
                                isTopicCompleted
                                  ? 'text-surface-dark dark:text-surface-light line-through decoration-emerald-500/50'
                                  : 'text-surface-dark dark:text-white'
                              }`}
                            >
                              {topic.title}
                            </h5>
                            <p className="text-xs text-surface-muted pt-1 leading-relaxed">
                              {topic.description}
                            </p>

                            {/* Key Concepts Pills */}
                            {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2.5">
                                {topic.keyConcepts.map((concept, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary-100/70 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200 border border-primary-200/60 dark:border-primary-800/60"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={() => toggleTopicCollapse(topic._id)}
                          className="p-1 rounded-lg text-surface-muted hover:text-surface-dark dark:hover:text-white hover:bg-primary-100 dark:hover:bg-primary-850 transition-colors shrink-0"
                          title={isCollapsed ? 'Show resources' : 'Hide resources'}
                        >
                          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                      </div>

                      {/* Collapsible Resources for this Topic */}
                      {!isCollapsed && (
                        <div className="px-4 pb-4 pt-1 border-t border-primary-100 dark:border-primary-900/60 space-y-2">
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-muted flex items-center gap-1">
                              <BookOpen size={11} className="text-primary-600" />
                              Study Resources ({topicResources.length})
                            </span>
                          </div>

                          {topicResources.length === 0 ? (
                            <p className="text-xs text-surface-muted italic py-1">
                              No resources match the selected filter.
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {topicResources.map((res, rIdx) =>
                                renderResourceCard(res, rIdx === 0, false)
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Curated Learning Resources (Fallback or Top-Level) ───── */}
          {(!hasTopics || (selectedNode.resources && selectedNode.resources.length > 0)) && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-surface-muted flex items-center gap-1.5">
                  <BookOpen size={14} className="text-primary-600" />
                  {hasTopics ? 'General Milestone Resources' : 'Curated Learning Resources'} (
                  {selectedNode.resources?.length || 0})
                </h4>
              </div>

              {!selectedNode.resources || selectedNode.resources.length === 0 ? (
                <p className="text-xs text-surface-muted italic">
                  No top-level resources attached to this milestone.
                </p>
              ) : (() => {
                const allResources = selectedNode.resources;
                const startHere = allResources.find((r) => r.isStartHere) || allResources[0];
                const officialDoc = allResources.find(
                  (r) => r.isOfficialDoc && r._id !== startHere._id
                );
                const moreList = allResources.filter(
                  (r) => r._id !== startHere._id && (!officialDoc || r._id !== officialDoc._id)
                );

                return (
                  <div className="space-y-3">
                    {/* Primary Start Here */}
                    {startHere && renderResourceCard(startHere, true, false)}

                    {/* Official Reference */}
                    {officialDoc && renderResourceCard(officialDoc, false, true)}

                    {/* Collapsed More Resources Expander */}
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
                              ? 'Hide extra resources'
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
          )}

          {/* ─── Personal Notes Scratchpad ──────────────────────────────── */}
          <div className="space-y-2 pt-2">
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
