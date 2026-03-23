import type { AppSnapshot } from "@/lib/types";

export function getRequiredProtectedPath(snapshot: AppSnapshot) {
  if (!snapshot.sessionUser) {
    return "/login";
  }

  if (!snapshot.profile?.resume?.latexContent) {
    return "/resume";
  }

  if (!snapshot.profile?.onboarding.completed) {
    return "/onboarding";
  }

  return "/dashboard";
}

export function isProtectedPathAllowed(pathname: string, snapshot: AppSnapshot) {
  const requiredPath = getRequiredProtectedPath(snapshot);

  if (requiredPath === "/dashboard") {
    return true;
  }

  return pathname === requiredPath;
}
