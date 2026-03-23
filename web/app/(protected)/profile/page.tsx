import { requireProtectedSnapshot } from "@/lib/server-route-guards";
import { ProfilePage } from "@/components/profile/profile-page";

export default async function ProfileRoutePage() {
  await requireProtectedSnapshot({
    allow: (snapshot) => Boolean(snapshot.profile?.resume?.latexContent && snapshot.profile.onboarding.completed)
  });

  return <ProfilePage />;
}
