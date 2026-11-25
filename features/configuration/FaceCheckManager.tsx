"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtClock } from "@/lib/utils/format";
import { useSettings, useUpdateSettings } from "@/features/settings/hooks";
import { Section } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils/cn";

const LEVELS = [
  { value: 0.35, label: "Lenient", help: "Only flags faces that clearly aren't them. Best while you're getting started." },
  { value: 0.5, label: "Standard", help: "Flags weaker matches too. Some genuine check-ins in bad light may be flagged." },
  { value: 0.65, label: "Strict", help: "Flags anything less than a close match. Expect more flags to review." },
];

/** Turn the face check on/off and set how close a selfie must match. */
export function FaceCheckManager() {
  const { settings } = useSettings();
  const save = useUpdateSettings();
  const { threshold } = settings.faceCheck;
  const nearest = LEVELS.reduce((a, b) => (Math.abs(b.value - threshold) < Math.abs(a.value - threshold) ? b : a));

  return (
    <div className="space-y-6">
      <LateTime />
      <Section title="Face check at check-in" bodyClassName="space-y-4 p-5">
        <p className="text-sm text-muted-foreground">
          Interns take a quick selfie when they check in. It&apos;s compared with the face photo you approved, so nobody can check in for a friend.
          A check-in that doesn&apos;t match is <strong className="font-medium text-foreground">flagged for you</strong>, never refused.
        </p>
        <p className="rounded-lg border bg-muted/40 p-4 text-sm">
          <span className="font-medium">Required for every intern.</span>{" "}
          <span className="text-muted-foreground">New interns take their face photo when they first open the app; existing interns are asked before they can check in again.</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Approve new face photos on <Link href="/verification?tab=face" className="text-primary hover:underline">Verification → Face photos</Link>.
          Photos are private and deleted 30 days after an internship ends.
        </p>
      </Section>

      <Section title="How strict" bodyClassName="p-0">
        <div role="radiogroup" aria-label="How strict the face match is" className="divide-y">
          {LEVELS.map((l) => {
            const on = nearest.value === l.value;
            return (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={save.isPending}
                onClick={() => save.mutate({ faceCheck: { threshold: l.value } })}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-muted/40"
              >
                <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", on ? "border-primary" : "border-input")}>
                  {on && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">{l.label}</span>
                  <span className="block text-xs text-muted-foreground">{l.help}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/** The time after which a check-in is labelled Late. */
function LateTime() {
  const { settings } = useSettings();
  const save = useUpdateSettings();
  const [value, setValue] = useState(settings.lateAfter);
  useEffect(() => setValue(settings.lateAfter), [settings.lateAfter]);
  const changed = value && value !== settings.lateAfter;

  return (
    <Section title="Late check-ins" bodyClassName="space-y-4 p-5">
      <p className="text-sm text-muted-foreground">
        Anyone who checks in after this time (Lagos time) is marked <strong className="font-medium text-foreground">Late</strong> on Attendance.
        It&apos;s only a label: the day still counts towards their stipend, and it isn&apos;t flagged.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => { e.preventDefault(); if (changed) save.mutate({ lateAfter: value }); }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="late-after">Late after</Label>
          <Input id="late-after" type="time" step={60} value={value} onChange={(e) => setValue(e.target.value)} className="h-9 w-[140px]" />
        </div>
        <Button type="submit" disabled={!changed || save.isPending}>Save</Button>
        <p className="pb-2 text-[13px] text-muted-foreground">
          Now: check-ins from {fmtClock(nextMinute(settings.lateAfter))} are late.
        </p>
      </form>
    </Section>
  );
}

function nextMinute(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = (h * 60 + m + 1) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
