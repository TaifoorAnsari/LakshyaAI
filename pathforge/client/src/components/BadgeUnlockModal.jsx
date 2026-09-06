/**
 * Badge Unlock Celebration Modal
 * 
 * Pops up whenever a student unlocks a new achievement badge
 * (e.g. First Milestone, 7-Day Streak, Flawless Quiz, Freeze Defender).
 * Features celebratory sound/glow styling, XP reward callout, and portal rendering.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGamificationStore } from '@/store/gamificationStore';
import BadgeIcon from '@/components/BadgeIcon';
import {
  Sparkles,
  Zap,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function BadgeUnlockModal() {
  const { unlockedBadge, closeBadgeCelebration } = useGamificationStore();

  useEffect(() => {
    if (unlockedBadge) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [unlockedBadge]);

  if (!unlockedBadge) return null;

  return createPortal(
    <div
      onClick={closeBadgeCelebration}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-primary-950 border-2 border-accent-gold/40 rounded-3xl max-w-sm w-full p-6 sm:p-8 text-center shadow-2xl shadow-accent-gold/10 overflow-hidden animate-bounce-in space-y-5"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-gold/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeBadgeCelebration}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-surface-muted hover:text-surface-dark dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Badge Icon Showcase */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-accent-gold/20 via-primary-100 dark:via-primary-900 to-accent-gold/10 border border-accent-gold/30 flex items-center justify-center shadow-card animate-pulse-gold">
          <BadgeIcon icon={unlockedBadge.icon} size={48} />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
            <Sparkles size={12} />
            Achievement Unlocked!
          </span>
          <h3 className="text-2xl font-heading font-bold text-surface-dark dark:text-white pt-1">
            {unlockedBadge.name}
          </h3>
          <p className="text-sm text-surface-muted leading-relaxed">
            {unlockedBadge.description}
          </p>
        </div>

        {/* XP Bonus Pill */}
        <div className="p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800/80 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-gold/20 text-accent-gold flex items-center justify-center font-heading font-bold text-sm">
            +{unlockedBadge.xpReward || 50}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-surface-dark dark:text-white">
              Bonus XP Awarded
            </div>
            <div className="text-[11px] text-surface-muted">
              Added directly to your lifetime score
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={closeBadgeCelebration}
          className="w-full btn-primary py-3 inline-flex items-center justify-center gap-2 shadow-soft font-semibold text-sm"
        >
          <CheckCircle2 size={16} />
          Claim & Forge Forward
        </button>
      </div>
    </div>,
    document.body
  );
}
