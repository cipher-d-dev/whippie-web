"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Send, Loader2 } from "lucide-react";
import { useEvaluation, useSubmitEvaluation } from "@/features/evaluations/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EvaluationScores } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES: { key: keyof EvaluationScores; label: string }[] = [
  { key: "workQuality",      label: "Work quality"      },
  { key: "reliability",      label: "Reliability"       },
  { key: "communication",    label: "Communication"     },
  { key: "learningProgress", label: "Learning progress" },
  { key: "professionalism",  label: "Professionalism"   },
];

const SCORE_LABELS: Record<number, string> = {
  1: "Poor", 2: "Below average", 3: "Average", 4: "Good", 5: "Excellent",
};

const SCORE_COLOR: Record<number, string> = {
  1: "bg-rose-500",
  2: "bg-orange-400",
  3: "bg-amber-400",
  4: "bg-blue-500",
  5: "bg-emerald-500",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <span className="w-16 text-right text-xs text-muted-foreground">{SCORE_LABELS[value]}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${SCORE_COLOR[value] ?? "bg-primary"}`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data, isLoading, isError } = useEvaluation(id);
  const evaluation = data?.data?.evaluation;

  const submitMut = useSubmitEvaluation(id);

  const canSubmit = user?.role === "SUPERVISOR" && evaluation?.status === "DRAFT";

  if (isLoading) return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  if (isError || !evaluation) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-sm text-destructive">Evaluation not found.</p>
      <Button variant="outline" size="sm" asChild><Link href="/evaluations">Back</Link></Button>
    </div>
  );

  const internName     = typeof evaluation.intern     !== "string" ? `${evaluation.intern.firstName} ${evaluation.intern.lastName}`         : "—";
  const supervisorName = typeof evaluation.supervisor !== "string" ? `${evaluation.supervisor.firstName} ${evaluation.supervisor.lastName}` : "—";
  const scores         = evaluation.scores;
  const avgScore       = (Object.values(scores).reduce((a, b) => a + b, 0) / 5);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/evaluations"><ArrowLeft className="mr-2 h-4 w-4" />Back to evaluations</Link>
          </Button>
          <h2 className="mt-2 text-xl font-semibold">Evaluation — {internName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={evaluation.status === "SUBMITTED" ? "default" : "outline"}>
              {evaluation.status === "SUBMITTED" ? "Submitted" : "Draft"}
            </Badge>
            <span className="text-sm text-muted-foreground">by {supervisorName}</span>
          </div>
        </div>
        {canSubmit && (
          <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>
            {submitMut.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Send className="mr-2 h-4 w-4" />}
            Submit evaluation
          </Button>
        )}
      </div>

      {/* Overall score callout */}
      <div className="flex items-center gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight">{avgScore.toFixed(1)}<span className="text-lg font-normal text-muted-foreground"> / 5</span></p>
          <p className="text-sm text-muted-foreground">{SCORE_LABELS[Math.round(avgScore)]} · Average across all categories</p>
        </div>
      </div>

      {/* Score breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Score breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {CATEGORIES.map(({ key, label }) => (
            <ScoreBar key={key} label={label} value={scores[key]} />
          ))}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overall comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{evaluation.comments}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Created {fmt(evaluation.createdAt)}
        {evaluation.submittedAt && ` · Submitted ${fmt(evaluation.submittedAt)}`}
      </p>
    </div>
  );
}
