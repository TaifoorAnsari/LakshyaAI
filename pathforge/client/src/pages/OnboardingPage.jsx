/**
 * Onboarding Page
 * 
 * Container for the student onboarding questionnaire.
 */

import React from 'react';
import OnboardingWizard from '@/features/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-[85vh] py-8 animate-fade-in">
      <OnboardingWizard />
    </div>
  );
}
