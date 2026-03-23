import type {
  ApplicationTrackerItem,
  AuthUser,
  BackendOnboardingProfileRecord,
  BackendResumeRecord,
  DashboardSummary,
  UserProfile
} from "@/lib/types";
import { apiFetch } from "./http";
import { mapOnboardingRecord, mapProfileResponse, mapResumeRecord, mapTrackerItem } from "./mappers";

type SessionResponse = {
  user: AuthUser;
};

type ProfileResponse = {
  user: AuthUser;
  resume: BackendResumeRecord | null;
  onboardingProfile: BackendOnboardingProfileRecord | null;
};

export const apiClient = {
  auth: {
    getCurrentUser: async (): Promise<AuthUser | null> => {
      try {
        const data = await apiFetch<SessionResponse>("/api/v1/me", {
          method: "GET"
        });
        return data.user;
      } catch (error) {
        if (error instanceof Error && "status" in error && Number(error.status) === 401) {
          return null;
        }
        throw error;
      }
    }
  },
  profile: {
    getProfile: async (): Promise<UserProfile | null> => {
      try {
        const data = await apiFetch<ProfileResponse>("/api/v1/profile", {
          method: "GET"
        });
        return mapProfileResponse(data);
      } catch (error) {
        if (error instanceof Error && "status" in error && Number(error.status) === 401) {
          return null;
        }
        throw error;
      }
    },
    updateProfile: async (input: {
      user?: { name?: string };
      academicInfoJson?: Record<string, unknown>;
      preferencesJson?: Record<string, unknown>;
      skillsReviewJson?: Record<string, unknown>;
    }): Promise<UserProfile> => {
      const data = await apiFetch<ProfileResponse>("/api/v1/profile", {
        method: "PATCH",
        body: JSON.stringify(input)
      });
      return mapProfileResponse(data);
    }
  },
  resume: {
    getResume: async () => {
      const data = await apiFetch<{ resume: BackendResumeRecord | null }>("/api/v1/resume", {
        method: "GET"
      });
      return mapResumeRecord(data.resume);
    },
    saveLatexSource: async (input: {
      latexContent: string;
      sourceType?: "pasted" | "uploaded";
      fileName?: string;
    }) => {
      const data = await apiFetch<{
        resume: BackendResumeRecord;
        extractedProfile: Record<string, unknown>;
      }>("/api/v1/resume", {
        method: "POST",
        body: JSON.stringify({
          latexContent: input.latexContent,
          sourceType: input.sourceType ?? "pasted",
          fileName: input.fileName
        })
      });
      return mapResumeRecord({
        ...data.resume,
        extractedJson: data.extractedProfile
      });
    }
  },
  onboarding: {
    getOnboarding: async () => {
      const data = await apiFetch<{
        onboardingProfile: BackendOnboardingProfileRecord | null;
      }>("/api/v1/onboarding-profile", {
        method: "GET"
      });
      return mapOnboardingRecord(data.onboardingProfile);
    },
    saveProgress: async (input: {
      academicInfoJson: Record<string, unknown>;
      preferencesJson: Record<string, unknown>;
      skillsReviewJson: Record<string, unknown>;
      completedAt?: string | null;
    }) => {
      const data = await apiFetch<{
        onboardingProfile: BackendOnboardingProfileRecord;
      }>("/api/v1/onboarding-profile", {
        method: "PUT",
        body: JSON.stringify(input)
      });
      return mapOnboardingRecord(data.onboardingProfile);
    }
  },
  dashboard: {
    getSummary: async (): Promise<DashboardSummary> => {
      return apiFetch<DashboardSummary>("/api/v1/dashboard/summary", {
        method: "GET"
      });
    }
  },
  tracker: {
    getItems: async (): Promise<ApplicationTrackerItem[]> => {
      const data = await apiFetch<{
        items: Array<{
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
        }>;
      }>("/api/v1/tracker", {
        method: "GET"
      });

      return data.items.map(mapTrackerItem);
    },
    updateItem: async (
      trackerItemId: string,
      input: {
        status?: "saved" | "applied" | "interview" | "offer" | "rejected";
        matchScore?: number | null;
        deadline?: string | null;
        notes?: string | null;
      }
    ): Promise<ApplicationTrackerItem> => {
      const data = await apiFetch<{
        item: {
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
        };
      }>(`/api/v1/tracker/${trackerItemId}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      });

      return mapTrackerItem(data.item);
    }
  }
};
