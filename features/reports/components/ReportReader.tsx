"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useReviewReport } from "@/features/reports/hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtDate, fmtShortDate } from "@/lib/utils/format";
import type { ReportObject } from "@/types";

/**
 * Reports from the intern app are written as answers to prompts, stored in the
 * single `content` field as "## Heading" blocks. Older reports are free text.
 * Both render here: headed blocks become sections, anything else stays as is.
 */
export function parseReportSections(content: string): { heading?: string; body: string }[] {
  if (!/^## /m.test(content)) return [{ body: content.trim() }];
  const out: { heading?: string; body: string }[] = [];
  let current: { heading?: string; lines: string[] } = { lines: [] };
  for (const line of content.split(/\r?\n/)) {
    const m = /^## (.+)$/.exec(line);
    if (m) {
      if (current.heading || current.lines.join("").trim()) out.push({ heading: current.heading, body: current.lines.join("\n").trim() });
      current = { heading: m[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  out.push({ heading: current.heading, body: current.lines.join("\n").trim() });
  return out.filter((s) => s.body || s.heading);
}

export function ReportReader({ report }: { report: ReportObject }) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const review = useReviewReport(report._id, () => setFeedback(""));
  const canReview = (user?.role === "HR" || user?.role === "SUPERVISOR") && report.status === "SUBMITTED";
  const intern = typeof report.intern === "string" ? undefined : report.intern;
  const sections = parseReportSections(report.content);
  const period =
    report.periodStart && report.periodEnd
      ? `${fmtShortDate(report.periodStart)} – ${fmtShortDate(report.periodEnd)}`
      : report.periodStart ? fmtShortDate(report.periodStart) : null;

  return (
    <article className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3.5 border-b px-6 py-5 lg:px-8">
        <PersonAvatar firstName={intern?.firstName} lastName={intern?.lastName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{intern ? `${intern.firstName} ${intern.lastName}` : "Intern"}</p>
          {intern && <Link href={`/interns/${intern._id}`} className="text-[13px] text-primary hover:underline">View profile</Link>}
        </div>
        <StatusBadge status={report.status} />
      </div>

      <div className="max-w-3xl space-y-6 px-6 py-7 lg:px-8">
        <div className="space-y-1.5">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {report.type === "WEEKLY" ? "Weekly report" : "Daily report"}{period ? ` · ${period}` : ""}
          </p>
          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em]">{report.title}</h2>
        </div>

        {sections.map((s, i) => (
          <section key={i} className="space-y-2">
            {s.heading && <h3 className="text-[13px] font-semibold text-muted-foreground">{s.heading}</h3>}
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{s.body || <span className="text-muted-foreground">No answer</span>}</p>
          </section>
        ))}

        {report.feedback && (
          <section className="rounded-xl border bg-muted/40 p-4">
            <h3 className="text-[13px] font-semibold">Feedback</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{report.feedback}</p>
            {report.reviewedAt && <p className="mt-2 text-xs text-muted-foreground">Reviewed {fmtDate(report.reviewedAt)}</p>}
          </section>
        )}
      </div>

      {canReview && (
        <form
          className="mt-auto space-y-3 border-t bg-muted/30 px-6 py-5 lg:px-8"
          onSubmit={(e) => { e.preventDefault(); review.mutate(feedback.trim()); }}
        >
          <Label htmlFor={`fb-${report._id}`} className="text-[13px] font-semibold">
            Feedback for {intern?.firstName ?? "the intern"} <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={`fb-${report._id}`}
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What went well, and what to focus on next"
            className="bg-background"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{intern?.firstName ?? "They"} will be notified when you mark this reviewed.</span>
            <Button type="submit" disabled={review.isPending}>
              {review.isPending && <Loader2 className="animate-spin" />} Mark reviewed
            </Button>
          </div>
        </form>
      )}
    </article>
  );
}
