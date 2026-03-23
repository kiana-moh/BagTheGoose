"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/ui/state-panels";
import { useTracker, useUpdateTrackerItem } from "@/hooks/use-tracker";
import { formatDate } from "@/lib/utils";

const toneByStatus = {
  saved: "neutral",
  applied: "accent",
  interview: "warning",
  offer: "success",
  rejected: "danger"
} as const;

export function TrackerPage() {
  const trackerQuery = useTracker();
  const updateTrackerItem = useUpdateTrackerItem();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const trackerItems = trackerQuery.data ?? [];
  const items = useMemo(() => {
    return trackerItems.filter((item) => {
      const matchesQuery = [item.company, item.role, item.location]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, trackerItems]);

  if (trackerQuery.isLoading) {
    return <LoadingPanel title="Loading tracker…" />;
  }

  if (trackerQuery.isError) {
    return (
      <ErrorPanel
        title="Tracker failed to load"
        description={trackerQuery.error instanceof Error ? trackerQuery.error.message : "Try again."}
      />
    );
  }

  return (
    <PageShell
      title="Tracker"
      description="A clean table-first application tracker. Kanban can layer on later without changing the core record model."
    >
      <Card>
        <CardHeader
          title="Applications"
          description="Filter by company, role, or stage. Each row already maps to a persistent tracker record."
        />
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
              <Input
                className="pl-10"
                placeholder="Search company, role, or location"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className="h-11 rounded-2xl border border-shell bg-white px-4 text-sm text-ink-950 outline-none transition focus:border-[#d7b347] focus:ring-2 focus:ring-[#f2e7b5]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {items.length === 0 ? (
            <EmptyPanel
              title="No tracker items found"
              description="Imported jobs will appear here once the extension starts sending them into the authenticated account."
            />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-shell bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-shell bg-[#faf7ef] text-muted">
                  <tr>
                    <Th>Company</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Match</Th>
                    <Th>Date added</Th>
                    <Th>Deadline</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-shell last:border-b-0 hover:bg-[#fbfaf6]">
                      <Td>{item.company}</Td>
                      <Td>
                        <div>
                          <p className="font-medium tracking-[-0.02em] text-ink-950">{item.role}</p>
                          <p className="text-xs text-muted">{item.location}</p>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={toneByStatus[item.status]}>{item.status}</Badge>
                      </Td>
                      <Td>{item.matchScore === null ? "N/A" : `${item.matchScore}%`}</Td>
                      <Td>{formatDate(item.dateAdded)}</Td>
                      <Td>{item.deadline ? formatDate(item.deadline) : "None"}</Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const nextStatus =
                              item.status === "saved"
                                ? "applied"
                                : item.status === "applied"
                                  ? "interview"
                                  : item.status === "interview"
                                    ? "offer"
                                    : item.status === "offer"
                                      ? "offer"
                                      : "saved";
                            void updateTrackerItem.mutateAsync({
                              trackerItemId: item.id,
                              payload: { status: nextStatus }
                            });
                          }}
                        >
                          Advance
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3.5 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 align-middle">{children}</td>;
}
