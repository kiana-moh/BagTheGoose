"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

export function Topbar() {
  const logout = useLogout();
  const userQuery = useCurrentUser();

  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-shell bg-white/92 px-4 py-4 shadow-panel md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex items-center gap-3 rounded-2xl bg-[#f6f3eb] px-4 py-3 text-sm text-muted md:min-w-[340px]">
        <Search className="h-4 w-4" />
        <span>Search roles, companies, notes, or tracker items</span>
      </div>

      <div className="flex items-center gap-3 self-end md:self-auto">
        <button className="grid h-10 w-10 place-items-center rounded-2xl border border-shell bg-white text-black/55 transition hover:bg-[#f8f5ee]">
          <Bell className="h-4 w-4" />
        </button>
        <div className="rounded-2xl border border-shell bg-white px-4 py-2.5">
          <p className="text-sm font-medium text-ink-950">{userQuery.data?.name ?? "Guest"}</p>
          <p className="text-xs text-muted">{userQuery.data?.email ?? "No email"}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            void logout.mutateAsync().then(() => {
              window.location.href = "/login";
            });
          }}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
