import { redirect } from "next/navigation";
import { getServerAppSnapshot } from "@/lib/api/server";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getServerAppSnapshot();

  if (!snapshot.sessionUser) {
    redirect("/login");
  }

  if (!snapshot.profile?.resume?.latexContent) {
    redirect("/resume");
  }

  if (snapshot.profile?.onboarding.completed) {
    redirect("/dashboard");
  }

  return children;
}
