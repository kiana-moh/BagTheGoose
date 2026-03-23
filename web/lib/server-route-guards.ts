import { redirect } from "next/navigation";
import { getRequiredProtectedPath } from "@/lib/navigation";
import { getServerAppSnapshot } from "@/lib/api/server";
import type { AppSnapshot } from "@/lib/types";

export async function requireProtectedSnapshot(options: {
  allow: (snapshot: AppSnapshot) => boolean;
}) {
  const snapshot = await getServerAppSnapshot();

  if (!snapshot.sessionUser) {
    redirect("/login");
  }

  if (!options.allow(snapshot)) {
    redirect(getRequiredProtectedPath(snapshot));
  }

  return snapshot;
}
