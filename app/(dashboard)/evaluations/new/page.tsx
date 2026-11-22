"use client";

import { TypeLabel } from "@/components/shared/TypeLabel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEvaluation } from "@/features/evaluations/hooks";
import { useSupervisorMe, useSupervisorInterns } from "@/features/supervisors/hooks";
import { useAttendance } from "@/features/attendance/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useReports } from "@/features/reports/hooks";
import { SCORE_CATEGORIES, ScoreInput } from "@/features/evaluations/components/Scores";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Section } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import type { EvaluationScores } from "@/types";

const schema = z.object({
  internId: z.string().min(1, "Choose an intern"),
  comments: z.string().trim().min(1, "Add a short comment"),
});
type FormValues = z.infer<typeof schema>;

/** What the intern has done so far, to ground the scores. */
function Evidence({ internId }: { internId: string }) {
  const att = useAttendance({ intern: internId, checkType: "CHECK_IN", limit: 1 });
  const tasks = useTasks({ intern: internId, limit: 1 });
  const done = useTasks({ intern: internId, status: "COMPLETED", limit: 1 });
  const changes = useTasks({ intern: internId, status: "CHANGES_REQUESTED", limit: 1 });
  const reports = useReports({ intern: internId, limit: 1 });
  const rows = [
    ["Check-ins recorded", att.data?.total],
    ["Tasks completed", done.data !== undefined && tasks.data !== undefined ? `${done.data.total} of ${tasks.data.total}` : undefined],
    ["Changes requested", changes.data?.total],
    ["Reports submitted", reports.data?.total],
  ] as const;
  return (
    <dl className="px-5 py-1">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between border-t py-3 text-[13px] first:border-t-0">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-mono font-medium tabular">{v ?? "…"}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const { data: meData } = useSupervisorMe();
  const supervisorId = meData?.data?.supervisor?._id ?? "";
  const { data: internsData } = useSupervisorInterns(supervisorId);
  const interns = internsData?.data?.interns ?? [];

  const [scores, setScores] = useState<EvaluationScores>({
    workQuality: 3, reliability: 3, communication: 3, learningProgress: 3, professionalism: 3,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } =
    useForm<FormValues>({ resolver: zodResolver(schema) });
  const internId = watch("internId") ?? "";
  const intern = interns.find((i) => i._id === internId);

  const createMut = useCreateEvaluation(
    (id) => router.push(`/evaluations/${id}`),
    setError as (field: string, error: { type: string; message: string }) => void
  );
  const onSubmit = (values: FormValues) => createMut.mutate({ internId: values.internId, scores, comments: values.comments });
  const avg = (Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);

  return (
    <div className="space-y-6">
      <Link href="/evaluations" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Evaluations
      </Link>
      <PageHeader
        title="New evaluation"
        description="Rate each area from 1 (needs a lot of support) to 5 (excellent). It's saved as a draft; you submit it when you're ready."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="intern">Intern</Label>
            <Select value={internId} onValueChange={(v) => setValue("internId", v, { shouldValidate: true })}>
              <SelectTrigger id="intern" className="max-w-md"><SelectValue placeholder="Choose who you're evaluating" /></SelectTrigger>
              <SelectContent>
                {interns.map((i) => (
                  <SelectItem key={i._id} value={i._id}>{i.firstName} {i.lastName}{i.department ? ` · ${i.department.name}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.internId && <p className="text-xs text-danger-foreground">{errors.internId.message}</p>}
          </div>

          <Section bodyClassName="divide-y">
            {SCORE_CATEGORIES.map(({ key, label, description }) => (
              <ScoreInput
                key={key}
                label={label}
                description={description}
                value={scores[key]}
                onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
              />
            ))}
          </Section>

          <div className="space-y-1.5">
            <Label htmlFor="comments">Comments</Label>
            <p className="text-xs text-muted-foreground">Strengths, and what {intern?.firstName ?? "the intern"} should focus on next.</p>
            <Textarea id="comments" rows={5} {...register("comments")} />
            {errors.comments && <p className="text-xs text-danger-foreground">{errors.comments.message}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button variant="outline" asChild><Link href="/evaluations">Cancel</Link></Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="animate-spin" />} Save draft
            </Button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Section bodyClassName="space-y-4 p-5">
            {intern ? (
              <div className="flex items-center gap-3">
                <PersonAvatar firstName={intern.firstName} lastName={intern.lastName} size="lg" />
                <div className="min-w-0">
                  <p className="font-semibold">{intern.firstName} {intern.lastName}</p>
                  <p className="truncate text-[13px] text-muted-foreground"><TypeLabel type={intern.internshipType} />{intern.department ? ` · ${intern.department.name}` : ""}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Choose an intern to see their record here.</p>
            )}
            <div className="flex items-baseline justify-between rounded-lg bg-muted/60 px-4 py-3">
              <span className="text-[13px] text-muted-foreground">Average score</span>
              <span className="font-mono text-[28px] font-medium tracking-[-0.02em] tabular">{avg}<span className="text-sm text-muted-foreground">/5</span></span>
            </div>
          </Section>
          {intern && (
            <Section title="Evidence so far">
              <Evidence internId={intern._id} />
            </Section>
          )}
        </aside>
      </form>
    </div>
  );
}
