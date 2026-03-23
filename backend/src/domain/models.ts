export type DegreeLevel =
  | "high_school"
  | "bachelors"
  | "masters"
  | "phd"
  | "bootcamp"
  | "unknown";

export type ResumeParseStatus =
  | "idle"
  | "editing"
  | "uploading"
  | "processing"
  | "ready"
  | "error";

export interface ResumeSection {
  heading: string;
  content: string;
  bullets: string[];
}

export interface ParsedResumeDocument {
  rawLatex: string;
  plainText: string;
  sections: ResumeSection[];
  detectedSkills: string[];
  educationLines: string[];
  experienceLines: string[];
  projectLines: string[];
}

export interface EducationEntry {
  institution?: string;
  degreeLevel: DegreeLevel;
  program?: string;
  graduationYear?: number;
  evidence: string[];
}

export interface ExperienceEntry {
  organization?: string;
  title?: string;
  bullets: string[];
  domains: string[];
  technologies: string[];
}

export interface ProjectEntry {
  name?: string;
  bullets: string[];
  technologies: string[];
  domains: string[];
}

export interface StructuredResumeProfile {
  candidateSummary: string;
  degreeLevel: DegreeLevel;
  majors: string[];
  graduationYear?: number;
  education: EducationEntry[];
  skills: string[];
  technologies: string[];
  domainsOfStrength: string[];
  rolePatterns: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  evidenceHighlights: string[];
  confidence: number;
}

export interface TargetRole {
  role: string;
  category: "direct" | "adjacent" | "stretch";
  rationale: string;
  confidence: number;
  evidence: string[];
}

export interface ScrapingProfile {
  desiredRoleKeywords: string[];
  adjacentRoleKeywords: string[];
  blockedSeniorityKeywords: string[];
  preferredLocations: string[];
  blockedLocations: string[];
  blockedVisaTerms: string[];
  blockedDegreeTerms: string[];
  skillHints: string[];
}

export interface JobPosting {
  title: string;
  company: string;
  location?: string;
  description: string;
  url?: string;
}

export interface HardDisqualifier {
  type:
    | "degree_requirement"
    | "seniority_requirement"
    | "years_requirement"
    | "visa_requirement"
    | "citizenship_requirement"
    | "required_skill_gap";
  reason: string;
  severity: "hard" | "warning";
}

export interface JobFitAnalysis {
  overallScore: number;
  semanticSimilarity: number;
  recommendation: "strong_apply" | "apply" | "borderline" | "skip";
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  hardDisqualifiers: HardDisqualifier[];
  evidence: string[];
  resumeTailoringHooks: string[];
}

export interface ResumeTailoringEdit {
  section: string;
  target: string;
  suggestedRewrite: string;
  rationale: string;
}

export interface ResumeTailoringPlan {
  summary: string;
  edits: ResumeTailoringEdit[];
  skillsToElevate: string[];
  bulletsToPrioritize: string[];
  prohibitedClaims: string[];
}

export interface ResumeAnalysisRequest {
  latexResume: string;
}

export interface TargetRoleRequest {
  profile: StructuredResumeProfile;
}

export interface ScrapingProfileRequest {
  profile: StructuredResumeProfile;
  targetRoles: TargetRole[];
}

export interface JobFitRequest {
  profile: StructuredResumeProfile;
  job: JobPosting;
}

export interface ResumeTailoringRequest {
  profile: StructuredResumeProfile;
  job: JobPosting;
  originalLatexResume: string;
  fitAnalysis?: JobFitAnalysis;
}

export interface VectorRecord {
  id: string;
  namespace: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

export interface SimilarityMatch {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

export interface ExtensionBootstrapGrant {
  id: string;
  tokenHash: string;
  userId: string;
  extensionId: string;
  allowedOrigin: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface ExtensionAccessTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  extensionId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  authProvider: string;
  authProviderUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  latexContent: string;
  sourceType: "pasted" | "uploaded";
  fileName: string | null;
  parseStatus: ResumeParseStatus;
  extractedJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingProfileRecord {
  id: string;
  userId: string;
  academicInfoJson: Record<string, unknown>;
  preferencesJson: Record<string, unknown>;
  skillsReviewJson: Record<string, unknown>;
  completedAt: string | null;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  userId: string;
  externalSource: string;
  externalJobId: string | null;
  company: string;
  title: string;
  location: string | null;
  description: string | null;
  url: string | null;
  importedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationTrackerItemRecord {
  id: string;
  userId: string;
  jobId: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  matchScore: number | null;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
