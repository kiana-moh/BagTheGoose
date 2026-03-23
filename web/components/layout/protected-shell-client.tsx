"use client";

import { useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { silentlyBootstrapExtension } from "@/extension-auth-bootstrap";
import type { AuthUser } from "@/lib/types";

export function ProtectedShellClient({
  user,
  children
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const extensionId = process.env.NEXT_PUBLIC_BAGTHEGOOSE_EXTENSION_ID;
    if (!user || !extensionId) {
      return;
    }

    void silentlyBootstrapExtension({
      extensionId
    });
  }, [user]);

  return <DashboardShell>{children}</DashboardShell>;
}
