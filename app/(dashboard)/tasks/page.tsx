"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";
import { useTasks } from "@/features/tasks/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaskStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  TODO:               { label: "To do",             variant: "outline"     },
  IN_PROGRESS:        { label: "In progress",        variant: "secondary"   },
  SUBMITTED:          { label: "Submitted",          variant: "secondary"   },
  CHANGES_REQUESTED:  { label: "Changes requested",  variant: "destructive" },
  COMPLETED:          { label: "Completed",          variant: "default"     },
};

function fmt(iso?: string): { text: string; overdue: boolean } {
  if (!iso) return { text: "—", overdue: false };
  const d = new Date(iso);
  const now = new Date();
  return {
    text: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    overdue: d < now,
  };
}

function getInternName(task: { intern: { _id: string; firstName: string; lastName: string } | string }): string {
  if (typeof task.intern === "string") return "—";
  return `${task.intern.firstName} ${task.intern.lastName}`;
}

const PAGE_SIZE = 25;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [page, setPage]     = useState(1);

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(status !== "ALL" && { status }),
  };

  const { data, isLoading, isError } = useTasks(params);
  const tasks      = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total      = data?.total ?? 0;

  const needsReview = tasks.filter((t) => t.status === "SUBMITTED").length;
  const isHR = user?.role === "HR";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {!isLoading && `${total} task${total !== 1 ? "s" : ""}`}
            {needsReview > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {needsReview} awaiting review
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            Create task
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-3">
        <Select
          value={status}
          onValueChange={(v) => { setStatus(v as TaskStatus | "ALL"); setPage(1); }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {tasks.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <CheckSquare className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No tasks found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isHR ? "Tasks created by supervisors will appear here." : "Create a task to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Intern</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-destructive">Failed to load tasks.</TableCell>
                </TableRow>
              )}
              {tasks.map((task) => {
                const needsAction = task.status === "SUBMITTED";
                return (
                  <TableRow
                    key={task._id}
                    className={needsAction ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}
                  >
                    <TableCell>
                      <Link href={`/tasks/${task._id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getInternName(task as Parameters<typeof getInternName>[0])}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[task.status].variant} className="text-xs">
                        {STATUS_CONFIG[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const deadline = fmt(task.deadline);
                        return task.deadline ? (
                          <span className={`text-sm ${deadline.overdue && task.status !== "COMPLETED" ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                            {deadline.text}
                            {deadline.overdue && task.status !== "COMPLETED" && " ⚠︎"}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tasks/${task._id}`}>
                          {needsAction ? "Review" : "View"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
