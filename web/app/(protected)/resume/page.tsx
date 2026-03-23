import { requireProtectedSnapshot } from "@/lib/server-route-guards";
import { ResumePage } from "@/components/resume/resume-page";

export default async function ResumeRoutePage() {
  await requireProtectedSnapshot({
    allow: (snapshot) => !snapshot.profile?.resume?.latexContent
  });

  return <ResumePage />;
}
