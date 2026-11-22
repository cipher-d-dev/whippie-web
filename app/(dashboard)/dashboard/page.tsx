"use client";

import { TypeLabel } from "@/components/shared/TypeLabel";
import Link from "next/link";
import { AlertTriangle, ArrowRight, FileText, Plus, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useDashboardStats } from "@/features/dashboard/hooks";
import type { DashboardStats } from "@/features/dashboard/api";
import { useInterns } from "@/features/interns/hooks";
import { useSupervisorMe, useSupervisorInterns } from "@/features/supervisors/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useReports } from "@/features/reports/hooks";
import { useEvaluations } from "@/features/evaluations/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Section } from "@/components/shared/PageHeader";
import { PersonCell } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils/cn";
import { fmtWhen, programmeProgress } from "@/lib/utils/format";
import type { TaskObject, ReportObject } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label, value, of, sub, href, loading, tone,
}: {
  label: string;
  value: number | string;
  of?: number | string;
  sub?: React.ReactNode;
  href?: string;
  loading?: boolean;
  tone?: "danger";
}) {
  const body = (
    <div className={cn("flex h-full flex-col gap-2.5 rounded-xl border bg-card p-[18px] transition-colors", href && "hover:border-input")}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <span className={cn("font-mono text-[30px] font-medium leading-none tracking-[-0.03em] tabular", tone === "danger" && "text-danger-foreground")}>
          {value}
          {of !== undefined && <span className="text-[15px] text-muted-foreground">/{of}</span>}
        </span>
      )}
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
  return href ? <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">{body}</Link> : body;
}

// ─── Needs attention ──────────────────────────────────────────────────────────

function NeedsAttention({ stats }: { stats: DashboardStats }) {
  const items = [
    { n: stats.pending.verifications, t: "accounts to approve", s: "Confirmed their email, waiting for you", href: "/verification", icon: UserCheck, tone: "warning" as const },
    { n: stats.today.flagged, t: "flagged check-ins", s: "Low GPS accuracy today", href: "/attendance", icon: AlertTriangle, tone: "danger" as const },
  ].filter((i) => i.n > 0);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-success-soft/50 px-4 py-3 text-sm text-success-foreground">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
        Nothing waiting on you right now.
      </div>
    );
  }

  const toneClass = { warning: "bg-warning-soft text-warning-foreground", danger: "bg-danger-soft text-danger-foreground", info: "bg-info-soft text-info-foreground" };

  return (
    <Section title="Needs your attention" bodyClassName="grid sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ n, t, s, href, icon: Icon, tone }, i) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "group flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-muted/40",
            i > 0 && "border-t sm:border-t-0 sm:border-l"
          )}
        >
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              <span className="font-mono tabular">{n}</span> {t}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{s}</span>
          </span>
          <span className="text-[13px] font-medium text-primary">Review <ArrowRight className="inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      ))}
    </Section>
  );
}

// ─── Week chart (single series, direct labels) ────────────────────────────────

function WeekChart({ stats }: { stats: DashboardStats }) {
  const active = stats.interns.byStatus.ACTIVE || 1;
  return (
    <Section
      title="Check-ins this week"
      description={`Interns checked in at DAAR Lagos, out of ${stats.interns.byStatus.ACTIVE} active`}
      className="flex-[2_1_460px]"
      bodyClassName="px-5 pb-5 pt-6"
    >
      <figure>
        <div className="relative flex h-[200px] items-end gap-3 border-b px-1 sm:gap-5">
          <div className="pointer-events-none absolute inset-x-0 bottom-1/2 border-t border-dashed" aria-hidden="true" />
          {stats.week.map((d) => {
            const isToday = d.date === stats.today.date;
            const pct = d.checkedIn === null ? 0 : Math.round((d.checkedIn / active) * 100);
            return (
              <div key={d.date} className="relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={cn("font-mono text-xs tabular", isToday ? "text-foreground" : "text-muted-foreground")}>
                  {d.checkedIn ?? "—"}
                </span>
                <div
                  className={cn(
                    "w-full max-w-14 rounded-t transition-colors",
                    isToday ? "bg-primary" : "bg-primary/30 hover:bg-primary/50"
                  )}
                  style={{ height: `${pct}%` }}
                  title={`${d.weekday}: ${d.checkedIn ?? "not yet"} of ${stats.interns.byStatus.ACTIVE}`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-3 px-1 sm:gap-5">
          {stats.week.map((d) => (
            <span key={d.date} className={cn("flex-1 text-center text-xs", d.date === stats.today.date ? "font-medium text-foreground" : "text-muted-foreground")}>
              {d.weekday}
            </span>
          ))}
        </div>
        <figcaption className="sr-only">
          {stats.week.map((d) => `${d.weekday} ${d.checkedIn ?? "not yet"}`).join(", ")}
        </figcaption>
      </figure>
    </Section>
  );
}

function SubsidiaryBreakdown({ stats }: { stats: DashboardStats }) {
  const rows = stats.interns.activeBySubsidiary;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Section title="Interns by subsidiary" description={`${stats.interns.byStatus.ACTIVE} active`} className="flex-[1_1_280px]" bodyClassName="space-y-4 p-5">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No active interns yet.</p>}
      {rows.map((r) => (
        <div key={r.subsidiary} className="space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="font-medium">{r.subsidiary}</span>
            <span className="font-mono tabular text-secondary-foreground">{r.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </Section>
  );
}

// ─── Waiting for review (tasks + reports) ─────────────────────────────────────

type QueueRow = { key: string; who: { firstName?: string; lastName?: string }; item: string; kind: "Task" | "Report"; when: string; href: string };

function ReviewQueue() {
  const tasks = useTasks({ status: "SUBMITTED", limit: 5 });
  const reports = useReports({ status: "SUBMITTED", limit: 5 });
  const loading = tasks.isLoading || reports.isLoading;

  const person = (p: TaskObject["intern"]) => (typeof p === "string" ? {} : p);
  const rows: QueueRow[] = [
    ...(tasks.data?.data ?? []).map((t) => ({ key: t._id, who: person(t.intern), item: t.title, kind: "Task" as const, when: t.updatedAt, href: `/tasks/${t._id}` })),
    ...(reports.data?.data ?? []).map((r: ReportObject) => ({ key: r._id, who: person(r.intern), item: r.title, kind: "Report" as const, when: r.updatedAt, href: `/reports/${r._id}` })),
  ]
    .sort((a, b) => b.when.localeCompare(a.when))
    .slice(0, 6);

  return (
    <Section title="Waiting for review" action={<Link href="/tasks" className="text-[13px] font-medium text-primary hover:underline">All tasks</Link>}>
      {loading ? (
        <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Intern</th>
                <th className="px-5 py-2.5 font-medium">Item</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Submitted</th>
                <th className="px-5 py-2.5"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3"><PersonCell firstName={r.who.firstName} lastName={r.who.lastName} size="xs" /></td>
                  <td className="w-full max-w-0 truncate px-5 py-3 text-secondary-foreground" title={r.item}>{r.item}</td>
                  <td className="px-5 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-secondary-foreground">{r.kind}</span></td>
                  <td className="px-5 py-3 font-mono text-[13px] text-muted-foreground tabular">{fmtWhen(r.when)}</td>
                  <td className="px-5 py-3 text-right"><Link href={r.href} className="text-[13px] font-medium text-primary hover:underline">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ─── Ending soon ──────────────────────────────────────────────────────────────

function EndingSoon() {
  const { data, isLoading } = useInterns({ status: "ACTIVE", limit: 200 });
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86_400_000);
  const ending = (data?.data ?? [])
    .filter((i) => i.endDate && new Date(i.endDate) >= new Date(today.toDateString()) && new Date(i.endDate) <= in30)
    .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""))
    .slice(0, 5);
  const daysLeft = (end: string) => Math.ceil((new Date(end).getTime() - new Date(today.toDateString()).getTime()) / 86_400_000);

  return (
    <Section title="Finishing in the next 30 days" action={<Link href="/exit" className="text-[13px] font-medium text-primary hover:underline">Exit</Link>}>
      {isLoading ? (
        <div className="space-y-2 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : ending.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nobody finishes in the next 30 days.</p>
      ) : (
        <ul>
          {ending.map((i, k) => {
            const d = daysLeft(i.endDate!);
            return (
              <li key={i._id} className={cn(k > 0 && "border-t")}>
                <Link href={`/interns/${i._id}`} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40">
                  <span className="min-w-0 flex-1"><PersonCell firstName={i.firstName} lastName={i.lastName} sub={i.department?.name ?? i.institution} /></span>
                  <span className={cn("font-mono text-[13px] tabular", d <= 7 ? "font-medium text-warning-foreground" : "text-muted-foreground")}>
                    {d === 0 ? "today" : `${d} day${d === 1 ? "" : "s"}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ─── HR dashboard ─────────────────────────────────────────────────────────────

function HRDashboard({ firstName }: { firstName: string }) {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={todayLabel()}
        title={`${greeting()}, ${firstName}`}
        actions={
          <Button asChild>
            <Link href="/interns/new"><Plus /> Add intern</Link>
          </Button>
        }
      />

      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
          Couldn&apos;t load the dashboard figures.
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : isLoading || !stats ? (
        <>
          <Skeleton className="h-[74px] w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px] rounded-xl" />)}</div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </>
      ) : (
        <>
          <NeedsAttention stats={stats} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Active interns"
              value={stats.interns.byStatus.ACTIVE}
              sub={<>{stats.interns.activeByType.INTERNSHIP} <span className="lowercase"><TypeLabel type="INTERNSHIP" plural /></span> · {stats.interns.activeByType.NYSC_IT} <span className="lowercase"><TypeLabel type="NYSC_IT" plural /></span></>}
              href="/interns"
            />
            <StatTile
              label="Checked in today"
              value={stats.today.checkedIn}
              of={stats.interns.byStatus.ACTIVE}
              sub={stats.today.averageArrival ? <>Average arrival <span className="font-mono">{stats.today.averageArrival}</span></> : "No check-ins yet"}
              href="/attendance"
            />
            <StatTile
              label="Onboarding"
              value={stats.interns.byStatus.ONBOARDING}
              sub="Finishing their setup"
              href="/interns?status=ONBOARDING"
            />
            <StatTile
              label="Waiting for review"
              value={stats.pending.tasksToReview + stats.pending.reportsToReview}
              sub={`${stats.pending.tasksToReview} tasks · ${stats.pending.reportsToReview} reports`}
              href="/tasks"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <WeekChart stats={stats} />
            <SubsidiaryBreakdown stats={stats} />
          </div>
        </>
      )}

      <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <ReviewQueue />
        <EndingSoon />
      </div>
    </div>
  );
}

// ─── Supervisor dashboard ─────────────────────────────────────────────────────

function SupervisorDashboard({ firstName }: { firstName: string }) {
  const { data: meData } = useSupervisorMe();
  const me = meData?.data?.supervisor;
  const { data: internsData, isLoading } = useSupervisorInterns(me?._id ?? "");
  const interns = internsData?.data?.interns ?? [];
  const activeCount = interns.filter((i) => i.status === "ACTIVE").length;
  const submitted = useTasks({ status: "SUBMITTED", limit: 1 });
  const drafts = useEvaluations({ status: "DRAFT", limit: 1 });

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={todayLabel()}
        title={`${greeting()}, ${firstName}`}
        description={me?.department ? `${me.department.name}${me.department.subsidiary ? ` · ${me.department.subsidiary}` : ""}` : undefined}
        actions={<Button asChild><Link href="/tasks/new"><Plus /> New task</Link></Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Your interns" value={interns.length} loading={isLoading} href="/interns" />
        <StatTile label="Active" value={activeCount} loading={isLoading} />
        <StatTile label="Tasks to review" value={submitted.data?.total ?? 0} loading={submitted.isLoading} href="/tasks" />
        <StatTile label="Draft evaluations" value={drafts.data?.total ?? 0} loading={drafts.isLoading} href="/evaluations" sub="Not yet submitted" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Section title="Your interns" action={<Link href="/interns" className="text-[13px] font-medium text-primary hover:underline">View all</Link>}>
          {isLoading ? (
            <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : interns.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium">No interns assigned yet</p>
              <p className="mt-1 text-xs text-muted-foreground">HR assigns interns to you from their profile.</p>
            </div>
          ) : (
            <ul>
              {interns.map((i, k) => {
                const p = programmeProgress(i.startDate, i.endDate);
                return (
                  <li key={i._id} className={cn(k > 0 && "border-t")}>
                    <Link href={`/interns/${i._id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm transition-colors hover:bg-muted/40">
                      <span className="min-w-[200px] flex-1">
                        <PersonCell firstName={i.firstName} lastName={i.lastName} sub={<><TypeLabel type={i.internshipType} /> · {i.department?.name ?? "No department"}</>} />
                      </span>
                      {p && <span className="font-mono text-xs text-muted-foreground tabular">Wk {p.week}/{p.totalWeeks}</span>}
                      <StatusBadge status={i.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
        <ReviewQueue />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "SUPERVISOR"
    ? <SupervisorDashboard firstName={user.firstName} />
    : <HRDashboard firstName={user.firstName} />;
}
