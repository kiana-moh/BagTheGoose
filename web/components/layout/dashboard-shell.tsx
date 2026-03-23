import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1380px] gap-5">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col gap-5">
          <Topbar />
          <main className="pb-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
