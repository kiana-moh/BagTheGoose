import type { OnboardingData } from "@/lib/types";

export function toOnboardingPayload(onboarding: OnboardingData) {
  return {
    academicInfoJson: {
      school: onboarding.basics.school,
      program: onboarding.basics.program,
      graduationYear: onboarding.basics.graduationYear,
      workAuthorization: onboarding.basics.workAuthorization
    },
    preferencesJson: {
      targetRoles: onboarding.preferences.targetRoles,
      preferredLocations: onboarding.preferences.preferredLocations,
      workModes: onboarding.preferences.workModes,
      applicationGoal: onboarding.preferences.applicationGoal
    },
    skillsReviewJson: {
      inferredOpportunities: onboarding.inferredOpportunities,
      defaultStatuses: onboarding.trackerSetup.defaultStatuses,
      deadlineReminder: onboarding.trackerSetup.deadlineReminder,
      resumeConfirmed: onboarding.resumeConfirmed,
      currentStep: onboarding.currentStep
    },
    completedAt: onboarding.completed ? onboarding.completedAt ?? new Date().toISOString() : null
  };
}
