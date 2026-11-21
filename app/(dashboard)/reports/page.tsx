"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReports } from "@/features/reports/hooks";
import { ReportReader } from "@/features/reports/components/ReportReader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { fmtWhen, fmtShortDate } from "@/lib/utils/format";
import type { ReportStatus, ReportType } from "@/types";

const FILTERS: { key: string; label: string; status?: ReportStatus; type?: ReportType }[] = [
  { key: "review", label: "To review", status: "SUBMITTED" },
  { key: "reviewed", label: "Reviewed", status: "REVIEWED" },
  { key: "weekly", label: "Weekly", type: "WEEKLY" },
  { key: "all", label: "All" },
];

export default function ReportsPage() {
  const [filter, setFilter] = useState("review");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const f = FILTERS.find((x) => x.key === filter)!;

  const { data, isLoading, isError, refetch } = useReports({
    page,
    limit: 20,
    ...(f.status && { status: f.status }),
    ...(f.type && { type: f.type }),
  });
  const { data: toReview } = useReports({ status: "SUBMITTED", limit: 1 });
  const reports = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const selected = reports.find((r) => r._id === selectedId) ?? reports[0] ?? null;

  useEffect(() => { setSelectedId(null); }, [filter, page]);

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-4.5rem)] flex-wrap lg:-mx-8 lg:-my-7">
      {/* Inbox */}
      <section aria-label="Reports" className="flex w-full flex-col border-b lg:w-[380px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="space-y-3 px-5 pb-3 pt-6">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Reports</h1>
          <div role="tablist" aria-label="Filter reports" className="flex flex-wrap gap-1.5">
            {FILTERS.map((x) => (
              <button
                key={x.key}
                role="tab"
                aria-selected={filter === x.key}
                onClick={() => { setFilter(x.key); setPage(1); }}
                className={cn(
                  "h-8 rounded-full px-3 text-[13px] font-medium transition-colors",
                  filter === x.key ? "bg-foreground text-background" : "border text-secondary-foreground hover:bg-muted"
                )}
              >
                {x.label}
                {x.key === "review" && toReview?.total ? <span className="ml-1 font-mono tabular">· {toReview.total}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : isError ? (
          <div className="m-5 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger-foreground">
            Couldn&apos;t load reports. <button className="underline" onClick={() => refetch()}>Try again</button>
          </div>
        ) : reports.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">{filter === "review" ? "Nothing waiting for review." : "No reports here."}</p>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {reports.map((r) => {
              const intern = typeof r.intern === "string" ? undefined : r.intern;
              const on = selected?._id === r._id;
              return (
                <li key={r._id} className="border-t">
                  {/* Wide screens: open in the pane. Narrow screens: go to the report page. */}
                  <button
                    onClick={() => setSelectedId(r._id)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "hidden w-full gap-3 px-5 py-3.5 text-left transition-colors lg:flex",
                      on ? "bg-accent/60 shadow-[inset_3px_0_0_hsl(var(--primary))]" : "hover:bg-muted/50"
                    )}
                  >
                    <ItemBody r={r} intern={intern} />
                  </button>
                  <Link href={`/reports/${r._id}`} className="flex gap-3 px-5 py-3.5 hover:bg-muted/50 lg:hidden">
                    <ItemBody r={r} intern={intern} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-[13px] text-muted-foreground">
            <span>Page <span className="font-mono">{page}</span>/<span className="font-mono">{totalPages}</span></span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </section>

      {/* Reading pane (wide screens) */}
      <div className="hidden min-w-0 flex-1 lg:block">
        {selected ? (
          <ReportReader key={selected._id} report={selected} />
        ) : (
          !isLoading && <p className="px-8 py-24 text-center text-sm text-muted-foreground">Select a report to read it.</p>
        )}
      </div>
    </div>
  );
}

function ItemBody({ r, intern }: { r: { title: string; type: ReportType; updatedAt: string; periodStart?: string }; intern?: { firstName: string; lastName: string } }) {
  return (
    <>
      <PersonAvatar firstName={intern?.firstName} lastName={intern?.lastName} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex justify-between gap-2">
          <span className="truncate text-sm font-medium">{intern ? `${intern.firstName} ${intern.lastName}` : "Intern"}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular">{fmtWhen(r.updatedAt)}</span>
        </span>
        <span className="text-[13px] text-secondary-foreground">
          {r.type === "WEEKLY" ? "Weekly" : "Daily"}{r.periodStart ? ` · ${fmtShortDate(r.periodStart)}` : ""}
        </span>
        <span className="truncate text-xs text-muted-foreground">{r.title}</span>
      </span>
    </>
  );
}
