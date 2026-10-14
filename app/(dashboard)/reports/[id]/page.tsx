"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { useReport, useReviewReport } from "@/features/reports/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { ReportStatus } from "@/types";

const STATUS_CONFIG: Record<ReportStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT:     { label: "Draft",     variant: "outline"   },
  SUBMITTED: { label: "Submitted", variant: "secondary" },
  REVIEWED:  { label: "Reviewed",  variant: "default"   },
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data, isLoading, isError } = useReport(id);
  const report = data?.data?.report;

  const [reviewOpen, setReviewOpen] = useState(false);
  const [feedback, setFeedback]     = useState("");
  const reviewMut = useReviewReport(id, () => { setReviewOpen(false); setFeedback(""); });

  const canReview = (user?.role === "HR" || user?.role === "SUPERVISOR") && report?.status === "SUBMITTED";
  const internName = report?.intern && typeof report.intern !== "string"
    ? `${report.intern.firstName} ${report.intern.lastName}` : "—";

  if (isLoading) return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  if (isError || !report) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-sm text-destructive">Report not found.</p>
      <Button variant="outline" size="sm" asChild><Link href="/reports">Back</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" />Back to reports</Link>
          </Button>
          <h2 className="mt-2 text-xl font-semibold">{report.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_CONFIG[report.status].variant}>{STATUS_CONFIG[report.status].label}</Badge>
            <Badge variant="outline" className="capitalize">{report.type.toLowerCase()}</Badge>
            <span className="text-sm text-muted-foreground">{internName}</span>
          </div>
        </div>
        {canReview && (
          <Button size="sm" onClick={() => setReviewOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Review
          </Button>
        )}
      </div>

      {/* Period */}
      {(report.periodStart || report.periodEnd) && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Period:</span>
          <span className="font-medium">
            {report.periodStart ? new Date(report.periodStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            {report.periodEnd   ? ` → ${new Date(report.periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
          </span>
        </div>
      )}

      {/* Content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Report content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* Feedback (if reviewed) */}
      {report.feedback && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Reviewer feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{report.feedback}</p>
            <p className="mt-2 text-xs text-muted-foreground">Reviewed {fmt(report.reviewedAt)}</p>
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">
        Submitted {fmt(report.createdAt)} · Last updated {fmt(report.updatedAt)}
      </p>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Review report</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">Leave feedback for the intern. The report will be marked as reviewed.</p>
            <div className="space-y-1.5">
              <Label>Feedback (optional)</Label>
              <Textarea
                placeholder="e.g. Good report, clearly written. Consider adding more detail on challenges faced."
                rows={4}
                className="resize-none"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" disabled={reviewMut.isPending}
              onClick={() => reviewMut.mutate(feedback)}>
              {reviewMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
