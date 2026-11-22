"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Info } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useStipendReport } from "@/features/stipends/hooks";
import type { StipendRow } from "@/features/stipends/api";
import { useTypeLabel } from "@/features/settings/hooks";
import { PageHeader, Section } from "@/components/shared/PageHeader";
import { PersonCell } from "@/components/shared/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/** "2026-11" for the month containing today, in Lagos time. */
function thisMonth() {
  const lagos = new Date(Date.now() + 60 * 60_000);
  return lagos.toISOString().slice(0, 7);
}
function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, "0")}` };
}
const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function StipendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const typeLabel = useTypeLabel();

  const [mode, setMode] = useState<"month" | "range">("month");
  const [month, setMonth] = useState(thisMonth);
  const [range, setRange] = useState(() => monthRange(thisMonth()));
  const period = mode === "month" ? monthRange(month) : range;

  const { data: report, isLoading, isError, refetch } = useStipendReport(period.from, period.to);

  // HR/finance can change what they actually pay; kept per period until they leave the page.
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useEffect(() => setOverrides({}), [period.from, period.to]);

  useEffect(() => {
    if (user && user.role !== "HR") router.replace("/dashboard");
  }, [user, router]);

  const rows = report?.rows ?? [];
  const payOf = (r: StipendRow) => {
    const o = overrides[r.internId];
    return o !== undefined && o !== "" ? Number(o) : r.suggestedAmount;
  };
  const totals = useMemo(() => ({
    suggested: rows.reduce((s, r) => s + r.suggestedAmount, 0),
    pay: rows.reduce((s, r) => s + payOf(r), 0),
    flagged: rows.reduce((s, r) => s + r.flaggedDays, 0),
  }), [rows, overrides]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    const head = ["Name", "Type", "Department", "Supervisor", "On programme from", "To", "Days worked", "Days expected", "Flagged days (not counted)", "Full stipend", "Suggested", "To pay"];
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [`${r.firstName} ${r.lastName}`, typeLabel(r.internshipType), r.department, r.supervisor, r.activeFrom, r.activeTo,
        r.daysWorked, r.expectedDays, r.flaggedDays, r.fullAmount, r.suggestedAmount, payOf(r)].map(esc).join(","));
    const csv = [head.map(esc).join(","), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `stipends-${period.from}-to-${period.to}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user && user.role !== "HR") return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stipends"
        description="Days each person worked and a suggested amount. Check it, change any amount, then download it for payment."
        actions={<Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download /> Download spreadsheet</Button>}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div role="radiogroup" aria-label="Period" className="flex rounded-lg border bg-card p-0.5">
          {(["month", "range"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn("h-8 rounded-md px-3 text-sm font-medium", mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {m === "month" ? "Month" : "Date range"}
            </button>
          ))}
        </div>
        {mode === "month" ? (
          <div className="space-y-1">
            <Label htmlFor="month" className="sr-only">Month</Label>
            <Input id="month" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="h-9 w-[180px]" />
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} className="h-9 w-[160px]" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} className="h-9 w-[160px]" />
            </div>
          </div>
        )}
        <p className="pb-2 text-[13px] text-muted-foreground">{fmtDay(period.from)} – {fmtDay(period.to)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="People" value={isLoading ? "–" : String(rows.length)} />
        <Tile label="Suggested total" value={isLoading ? "–" : naira(totals.suggested)} />
        <Tile label="To pay (after your changes)" value={isLoading ? "–" : naira(totals.pay)} />
      </div>

      {totals.flagged > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] text-warning-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {totals.flagged} flagged day{totals.flagged === 1 ? " isn't" : "s aren't"} counted yet. Flagged means the intern was inside the office zone with a weak GPS signal.
            Review them on <Link href="/attendance" className="font-medium underline">Attendance</Link>; accepted days count here straight away.
          </span>
        </p>
      )}

      <Section bodyClassName="p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="font-medium">Couldn&apos;t load the report</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nobody was on the programme in this period.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 text-right font-medium">Days worked</th>
                  <th className="px-4 py-2.5 text-right font-medium">Flagged</th>
                  <th className="px-4 py-2.5 text-right font-medium">Suggested</th>
                  <th className="px-4 py-2.5 text-right font-medium">To pay (₦)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const partial = r.activeFrom !== period.from || r.activeTo !== period.to;
                  return (
                    <tr key={r.internId} className="border-t">
                      <td className="px-4 py-3">
                        <Link href={`/interns/${r.internId}`} className="block">
                          <PersonCell firstName={r.firstName} lastName={r.lastName} sub={`${typeLabel(r.internshipType)} · ${naira(r.fullAmount)}/month`} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-secondary-foreground">
                        {r.department ?? "—"}
                        {partial && <span className="block text-xs text-muted-foreground">On programme {fmtDay(r.activeFrom)} – {fmtDay(r.activeTo)}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular">
                        <span className={cn(r.daysWorked < r.expectedDays && "text-warning-foreground")}>{r.daysWorked}</span>
                        <span className="text-muted-foreground"> / {r.expectedDays}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular text-muted-foreground">{r.flaggedDays || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono tabular">{naira(r.suggestedAmount)}</td>
                      <td className="px-4 py-2 text-right">
                        <Label htmlFor={`pay-${r.internId}`} className="sr-only">Amount to pay {r.firstName} {r.lastName}</Label>
                        <Input
                          id={`pay-${r.internId}`}
                          inputMode="numeric"
                          value={overrides[r.internId] ?? String(r.suggestedAmount)}
                          onChange={(e) => setOverrides({ ...overrides, [r.internId]: e.target.value.replace(/[^\d]/g, "") })}
                          className={cn("ml-auto h-8 w-[120px] text-right font-mono", overrides[r.internId] !== undefined && Number(overrides[r.internId]) !== r.suggestedAmount && "border-primary")}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="text-xs text-muted-foreground">
        Days worked are days with an accepted or corrected check-in. Expected days and full amounts are set on{" "}
        <Link href="/configuration?tab=stipends" className="text-primary hover:underline">Configuration</Link>{" "}
        ({report ? `${typeLabel("NYSC_IT")}: ${report.rules.NYSC_IT.days} days, ${naira(report.rules.NYSC_IT.amount)}; ${typeLabel("INTERNSHIP")}: ${report.rules.INTERNSHIP.days} days, ${naira(report.rules.INTERNSHIP.amount)}` : "…"}).
        Suggested = full stipend × days worked ÷ days expected, never more than the full stipend. Changes to &ldquo;To pay&rdquo; aren&apos;t saved; they go into the spreadsheet you download.
      </p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium tabular">{value}</p>
    </div>
  );
}
