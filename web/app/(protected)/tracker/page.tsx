import { requireProtectedSnapshot } from "@/lib/server-route-guards";
import { TrackerPage } from "@/components/tracker/tracker-page";

export default async function TrackerRoutePage() {
  await requireProtectedSnapshot({
    allow: (snapshot) => Boolean(snapshot.profile?.resume?.latexContent && snapshot.profile.onboarding.completed)
  });

  return <TrackerPage />;
}
