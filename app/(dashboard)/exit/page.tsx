"use client";

import Link from "next/link";
import { DoorOpen, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useInterns } from "@/features/interns/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InternObject, InternshipStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyConfig(days: number | null): {
  label: string;
  rowClass: string;
  badgeVariant: "destructive" | "secondary" | "outline" | "default";
  icon: React.ReactNode;
} {
  if (days === null)  return { label: "No end date", rowClass: "", badgeVariant: "outline", icon: <Clock className="h-3.5 w-3.5" /> };
  if (days < 0)       return { label: "Overdue",    rowClass: "bg-rose-50/60 dark:bg-rose-950/20",   badgeVariant: "destructive", icon: <AlertTriangle className="h-3.5 w-3.5" /> };
  if (days <= 14)     return { label: `${days}d left`, rowClass: "bg-amber-50/60 dark:bg-amber-950/20", badgeVariant: "secondary",   icon: <AlertTriangle className="h-3.5 w-3.5" /> };
  if (days <= 30)     return { label: `${days}d left`, rowClass: "bg-blue-50/40 dark:bg-blue-950/10",   badgeVariant: "secondary",   icon: <Clock className="h-3.5 w-3.5" /> };
  return              { label: `${days}d left`, rowClass: "", badgeVariant: "outline", icon: <Clock className="h-3.5 w-3.5" /> };
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_VARIANT: Record<InternshipStatus, "default" | "secondary" | "outline"> = {
  SCREENED: "outline", ONBOARDING: "secondary", ACTIVE: "default", COMPLETED: "secondary",
};

// ─── Intern row ───────────────────────────────────────────────────────────────

function InternExitRow({ intern }: { intern: InternObject }) {
  const days   = daysUntil(intern.endDate);
  const config = urgencyConfig(days);

  return (
    <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-shadow hover:shadow-sm ${config.rowClass}`}>
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {intern.firstName[0]}{intern.lastName[0]}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/exit/${intern._id}`} className="text-sm font-semibold hover:underline">
            {intern.firstName} {intern.lastName}
          </Link>
          <Badge variant={STATUS_VARIANT[intern.status]} className="text-[10px]">
            {intern.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {intern.institution} · {intern.course}
          {intern.supervisor && typeof intern.supervisor !== "string" &&
            ` · ${intern.supervisor.firstName} ${intern.supervisor.lastName}`}
        </p>
      </div>

      {/* End date + urgency */}
      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <p className="text-xs text-muted-foreground">{fmt(intern.endDate)}</p>
        <Badge
          variant={config.badgeVariant}
          className="inline-flex items-center gap-1 text-[10px]"
        >
          {config.icon}
          {config.label}
        </Badge>
      </div>

      {/* Action */}
      <Button variant="ghost" size="sm" asChild className="shrink-0">
        <Link href={`/exit/${intern._id}`}>View checklist</Link>
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExitPage() {
  // Load active + onboarding interns sorted by end date proximity
  const { data: activeData, isLoading: loadingActive }       = useInterns({ status: "ACTIVE",     limit: 100 });
  const { data: onboardingData, isLoading: loadingOnboarding } = useInterns({ status: "ONBOARDING", limit: 100 });

  const isLoading = loadingActive || loadingOnboarding;

  const allInterns = [
    ...(activeData?.data ?? []),
    ...(onboardingData?.data ?? []),
  ].sort((a, b) => {
    const da = daysUntil(a.endDate) ?? 99999;
    const db = daysUntil(b.endDate) ?? 99999;
    return da - db;
  });

  const overdue    = allInterns.filter((i) => (daysUntil(i.endDate) ?? 1) < 0);
  const soonCount  = allInterns.filter((i) => { const d = daysUntil(i.endDate); return d !== null && d >= 0 && d <= 30; }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Exit & Completion</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {!isLoading && `${allInterns.length} active intern${allInterns.length !== 1 ? "s" : ""}`}
          {overdue.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
              <AlertTriangle className="h-3 w-3" />
              {overdue.length} overdue
            </span>
          )}
          {soonCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" />
              {soonCount} ending within 30 days
            </span>
          )}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Overdue</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Ending within 14 days</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" />Ending within 30 days</span>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : allInterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <DoorOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No active interns</p>
          <p className="mt-1 text-xs text-muted-foreground">Active and onboarding interns will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allInterns.map((intern) => (
            <InternExitRow key={intern._id} intern={intern} />
          ))}
        </div>
      )}

      {/* Completed section */}
      <CompletedSection />
    </div>
  );
}

function CompletedSection() {
  const { data, isLoading } = useInterns({ status: "COMPLETED", limit: 10 });
  const completed = data?.data ?? [];
  if (isLoading || completed.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">Recently completed ({data?.total})</h3>
      </div>
      <div className="space-y-2">
        {completed.map((intern) => (
          <div key={intern._id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 opacity-75">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              {intern.firstName[0]}{intern.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{intern.firstName} {intern.lastName}</p>
              <p className="text-xs text-muted-foreground">{intern.institution}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">Completed</Badge>
            <p className="text-xs text-muted-foreground shrink-0">{fmt(intern.completedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
