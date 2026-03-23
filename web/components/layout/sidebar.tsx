"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { FileCode2, LayoutDashboard, Table2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume" as Route, label: "Resume", icon: FileCode2 },
  { href: "/tracker" as Route, label: "Tracker", icon: Table2 },
  { href: "/profile" as Route, label: "Profile", icon: UserRound }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[236px] shrink-0 rounded-[28px] border border-shell bg-white/92 px-4 py-5 shadow-panel lg:block">
      <div className="border-b border-shell px-2 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#f0dfaa] bg-[#fcf4da] text-lg">
            🪿
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f6d14]">
              BagTheGoose
            </p>
            <p className="mt-1 text-[13px] text-muted">Job search workspace</p>
          </div>
        </div>
      </div>

      <nav className="mt-5 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium tracking-[-0.01em] transition",
                active
                  ? "bg-[#111215] text-white"
                  : "text-[#53514b] hover:bg-[#f7f4ec] hover:text-ink-950"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
