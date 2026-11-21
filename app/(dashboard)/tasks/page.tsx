"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useTasks } from "@/features/tasks/hooks";
import { useAuth } from "@/lib/auth/context";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonAvatar, PersonCell } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { fmtShortDate, fmtWhen } from "@/lib/utils/format";
import type { TaskObject, TaskStatus } from "@/types";

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "TODO", label: "To do", dot: "bg-muted-foreground/60" },
  { status: "IN_PROGRESS", label: "In progress", dot: "bg-info" },
  { status: "SUBMITTED", label: "Submitted", dot: "bg-primary" },
  { status: "CHANGES_REQUESTED", label: "Changes requested", dot: "bg-warning" },
  { status: "COMPLETED", label: "Completed", dot: "bg-success" },
];

function isOverdue(t: TaskObject) {
  return Boolean(t.deadline) && t.status !== "COMPLETED" && new Date(t.deadline!) < new Date(new Date().toDateString());
}

function Due({ task }: { task: TaskObject }) {
  if (!task.deadline) return <span className="text-muted-foreground">No deadline</span>;
  return (
    <span className={cn("font-mono tabular", isOverdue(task) ? "font-medium text-danger-foreground" : "text-muted-foreground")}>
      {isOverdue(task) ? "Overdue · " : "Due "}{fmtShortDate(task.deadline)}
    </span>
  );
}

const person = (p: TaskObject["intern"]) => (typeof p === "string" ? { firstName: "", lastName: "" } : p);

// ─── Board ────────────────────────────────────────────────────────────────────

function Board() {
  const { data, isLoading, isError, refetch } = useTasks({ limit: 200 });
  const byStatus = useMemo(() => {
    const m = new Map<TaskStatus, TaskObject[]>();
    for (const c of COLUMNS) m.set(c.status, []);
    for (const t of data?.data ?? []) m.get(t.status)?.push(t);
    return m;
  }, [data]);

  if (isError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
        Couldn&apos;t load tasks.
        <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto pb-2">
      <div className="grid min-w-[1100px] grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const tasks = byStatus.get(col.status) ?? [];
          return (
            <section key={col.status} aria-label={col.label} className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-2.5">
              <div className="flex items-center gap-2 px-1.5 pb-1 pt-1">
                <span className={cn("h-2 w-2 rounded-full", col.dot)} aria-hidden="true" />
                <h2 className="flex-1 text-[13px] font-semibold">{col.label}</h2>
                <span className="font-mono text-xs text-muted-foreground tabular">{isLoading ? "" : tasks.length}</span>
              </div>
              {isLoading ? (
                [0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)
              ) : tasks.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nothing here</p>
              ) : (
                tasks.map((t) => {
                  const p = person(t.intern);
                  return (
                    <Link
                      key={t._id}
                      href={`/tasks/${t._id}`}
                      className="flex flex-col gap-3 rounded-lg border bg-card p-3.5 transition-[border-color,box-shadow] hover:border-input hover:shadow-[0_6px_16px_-10px_rgba(13,18,32,0.25)]"
                    >
                      <span className="text-sm font-medium leading-snug">{t.title}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <PersonAvatar firstName={p.firstName} lastName={p.lastName} size="xs" />
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.firstName} {p.lastName}</span>
                      </span>
                      {t.status === "SUBMITTED" ? (
                        <span className="rounded-md bg-info-soft px-2 py-1.5 text-xs text-info-foreground">Submitted {fmtWhen(t.updatedAt)} · ready to review</span>
                      ) : t.status !== "COMPLETED" && t.deadline ? (
                        <span className="text-xs"><Due task={t} /></span>
                      ) : null}
                      {t.status === "CHANGES_REQUESTED" && t.feedback && (
                        <span className="line-clamp-2 rounded-md bg-warning-soft px-2 py-1.5 text-xs text-warning-foreground">{t.feedback}</span>
                      )}
                    </Link>
                  );
                })
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

function List() {
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useTasks({ page, limit: 25, ...(status !== "ALL" && { status }) });
  const tasks = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={(v) => { setStatus(v as TaskStatus | "ALL"); setPage(1); }}>
        <SelectTrigger className="h-9 w-auto min-w-[190px]" aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {COLUMNS.map((c) => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
          Couldn&apos;t load tasks.
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">No tasks found.</div>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Task</th>
                <th className="px-4 py-2.5 font-medium">Intern</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Deadline</th>
                <th className="px-4 py-2.5"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const p = person(t.intern);
                return (
                  <tr key={t._id} className={cn("border-t", t.status === "SUBMITTED" && "bg-info-soft/40")}>
                    <td className="w-full max-w-0 truncate px-4 py-3 font-medium"><Link href={`/tasks/${t._id}`} className="hover:underline">{t.title}</Link></td>
                    <td className="px-4 py-3"><PersonCell firstName={p.firstName} lastName={p.lastName} size="xs" /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]"><Due task={t} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/tasks/${t._id}`} className="text-[13px] font-medium text-primary hover:underline">{t.status === "SUBMITTED" ? "Review" : "Open"}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>Page <span className="font-mono">{page}</span> of <span className="font-mono">{totalPages}</span></span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user } = useAuth();
  const isHR = user?.role === "HR";
  const [view, setView] = useState<"board" | "list">("board");
  const { data: submitted } = useTasks({ status: "SUBMITTED", limit: 1 });
  const waiting = submitted?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={
          <>
            {isHR ? "Work supervisors have assigned across the programme." : "Work you've assigned to your interns."}
            {waiting > 0 && <> <span className="font-medium text-foreground">{waiting} submission{waiting === 1 ? "" : "s"}</span> waiting for review.</>}
          </>
        }
        actions={
          <>
            <div role="group" aria-label="View" className="flex rounded-lg bg-muted p-1 text-[13px] font-medium">
              {(["board", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={cn("h-7 rounded-md px-3 capitalize transition-colors", view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button asChild><Link href="/tasks/new"><Plus /> New task</Link></Button>
          </>
        }
      />
      {view === "board" ? <Board /> : <List />}
    </div>
  );
}
