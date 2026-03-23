import { redirect } from "next/navigation";
import { ProtectedShellClient } from "@/components/layout/protected-shell-client";
import { getServerAppSnapshot } from "@/lib/api/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getServerAppSnapshot();

  if (!snapshot.sessionUser) {
    redirect("/login");
  }

  return <ProtectedShellClient user={snapshot.sessionUser}>{children}</ProtectedShellClient>;
}
