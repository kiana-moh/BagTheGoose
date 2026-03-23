export type ResumeSource = {
  id: string;
  sourceType: "pasted" | "uploaded";
  latexContent: string;
  fileName?: string | null;
  status: "idle" | "editing" | "uploading" | "processing" | "ready" | "error";
  errors?: string[];
  extractedMetadata?: {
    degreeLevel?: string;
    majors?: string[];
    graduationYear?: number;
    skills?: string[];
    rolePatterns?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
};

export type AuthUser = {
  id: string;
  name?: string;
  email?: string;
};

export type JobPreferences = {
  targetRoles: string[];
  preferredLocations: string[];
  workModes: Array<"remote" | "hybrid" | "onsite">;
  applicationGoal: string;
};

export type OnboardingData = {
  currentStep: number;
  completed: boolean;
  basics: {
    school: string;
    program: string;
    graduationYear: string;
    workAuthorization: string;
  };
  preferences: JobPreferences;
  inferredOpportunities: string[];
  trackerSetup: {
    defaultStatuses: string[];
    deadlineReminder: boolean;
  };
  resumeConfirmed: boolean;
  completedAt?: string | null;
};

export type UserProfile = {
  user: AuthUser;
  academicInfo: {
    school: string;
    program: string;
    degreeLevel: string;
    graduationYear: string;
  };
  jobPreferences: JobPreferences;
  resume: ResumeSource | null;
  onboarding: OnboardingData;
  skillsSummary: {
    technicalSkills: string[];
    opportunityClusters: string[];
  };
  tailoringPreferences: string[];
};

export type ApplicationTrackerItem = {
  id: string;
  jobId: string;
  company: string;
  role: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  matchScore: number | null;
  dateAdded: string;
  deadline?: string | null;
  notes?: string | null;
  location: string;
  url?: string | null;
};

export type DashboardSummary = {
  summaryCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    detail: string;
    timestamp: string;
  }>;
  recommendedActions: Array<{
    id: string;
    title: string;
    description: string;
  }>;
};

export type AppSnapshot = {
  sessionUser: AuthUser | null;
  profile: UserProfile | null;
  tracker: ApplicationTrackerItem[];
  dashboard: DashboardSummary | null;
};

export type BackendResumeRecord = {
  id: string;
  userId: string;
  latexContent: string;
  sourceType: "pasted" | "uploaded";
  fileName: string | null;
  parseStatus: "idle" | "editing" | "uploading" | "processing" | "ready" | "error";
  extractedJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type BackendOnboardingProfileRecord = {
  id: string;
  userId: string;
  academicInfoJson: Record<string, unknown>;
  preferencesJson: Record<string, unknown>;
  skillsReviewJson: Record<string, unknown>;
  completedAt: string | null;
  updatedAt: string;
};
