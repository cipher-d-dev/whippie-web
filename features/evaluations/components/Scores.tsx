"use client";

import { cn } from "@/lib/utils/cn";
import type { EvaluationScores } from "@/types";

export const SCORE_CATEGORIES: { key: keyof EvaluationScores; label: string; description: string }[] = [
  { key: "workQuality", label: "Quality of work", description: "Accurate, complete and to the brief" },
  { key: "reliability", label: "Reliability", description: "Shows up, meets deadlines, can be counted on" },
  { key: "communication", label: "Communication", description: "Clear in writing and in meetings" },
  { key: "learningProgress", label: "Learning progress", description: "Picks up new tools and feedback quickly" },
  { key: "professionalism", label: "Professionalism", description: "Conduct, attitude and how they work with the team" },
];

export const SCORE_LABELS: Record<number, string> = {
  1: "Needs a lot of support", 2: "Below expectations", 3: "Meets expectations", 4: "Strong", 5: "Excellent",
};

export function averageScore(s: EvaluationScores) {
  return (s.workQuality + s.reliability + s.communication + s.learningProgress + s.professionalism) / 5;
}

/** 1–5 picker. A radio group, so arrow keys move between scores. */
export function ScoreInput({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden w-40 text-right text-xs text-muted-foreground sm:block">{SCORE_LABELS[value]}</span>
        <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = value === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${n} — ${SCORE_LABELS[n]}`}
                tabIndex={on ? 0 : -1}
                onClick={() => onChange(n)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, value + 1)); }
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, value - 1)); }
                }}
                className={cn(
                  "h-10 w-11 rounded-lg border font-mono text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-secondary-foreground hover:border-primary"
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Read-only score row with a five-step meter. */
export function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">{SCORE_LABELS[value]}</span>
        <span className="flex gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={cn("h-2 w-6 rounded-full", n <= value ? "bg-primary" : "bg-muted")} />
          ))}
        </span>
        <span className="w-4 text-right font-mono text-sm tabular">{value}</span>
      </span>
    </div>
  );
}
