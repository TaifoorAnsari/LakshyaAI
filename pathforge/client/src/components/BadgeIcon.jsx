/**
 * BadgeIcon Component
 * 
 * Maps badge icon string identifiers (from MongoDB catalog) to their
 * corresponding Lucide SVG icons with color and sizing.
 */

import React from 'react';
import {
  Award,
  Flame,
  Crown,
  Sparkles,
  Zap,
  Compass,
  BookOpen,
  Moon,
  Sun,
  Rocket,
  Medal,
} from 'lucide-react';

export default function BadgeIcon({ icon, size = 20, className = '' }) {
  switch (icon) {
    case 'Flame':
      return <Flame size={size} className={className || 'text-orange-500'} />;
    case 'Crown':
      return <Crown size={size} className={className || 'text-accent-gold fill-accent-gold/20'} />;
    case 'Sparkles':
      return <Sparkles size={size} className={className || 'text-primary-500'} />;
    case 'Zap':
      return <Zap size={size} className={className || 'text-amber-500 fill-amber-500/20'} />;
    case 'Compass':
      return <Compass size={size} className={className || 'text-accent-teal'} />;
    case 'BookOpen':
      return <BookOpen size={size} className={className || 'text-emerald-500'} />;
    case 'Moon':
      return <Moon size={size} className={className || 'text-indigo-400 fill-indigo-400/20'} />;
    case 'Sun':
      return <Sun size={size} className={className || 'text-amber-500 fill-amber-500/20'} />;
    case 'Rocket':
      return <Rocket size={size} className={className || 'text-rose-500'} />;
    case 'Medal':
      return <Medal size={size} className={className || 'text-amber-600'} />;
    case 'Award':
    default:
      return <Award size={size} className={className || 'text-accent-gold'} />;
  }
}
