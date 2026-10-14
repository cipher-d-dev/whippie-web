"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEvaluation } from "@/features/evaluations/hooks";
import { useSupervisorMe, useSupervisorInterns } from "@/features/supervisors/hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  internId:  z.string().min(1, "Select an intern"),
  comments:  z.string().min(1, "Comments are required"),
});

type FormValues = z.infer<typeof schema>;

// ─── Score categories ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "workQuality",      label: "Work quality",      description: "Quality and accuracy of work produced" },
  { key: "reliability",      label: "Reliability",       description: "Punctuality, consistency, dependability" },
  { key: "communication",    label: "Communication",     description: "Written and verbal communication skills" },
  { key: "learningProgress", label: "Learning progress", description: "Rate of skill development and improvement" },
  { key: "professionalism",  label: "Professionalism",   description: "Attitude, conduct, and workplace behaviour" },
] as const;

type ScoreKey = (typeof CATEGORIES)[number]["key"];

const SCORE_LABELS: Record<number, string> = {
  1: "Poor", 2: "Below average", 3: "Average", 4: "Good", 5: "Excellent",
};

// ─── Score slider component ───────────────────────────────────────────────────

function ScoreSlider({ label, description, value, onChange }: {
  label: string; description: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
          <Star className={`h-3.5 w-3.5 ${value >= 1 ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          <span className="text-sm font-bold text-primary">{value}</span>
          <span className="text-xs text-muted-foreground">· {SCORE_LABELS[value]}</span>
        </div>
      </div>
      <div className="px-1">
        <Slider
          min={1} max={5} step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="w-full"
        />
        <div className="mt-1 flex justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`text-[10px] ${value === n ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewEvaluationPage() {
  const router = useRouter();
  const { data: meData } = useSupervisorMe();
  const supervisorId = meData?.data?.supervisor?._id ?? "";
  const { data: internsData } = useSupervisorInterns(supervisorId);
  const interns = internsData?.data?.interns ?? [];

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    workQuality: 3, reliability: 3, communication: 3, learningProgress: 3, professionalism: 3,
  });

  const createMut = useCreateEvaluation((id) => router.push(`/evaluations/${id}`));

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    createMut.mutate({ internId: values.internId, scores, comments: values.comments });
  };

  const avgScore = (Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/evaluations"><ArrowLeft className="mr-2 h-4 w-4" />Back to evaluations</Link>
        </Button>
        <h2 className="mt-2 text-xl font-semibold">New evaluation</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Score the intern across 5 categories. Saved as draft — submit when ready.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Intern picker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Intern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Select intern <span className="text-destructive">*</span></Label>
              <Select value={watch("internId") ?? ""} onValueChange={(v) => setValue("internId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an intern to evaluate" />
                </SelectTrigger>
                <SelectContent>
                  {interns.map((i) => (
                    <SelectItem key={i._id} value={i._id}>
                      {i.firstName} {i.lastName} · {i.institution}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.internId && <p className="text-xs text-destructive">{errors.internId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Scores */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Performance scores</CardTitle>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold">{avgScore}</span>
                <span className="text-xs text-muted-foreground">avg</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {CATEGORIES.map(({ key, label, description }) => (
              <ScoreSlider
                key={key}
                label={label}
                description={description}
                value={scores[key]}
                onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
              />
            ))}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overall comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Comments <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Provide an overall assessment of the intern's performance, noting strengths and areas for improvement…"
                rows={5}
                className="resize-none"
                {...register("comments")}
              />
              {errors.comments && <p className="text-xs text-destructive">{errors.comments.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild><Link href="/evaluations">Cancel</Link></Button>
          <Button type="submit" disabled={createMut.isPending}>
            {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as draft
          </Button>
        </div>
      </form>
    </div>
  );
}
