"use client";

import { ArrowUpRight, Clock3 } from "lucide-react";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/ui/state-panels";
import { PageShell } from "@/components/ui/page-shell";
import { formatDate } from "@/lib/utils";

export function DashboardHome() {
  const summaryQuery = useDashboardSummary();

  if (summaryQuery.isError) {
    return (
      <ErrorPanel
        title="Dashboard failed to load"
        description={summaryQuery.error instanceof Error ? summaryQuery.error.message : "Try again."}
      />
    );
  }

  if (summaryQuery.isLoading || !summaryQuery.data) {
    return <LoadingPanel title="Loading your dashboard…" />;
  }

  const summary = summaryQuery.data;

  return (
    <PageShell
      title="Dashboard"
      description="Your current position across resume readiness, imported opportunities, and application follow-through."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {summary.summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{card.label}</p>
                <div className="rounded-full border border-[#ead9a1] bg-[#fcf4da] px-2.5 py-1 text-[11px] font-medium text-[#866712]">
                  Live
                </div>
              </div>
              <div>
                <p className="text-[42px] font-semibold tracking-[-0.06em] text-ink-950">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{card.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader title="Recent activity" description="Fresh backend events and account updates." />
          <CardContent className="space-y-3">
            {summary.recentActivity.length > 0 ? (
              summary.recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-shell bg-white px-4 py-4">
                  <div>
                    <h3 className="font-medium tracking-[-0.02em] text-ink-950">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted">{item.detail}</p>
                  </div>
                  <Badge tone="neutral">
                    <Clock3 className="mr-1 h-3.5 w-3.5" />
                    {formatDate(item.timestamp)}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyPanel
                title="No recent activity yet"
                description="Resume analysis, tracker updates, and job imports will show up here once the system is in use."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recommended actions" description="The tightest next moves from the current state of your account." />
          <CardContent className="space-y-3">
            {summary.recommendedActions.length > 0 ? (
              summary.recommendedActions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-shell bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium tracking-[-0.02em] text-ink-950">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted">{item.description}</p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 text-black/35" />
                  </div>
                </div>
              ))
            ) : (
              <EmptyPanel
                title="No recommendations right now"
                description="Once the core profile is complete, the dashboard will surface next actions here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
