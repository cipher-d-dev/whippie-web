"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pluralLabel, useSettings, useUpdateSettings, useTypeLabel } from "@/features/settings/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils/cn";

type Rules = { INTERNSHIP: { days: string; amount: string }; NYSC_IT: { days: string; amount: string } };

/** Monthly working days and stipend per type. Used to suggest amounts on the Stipends page. */
export function StipendManager() {
  const { settings, isLoading } = useSettings();
  const typeLabel = useTypeLabel();
  const save = useUpdateSettings();
  const toForm = (): Rules => ({
    INTERNSHIP: { days: String(settings.stipend.INTERNSHIP.days), amount: String(settings.stipend.INTERNSHIP.amount) },
    NYSC_IT: { days: String(settings.stipend.NYSC_IT.days), amount: String(settings.stipend.NYSC_IT.amount) },
  });
  const [form, setForm] = useState<Rules>(toForm);
  useEffect(() => setForm(toForm()), [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = (["INTERNSHIP", "NYSC_IT"] as const).every((t) => {
    const d = Number(form[t].days), a = Number(form[t].amount);
    return Number.isInteger(d) && d >= 1 && d <= 31 && Number.isInteger(a) && a >= 0;
  });
  const set = (t: keyof Rules, k: "days" | "amount", v: string) => setForm({ ...form, [t]: { ...form[t], [k]: v.replace(/[^\d]/g, "") } });

  const payroll = settings.allowance;

  return (
    <div className="space-y-6">
    <Section
      title="Who is on payroll"
      description="The default for each type. Change it for one person on their profile (Allowance)."
      bodyClassName="divide-y p-0"
    >
      {(["NYSC_IT", "INTERNSHIP"] as const).map((t) => (
        <div key={t} className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div>
            <p className="text-sm font-medium">{pluralLabel(typeLabel(t))}</p>
            <p className="text-xs text-muted-foreground">{t === "INTERNSHIP" ? "Students on SIWES / IT are not on payroll unless you change it." : "Corps members are paid the monthly allowance."}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={payroll[t]}
            aria-label={`${pluralLabel(typeLabel(t))} on payroll by default`}
            disabled={isLoading || save.isPending}
            onClick={() => save.mutate({ allowance: { [t]: !payroll[t] } })}
            className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", payroll[t] ? "bg-primary" : "bg-input")}
          >
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all", payroll[t] ? "left-6" : "left-1")} />
          </button>
        </div>
      ))}
    </Section>

    <Section
      title="Stipends"
      description={<>Expected working days in a month and the full monthly stipend. The <Link href="/stipends" className="text-primary hover:underline">Stipends</Link> page uses these to suggest what each person is owed.</>}
      bodyClassName="p-5"
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            stipend: {
              INTERNSHIP: { days: Number(form.INTERNSHIP.days), amount: Number(form.INTERNSHIP.amount) },
              NYSC_IT: { days: Number(form.NYSC_IT.days), amount: Number(form.NYSC_IT.amount) },
            },
          });
        }}
      >
        {(["NYSC_IT", "INTERNSHIP"] as const).map((t) => (
          <fieldset key={t} className="grid gap-3 sm:grid-cols-[1fr_140px_180px] sm:items-end">
            <legend className="mb-2 text-sm font-medium sm:col-span-3">{pluralLabel(typeLabel(t))}</legend>
            <p className="text-[13px] text-muted-foreground sm:pb-2.5">
              {t === "NYSC_IT" ? "4 days a week" : "5 days a week"}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor={`days-${t}`}>Days a month</Label>
              <Input id={`days-${t}`} inputMode="numeric" value={form[t].days} onChange={(e) => set(t, "days", e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`amount-${t}`}>Full stipend (₦)</Label>
              <Input id={`amount-${t}`} inputMode="numeric" value={form[t].amount} onChange={(e) => set(t, "amount", e.target.value)} disabled={isLoading} />
            </div>
          </fieldset>
        ))}
        <p className="text-xs text-muted-foreground">
          For part of a month, expected days are worked out from the weekdays in that period (a full month counts as 20 weekdays).
        </p>
        <Button type="submit" disabled={!valid || save.isPending}>{save.isPending ? "Saving…" : "Save stipends"}</Button>
      </form>
    </Section>
    </div>
  );
}
