"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, MessageSquare } from "lucide-react";
import { useTask } from "@/features/tasks/hooks";
import { useTaskSubmissions, useReviewSubmission } from "@/features/submissions/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { TaskStatus, SubmissionStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  TODO:              { label: "To do",            variant: "outline"     },
  IN_PROGRESS:       { label: "In progress",       variant: "secondary"   },
  SUBMITTED:         { label: "Submitted",         variant: "secondary"   },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "destructive" },
  COMPLETED:         { label: "Completed",         variant: "default"     },
};

const SUB_STATUS_CONFIG: Record<SubmissionStatus, { label: string; icon: React.ReactNode }> = {
  PENDING_REVIEW:    { label: "Pending review",    icon: <Clock        className="h-4 w-4 text-amber-500" /> },
  APPROVED:          { label: "Approved",          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
  CHANGES_REQUESTED: { label: "Changes requested", icon: <XCircle      className="h-4 w-4 text-destructive" /> },
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const { data: taskData, isLoading, isError } = useTask(id);
  const { data: submissionsData } = useTaskSubmissions(id);

  const task        = taskData?.data?.task;
  const submissions = submissionsData?.data?.submissions ?? [];
  const latestSub   = submissions[submissions.length - 1];

  const isSupervisor = user?.role === "SUPERVISOR";
  const canReview    = isSupervisor && latestSub?.status === "PENDING_REVIEW";

  const [reviewOpen, setReviewOpen]       = useState(false);
  const [reviewAction, setReviewAction]   = useState<"APPROVED" | "CHANGES_REQUESTED" | null>(null);
  const [feedback, setFeedback]           = useState("");

  const reviewMut = useReviewSubmission(latestSub?._id ?? "", id, () => {
    setReviewOpen(false);
    setFeedback("");
    setReviewAction(null);
  });

  const openReview = (action: "APPROVED" | "CHANGES_REQUESTED") => {
    setReviewAction(action);
    setFeedback("");
    setReviewOpen(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  if (isError || !task) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <p className="text-sm text-destructive">Task not found.</p>
      <Button variant="outline" size="sm" asChild><Link href="/tasks">Back to tasks</Link></Button>
    </div>
  );

  const internName  = typeof task.intern     !== "string" ? `${task.intern.firstName} ${task.intern.lastName}`         : "—";
  const supervisorName = typeof task.supervisor !== "string" && task.supervisor
    ? `${task.supervisor.firstName} ${task.supervisor.lastName}` : "—";
  const cfg = TASK_STATUS_CONFIG[task.status];

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "COMPLETED";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/tasks"><ArrowLeft className="mr-2 h-4 w-4" />Back to tasks</Link>
          </Button>
          <h2 className="mt-2 text-xl font-semibold leading-snug">{task.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Task info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Description */}
          <div className="mb-3 rounded-lg bg-muted/50 p-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
          <div className="divide-y">
            <Row label="Intern"     value={internName} />
            <Row label="Supervisor" value={supervisorName} />
            <Row label="Deadline"   value={task.deadline ? new Date(task.deadline).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : undefined} />
            <Row label="Completed"  value={fmt(task.completedAt)} />
            {task.feedback && <Row label="Feedback"  value={task.feedback} />}
          </div>
        </CardContent>
      </Card>

      {/* Submissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Submissions ({submissions.length})
          </h3>
          {canReview && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-8"
                onClick={() => openReview("APPROVED")}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => openReview("CHANGES_REQUESTED")}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Request changes
              </Button>
            </div>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
            <MessageSquare className="mb-2 h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...submissions].reverse().map((sub, i) => {
              const subCfg = SUB_STATUS_CONFIG[sub.status];
              return (
                <Card key={sub._id} className={i === 0 && sub.status === "PENDING_REVIEW" ? "border-amber-300 dark:border-amber-700" : ""}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      {subCfg.icon}
                      <span className="text-sm font-medium">{subCfg.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmt(sub.createdAt)}</span>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{sub.content}</p>
                    </div>
                    {sub.feedback && (
                      <div className="rounded-lg border border-border bg-card p-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Feedback</p>
                        <p className="text-sm">{sub.feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Created {fmt(task.createdAt)} · Last updated {fmt(task.updatedAt)}
      </p>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED" ? "Approve submission" : "Request changes"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              {reviewAction === "APPROVED"
                ? "Mark this submission as approved. The task will be marked complete."
                : "Ask the intern to revise and resubmit."}
            </p>
            <div className="space-y-1.5">
              <Label>Feedback {reviewAction === "APPROVED" ? "(optional)" : "(recommended)"}</Label>
              <Textarea
                placeholder={
                  reviewAction === "APPROVED"
                    ? "e.g. Great work, well structured."
                    : "e.g. Please revise the introduction and add source citations."
                }
                rows={3}
                className="resize-none"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className={`w-full ${reviewAction === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              variant={reviewAction === "APPROVED" ? "default" : "destructive"}
              disabled={reviewMut.isPending}
              onClick={() => {
                if (!reviewAction) return;
                reviewMut.mutate({ status: reviewAction, feedback: feedback || undefined });
              }}
            >
              {reviewMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewAction === "APPROVED" ? "Confirm approval" : "Confirm — request changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
