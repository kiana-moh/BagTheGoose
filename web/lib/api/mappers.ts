import type {
  AppSnapshot,
  ApplicationTrackerItem,
  AuthUser,
  BackendOnboardingProfileRecord,
  BackendResumeRecord,
  DashboardSummary,
  OnboardingData,
  ResumeSource,
  UserProfile
} from "@/lib/types";

const defaultOnboarding: OnboardingData = {
  currentStep: 1,
  completed: false,
  basics: {
    school: "",
    program: "",
    graduationYear: "",
    workAuthorization: ""
  },
  preferences: {
    targetRoles: [],
    preferredLocations: [],
    workModes: ["remote"],
    applicationGoal: ""
  },
  inferredOpportunities: [],
  trackerSetup: {
    defaultStatuses: ["Saved", "Applied", "Interview", "Offer", "Rejected"],
    deadlineReminder: true
  },
  resumeConfirmed: false,
  completedAt: null
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function mapResumeRecord(record: BackendResumeRecord | null): ResumeSource | null {
  if (!record) {
    return null;
  }

  const extracted = record.extractedJson ?? {};

  return {
    id: record.id,
    sourceType: record.sourceType,
    latexContent: record.latexContent,
    fileName: record.fileName,
    status: record.parseStatus,
    extractedMetadata: {
      degreeLevel: typeof extracted.degreeLevel === "string" ? extracted.degreeLevel : undefined,
      majors: asStringArray(extracted.majors),
      graduationYear:
        typeof extracted.graduationYear === "number" ? extracted.graduationYear : undefined,
      skills: asStringArray(extracted.technologies ?? extracted.skills),
      rolePatterns: asStringArray(extracted.rolePatterns)
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function mapOnboardingRecord(record: BackendOnboardingProfileRecord | null): OnboardingData {
  if (!record) {
    return defaultOnboarding;
  }

  const academicInfo = record.academicInfoJson ?? {};
  const preferences = record.preferencesJson ?? {};
  const skillsReview = record.skillsReviewJson ?? {};

  return {
    currentStep: typeof skillsReview.currentStep === "number" ? skillsReview.currentStep : 1,
    completed: Boolean(record.completedAt),
    basics: {
      school: typeof academicInfo.school === "string" ? academicInfo.school : "",
      program: typeof academicInfo.program === "string" ? academicInfo.program : "",
      graduationYear:
        typeof academicInfo.graduationYear === "string" ? academicInfo.graduationYear : "",
      workAuthorization:
        typeof academicInfo.workAuthorization === "string" ? academicInfo.workAuthorization : ""
    },
    preferences: {
      targetRoles: asStringArray(preferences.targetRoles),
      preferredLocations: asStringArray(preferences.preferredLocations),
      workModes:
        (Array.isArray(preferences.workModes)
          ? preferences.workModes.filter(
              (item): item is "remote" | "hybrid" | "onsite" =>
                item === "remote" || item === "hybrid" || item === "onsite"
            )
          : []) || [],
      applicationGoal:
        typeof preferences.applicationGoal === "string" ? preferences.applicationGoal : ""
    },
    inferredOpportunities: asStringArray(skillsReview.inferredOpportunities),
    trackerSetup: {
      defaultStatuses: asStringArray(skillsReview.defaultStatuses),
      deadlineReminder:
        typeof skillsReview.deadlineReminder === "boolean" ? skillsReview.deadlineReminder : true
    },
    resumeConfirmed:
      typeof skillsReview.resumeConfirmed === "boolean" ? skillsReview.resumeConfirmed : false,
    completedAt: record.completedAt
  };
}

export function mapProfileResponse(input: {
  user: AuthUser;
  resume: BackendResumeRecord | null;
  onboardingProfile: BackendOnboardingProfileRecord | null;
}): UserProfile {
  const resume = mapResumeRecord(input.resume);
  const onboarding = mapOnboardingRecord(input.onboardingProfile);

  return {
    user: input.user,
    academicInfo: {
      school: onboarding.basics.school,
      program: onboarding.basics.program,
      degreeLevel: resume?.extractedMetadata?.degreeLevel ?? "Unknown",
      graduationYear: onboarding.basics.graduationYear
    },
    jobPreferences: onboarding.preferences,
    resume,
    onboarding,
    skillsSummary: {
      technicalSkills: resume?.extractedMetadata?.skills ?? [],
      opportunityClusters: onboarding.inferredOpportunities
    },
    tailoringPreferences: []
  };
}

export function mapTrackerItem(input: {
  id: string;
  jobId: string;
  company: string;
  title: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  matchScore: number | null;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  location: string | null;
  url: string | null;
}): ApplicationTrackerItem {
  return {
    id: input.id,
    jobId: input.jobId,
    company: input.company,
    role: input.title,
    status: input.status,
    matchScore: input.matchScore,
    dateAdded: input.createdAt,
    deadline: input.deadline,
    notes: input.notes,
    location: input.location ?? "Unknown",
    url: input.url
  };
}

export function buildSnapshot(input: {
  user: AuthUser | null;
  profile: UserProfile | null;
  tracker: ApplicationTrackerItem[];
  dashboard: DashboardSummary | null;
}): AppSnapshot {
  return {
    sessionUser: input.user,
    profile: input.profile,
    tracker: input.tracker,
    dashboard: input.dashboard
  };
}
