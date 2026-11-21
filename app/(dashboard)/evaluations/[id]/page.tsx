"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useEvaluation, useSubmitEvaluation } from "@/features/evaluations/hooks";
import { SCORE_CATEGORIES, SCORE_LABELS, ScoreRow, averageScore } from "@/features/evaluations/components/Scores";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtDate, fullName } from "@/lib/utils/format";

export default function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data, isLoading, isError } = useEvaluation(id);
  const evaluation = data?.data?.evaluation;
  const submitMut = useSubmitEvaluation(id);
  const canSubmit = user?.role === "SUPERVISOR" && evaluation?.status === "DRAFT";

  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-16" /><Skeleton className="h-80 rounded-xl" /></div>;
  if (isError || !evaluation) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-lg font-semibold">We couldn&apos;t find that evaluation</p>
        <Button variant="outline" size="sm" asChild className="mt-5"><Link href="/evaluations">Back to evaluations</Link></Button>
      </div>
    );
  }

  const intern = typeof evaluation.intern === "string" ? undefined : evaluation.intern;
  const avg = averageScore(evaluation.scores);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/evaluations" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Evaluations
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar firstName={intern?.firstName} lastName={intern?.lastName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Evaluation · {fullName(evaluation.intern)}</h1>
            <StatusBadge status={evaluation.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            By {fullName(evaluation.supervisor)} · {evaluation.submittedAt ? `submitted ${fmtDate(evaluation.submittedAt)}` : `started ${fmtDate(evaluation.createdAt)}`}
          </p>
        </div>
        {canSubmit && (
          <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>
            {submitMut.isPending ? <Loader2 className="animate-spin" /> : <Send />} Submit evaluation
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl border px-5 py-4">
        <span className="text-sm text-muted-foreground">Average score · {SCORE_LABELS[Math.round(avg)]}</span>
        <span className="font-mono text-[32px] font-medium tracking-[-0.03em] tabular">{avg.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></span>
      </div>

      <Section title="Scores" bodyClassName="divide-y">
        {SCORE_CATEGORIES.map(({ key, label }) => <ScoreRow key={key} label={label} value={evaluation.scores[key]} />)}
      </Section>

      <Section title="Comments" bodyClassName="p-5">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{evaluation.comments}</p>
      </Section>
    </div>
  );
}
