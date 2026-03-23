import { redirect } from "next/navigation";
import { getServerAppSnapshot } from "@/lib/api/server";
import { getRequiredProtectedPath } from "@/lib/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getServerAppSnapshot();
  if (snapshot.sessionUser) {
    redirect(getRequiredProtectedPath(snapshot));
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="absolute inset-0 -z-10 bg-shell-gradient" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1180px] items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="max-w-[520px] space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ead9a1] bg-[#fcf4da] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#866712]">
            <span>🪿</span>
            <span>BagTheGoose</span>
          </div>
          <div>
            <h1 className="text-[44px] font-semibold tracking-[-0.065em] text-ink-950 md:text-[56px]">
              A cleaner workspace for serious job search.
            </h1>
            <p className="mt-4 max-w-[460px] text-[15px] leading-8 text-muted">
              Keep your LaTeX resume, targeting setup, matched opportunities, and application tracking in one tight system.
            </p>
          </div>
        </section>
        <div className="justify-self-end w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
