import type {
  ApplicationTrackerItem,
  AppSnapshot,
  AuthUser,
  BackendOnboardingProfileRecord,
  BackendResumeRecord,
  DashboardSummary,
  UserProfile
} from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/session";
import { ApiError } from "./http";
import { buildSnapshot, mapProfileResponse, mapTrackerItem } from "./mappers";
import { serverApiFetch } from "./server-http";

type ProfileResponse = {
  user: AuthUser;
  resume: BackendResumeRecord | null;
  onboardingProfile: BackendOnboardingProfileRecord | null;
};

export async function getServerCurrentUser(): Promise<AuthUser | null> {
  return getCurrentUser();
}

export async function getServerProfile(): Promise<UserProfile | null> {
  try {
    const data = await serverApiFetch<ProfileResponse>("/api/v1/profile", {
      method: "GET"
    });
    return mapProfileResponse(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function getServerDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    return await serverApiFetch<DashboardSummary>("/api/v1/dashboard/summary", {
      method: "GET"
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function getServerTracker(): Promise<ApplicationTrackerItem[]> {
  try {
    const data = await serverApiFetch<{
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
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return [];
    }
    throw error;
  }
}

export async function getServerAppSnapshot(): Promise<AppSnapshot> {
  const user = await getServerCurrentUser();
  if (!user) {
    return buildSnapshot({
      user: null,
      profile: null,
      tracker: [],
      dashboard: null
    });
  }

  const [profile, tracker, dashboard] = await Promise.all([
    getServerProfile(),
    getServerTracker(),
    getServerDashboardSummary()
  ]);

  return buildSnapshot({
    user,
    profile,
    tracker,
    dashboard
  });
}
