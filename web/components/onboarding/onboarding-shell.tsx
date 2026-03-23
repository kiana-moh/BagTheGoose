import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-[980px]">
        <div className="mb-10 flex items-center justify-between">
          <Link
            href={"/resume" as Route}
            className="inline-flex items-center gap-2 rounded-full border border-shell bg-white px-4 py-2 text-sm text-muted transition hover:bg-[#f8f5ee] hover:text-ink-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to resume
          </Link>
          <div className="rounded-full border border-[#ead9a1] bg-[#fcf4da] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#866712]">
            Setup flow
          </div>
        </div>

        <section className="mb-10 max-w-[720px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f6d14]">
            Pre-dashboard setup
          </p>
          <h1 className="mt-3 text-[42px] font-semibold tracking-[-0.06em] text-ink-950 md:text-[50px]">
            Set your targeting before you enter the workspace.
          </h1>
          <p className="mt-4 text-[15px] leading-8 text-muted">
            This setup captures academic context, job preferences, and tracker defaults once so the dashboard can stay focused on execution.
          </p>
        </section>

        <section>{children}</section>
      </div>
    </div>
  );
}
