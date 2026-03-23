import { requireProtectedSnapshot } from "@/lib/server-route-guards";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default async function DashboardPage() {
  await requireProtectedSnapshot({
    allow: (snapshot) => Boolean(snapshot.profile?.resume?.latexContent && snapshot.profile.onboarding.completed)
  });

  return <DashboardHome />;
}
