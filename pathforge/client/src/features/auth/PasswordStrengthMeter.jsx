/**
 * Password Strength Meter Component
 * 
 * Computes live password complexity and renders:
 * - 4-segment animated strength bar (Weak / Fair / Good / Strong)
 * - Criteria validation checklist with real-time checkmarks
 * - Styled with PathForge design tokens (rose -> gold -> teal)
 */

import React from 'react';
import { Check, X } from 'lucide-react';

export const evaluatePasswordStrength = (password = '') => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'At least one number (0-9)', met: /\d/.test(password) },
    { label: 'At least one special character (!@#$%^&*)', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  let label = 'Too short';
  let color = 'bg-accent-rose';
  let textColor = 'text-accent-rose';

  if (score === 5) {
    label = 'Strong';
    color = 'bg-accent-teal';
    textColor = 'text-accent-teal';
  } else if (score >= 3) {
    label = 'Good';
    color = 'bg-accent-gold';
    textColor = 'text-accent-gold';
  } else if (score >= 2) {
    label = 'Fair';
    color = 'bg-orange-500';
    textColor = 'text-orange-500';
  }

  return { criteria, score, label, color, textColor };
};

export default function PasswordStrengthMeter({ password = '' }) {
  if (!password) {
    return null;
  }

  const { criteria, score, label, color, textColor } = evaluatePasswordStrength(password);

  return (
    <div className="mt-2 space-y-3">
      {/* ─── Strength Bar ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-surface-muted">Password Strength:</span>
          <span className={`font-semibold ${textColor}`}>{label}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-1.5">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`h-full rounded-full transition-all duration-300 ${
                idx <= score ? color : 'bg-primary-100 dark:bg-primary-900/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── Criteria Checklist ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs">
            {item.met ? (
              <Check size={13} className="text-accent-teal shrink-0" />
            ) : (
              <X size={13} className="text-surface-muted/50 shrink-0" />
            )}
            <span className={item.met ? 'text-surface-dark dark:text-white' : 'text-surface-muted'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
