"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  CheckSquare,
  ArrowRight,
  Clock,
  BookOpen,
  AlertTriangle,
  Star,
  Timer,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/context";
import { useInterns } from "@/features/interns/hooks";
import { useSupervisorMe, useSupervisorInterns } from "@/features/supervisors/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useAttendance } from "@/features/attendance/hooks";
import { useEvaluations } from "@/features/evaluations/hooks";
import { listAttendance } from "@/features/attendance/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import type { InternshipStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<InternshipStatus, "default" | "secondary" | "outline"> = {
  SCREENED:   "outline",
  ONBOARDING: "secondary",
  ACTIVE:     "default",
  COMPLETED:  "secondary",
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Count-up number ──────────────────────────────────────────────────────────

function CountUp({ value, loading }: { value: number; loading?: boolean }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (loading || value === 0) { setDisplay(value); return; }
    const from = prevRef.current;
    const to   = value;
    const duration = 600;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    requestAnimationFrame(tick);
  }, [value, loading]);

  if (loading) {
    return <div className="h-9 w-12 animate-pulse rounded-lg bg-current opacity-10" />;
  }
  return <span>{display}</span>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  iconBg: string;        // Tailwind bg class for icon container
  cardBg?: string;       // optional tinted card bg
  loading?: boolean;
  alert?: boolean;
  delay?: number;
}

function StatCard({
  label, value, description, icon: Icon,
  href, iconBg, cardBg, loading, alert, delay = 0,
}: StatCardProps) {
  const isNum = typeof value === "number";

  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 p-5",
        "hover-lift cursor-pointer",
        cardBg ?? "bg-card",
        alert && Number(value) > 0 && "border-destructive/30 bg-destructive/5"
      )}
    >
      {/* Background decoration blob — animates on hover via group */}
      <div className={cn(
        "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15 blur-2xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-110",
        iconBg
      )} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn(
            "mt-2 text-3xl font-black tracking-tight",
            alert && Number(value) > 0 ? "text-destructive" : "text-foreground"
          )}>
            {isNum ? <CountUp value={value as number} loading={loading} /> : value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        {/* Icon with pop animation and glow blob */}
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md animate-icon-pop",
          iconBg
        )}
          style={{ animationDelay: `${delay + 100}ms` }}
        >
          <Icon className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      {href && (
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors duration-200 group-hover:text-primary">
          <span>View details</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
    </div>
  );

  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {href ? <Link href={href}>{inner}</Link> : inner}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 36;
  const pad = 4;

  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const step = (width - pad * 2) / Math.max(data.length - 1, 1);
  const scaleY = (v: number) => height - pad - ((v / max) * (height - pad * 2));

  const points = data.map((v, i) => ({ x: pad + i * step, y: scaleY(v) }));
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${d} L${points[points.length - 1]!.x.toFixed(1)},${height} L${pad},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path
        d={d}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: 0,
          animation: "draw-line 1s ease-out forwards",
        }}
      />
      <circle
        cx={points[points.length - 1]!.x}
        cy={points[points.length - 1]!.y}
        r="3"
        fill="hsl(var(--primary))"
        className="animate-scale-in"
      />
    </svg>
  );
}

// ─── Attendance trend card ─────────────────────────────────────────────────────

function AttendanceTrendCard() {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: ["attendance", "trend", date],
      queryFn: () => listAttendance({ date, checkType: "CHECK_IN", limit: 1 }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const counts    = results.map((r) => r.data?.total ?? 0);
  const isLoading = results.some((r) => r.isLoading);
  const todayCount = counts[counts.length - 1] ?? 0;
  const prevCount  = counts[counts.length - 2] ?? 0;
  const diff       = todayCount - prevCount;

  const labels = dates.map((d) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" })
  );

  return (
    <div className="animate-fade-up delay-300 rounded-2xl border border-border/60 bg-card p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Attendance trend
        </p>
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-xs cursor-pointer">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold tracking-tight">
            {isLoading ? (
              <span className="inline-block h-9 w-10 animate-pulse rounded-lg bg-muted" />
            ) : (
              <CountUp value={todayCount} />
            )}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Check-ins today</p>
            {!isLoading && diff !== 0 && (
              <span className={cn(
                "text-xs font-semibold",
                diff > 0 ? "text-emerald-600" : "text-amber-600"
              )}>
                {diff > 0 ? "+" : ""}{diff}
              </span>
            )}
          </div>
        </div>
        {!isLoading && (
          <div className="flex flex-col items-end gap-1">
            <Sparkline data={counts} />
            <div className="flex gap-2">
              {labels.map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    "w-3.5 text-center text-[9px] leading-none",
                    i === labels.length - 1
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {label.slice(0, 1)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming endings card ─────────────────────────────────────────────────────

function UpcomingEndingsCard() {
  const todayStr  = new Date().toISOString().slice(0, 10);
  const in30Days  = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30Str   = in30Days.toISOString().slice(0, 10);

  const { data, isLoading } = useInterns({ status: "ACTIVE", limit: 200 });
  const interns = data?.data ?? [];

  const ending = interns
    .filter((i) => {
      if (!i.endDate) return false;
      const end = i.endDate.slice(0, 10);
      return end >= todayStr && end <= in30Str;
    })
    .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""))
    .slice(0, 5);

  const daysLeft = (endDate: string) =>
    Math.ceil((new Date(endDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);

  return (
    <div className="animate-fade-up delay-350 rounded-2xl border border-border/60 bg-card p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ending within 30 days
        </p>
        <Link href="/exit">
          <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-xs cursor-pointer">
            Exit <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-10 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : ending.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <CheckSquare className="h-4 w-4 shrink-0 text-emerald-500" />
          No interns ending in the next 30 days
        </div>
      ) : (
        <div className="space-y-2">
          {ending.map((intern, i) => {
            const days   = daysLeft(intern.endDate!);
            const urgent = days <= 7;
            return (
              <Link key={intern._id} href={`/interns/${intern._id}`}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer animate-fade-up hover:-translate-y-0.5 hover:shadow-sm",
                    urgent
                      ? "border border-amber-200 bg-amber-50 dark:bg-amber-950/20"
                      : "border border-border/60 bg-muted/30 hover:bg-accent"
                  )}
                  style={{ animationDelay: `${400 + i * 50}ms` }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {intern.firstName[0]}{intern.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {intern.firstName} {intern.lastName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{intern.institution}</p>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    urgent
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {days}d
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickAction({
  label, href, icon: Icon, iconBg, delay = 0,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 cursor-pointer hover-lift animate-fade-up"
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm animate-icon-pop transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
          iconBg
        )}
          style={{ animationDelay: `${delay + 80}ms` }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="flex-1 text-sm font-semibold">{label}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}

// ─── HR dashboard ─────────────────────────────────────────────────────────────

function HRDashboard({ firstName }: { firstName: string }) {
  const { data: allInternsData,        isLoading: loadingAll }    = useInterns({ limit: 1 });
  const { data: activeInternsData,     isLoading: loadingActive } = useInterns({ status: "ACTIVE",     limit: 1 });
  const { data: onboardingInternsData, isLoading: loadingOnb }    = useInterns({ status: "ONBOARDING", limit: 5 });
  const { data: pendingEvalsData,      isLoading: loadingEvals }  = useEvaluations({ status: "DRAFT", limit: 1 });
  const { data: submittedTasksData,    isLoading: loadingTasks }  = useTasks({ status: "SUBMITTED", limit: 1 });

  const todayISO = new Date().toISOString().slice(0, 10);
  const { data: todayAttendance, isLoading: loadingAtt } = useAttendance({
    date: todayISO, checkType: "CHECK_IN", limit: 1,
  });

  const totalInterns    = allInternsData?.total ?? 0;
  const activeInterns   = activeInternsData?.total ?? 0;
  const onboardingCount = onboardingInternsData?.total ?? 0;
  const onboardingList  = onboardingInternsData?.data ?? [];
  const pendingEvals    = pendingEvalsData?.total ?? 0;
  const needsReview     = submittedTasksData?.total ?? 0;
  const todayCheckIns   = todayAttendance?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-violet-400 p-6 text-primary-foreground">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 right-12 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <p className="text-sm font-medium opacity-80">Good {getTimeOfDay()}</p>
          <h2 className="mt-0.5 text-2xl font-bold">{firstName} 👋</h2>
          <p className="mt-1 text-sm opacity-70">
            DAAR Communications intern programme overview
          </p>
        </div>
      </div>

      {/* Primary stats */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-fade-up delay-50">
          Overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total interns"
            value={totalInterns}
            description="All records"
            icon={Users}
            href="/interns"
            iconBg="bg-violet-500"
            cardBg="bg-card-violet"
            loading={loadingAll}
            delay={100}
          />
          <StatCard
            label="Active"
            value={activeInterns}
            description="Currently placed"
            icon={CheckSquare}
            href="/interns"
            iconBg="bg-emerald-500"
            cardBg="bg-card-emerald"
            loading={loadingActive}
            delay={150}
          />
          <StatCard
            label="Onboarding"
            value={onboardingCount}
            description="Awaiting completion"
            icon={ClipboardCheck}
            href="/onboarding"
            iconBg="bg-amber-500"
            cardBg="bg-card-amber"
            loading={loadingOnb}
            delay={200}
          />
          <StatCard
            label="Check-ins today"
            value={todayCheckIns}
            description="Attendance recorded"
            icon={CalendarDays}
            href="/attendance"
            iconBg="bg-blue-500"
            cardBg="bg-card-blue"
            loading={loadingAtt}
            delay={250}
          />
        </div>
      </div>

      {/* Action needed */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-fade-up delay-200">
          Needs attention
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Tasks to review"
            value={needsReview}
            description="Submitted submissions"
            icon={Clock}
            href="/tasks"
            iconBg={needsReview > 0 ? "bg-orange-500" : "bg-muted-foreground"}
            loading={loadingTasks}
            alert={needsReview > 5}
            delay={300}
          />
          <StatCard
            label="Pending evaluations"
            value={pendingEvals}
            description="Drafts not submitted"
            icon={Star}
            href="/evaluations"
            iconBg={pendingEvals > 0 ? "bg-violet-500" : "bg-muted-foreground"}
            loading={loadingEvals}
            alert={pendingEvals > 3}
            delay={350}
          />
          <StatCard
            label="Onboarding"
            value={onboardingCount}
            description="Setup pending"
            icon={AlertTriangle}
            href="/onboarding"
            iconBg={onboardingCount > 0 ? "bg-amber-400" : "bg-muted-foreground"}
            loading={loadingOnb}
            delay={400}
          />
        </div>
      </div>

      {/* Trend + Upcoming */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceTrendCard />
        <UpcomingEndingsCard />
      </div>

      {/* Currently onboarding */}
      {onboardingList.length > 0 && (
        <div className="animate-fade-up delay-400 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Currently onboarding</h3>
            <Button variant="ghost" size="sm" asChild className="text-xs cursor-pointer">
              <Link href="/onboarding">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {onboardingList.map((intern, i) => (
              <Link key={intern._id} href={`/interns/${intern._id}`}>
                <div
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer animate-fade-up"
                  style={{ animationDelay: `${450 + i * 50}ms` }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {intern.firstName[0]}{intern.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {intern.firstName} {intern.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{intern.institution}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                    Onboarding
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="animate-fade-up delay-400 space-y-3">
        <h3 className="text-sm font-semibold">Quick actions</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction label="Add intern"       href="/interns/new"  icon={Users}        iconBg="bg-violet-500" delay={500} />
          <QuickAction label="Review documents" href="/documents"    icon={ClipboardCheck} iconBg="bg-blue-500"   delay={540} />
          <QuickAction label="Departments"      href="/departments"  icon={BookOpen}     iconBg="bg-emerald-500" delay={580} />
          <QuickAction label="Exit management"  href="/exit"         icon={Timer}        iconBg="bg-amber-500"  delay={620} />
        </div>
      </div>
    </div>
  );
}

// ─── Supervisor dashboard ─────────────────────────────────────────────────────

function SupervisorDashboard({ firstName }: { firstName: string }) {
  const { data: meData }      = useSupervisorMe();
  const supervisorId          = meData?.data?.supervisor?._id ?? "";
  const { data: internsData } = useSupervisorInterns(supervisorId);

  const interns     = internsData?.data?.interns ?? [];
  const activeCount = interns.filter((i) => i.status === "ACTIVE").length;

  const { data: submittedTasksData } = useTasks({ status: "SUBMITTED", limit: 1 });
  const pendingTasks = submittedTasksData?.total ?? 0;

  const { data: draftEvalsData } = useEvaluations({ status: "DRAFT", limit: 1 });
  const draftEvals = draftEvalsData?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-violet-400 p-6 text-primary-foreground">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium opacity-80">Good {getTimeOfDay()}</p>
          <h2 className="mt-0.5 text-2xl font-bold">{firstName} 👋</h2>
          <p className="mt-1 text-sm opacity-70">Your supervision workspace at DAAR Communications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned interns"
          value={interns.length}
          description="Under your supervision"
          icon={Users}
          iconBg="bg-violet-500"
          cardBg="bg-card-violet"
          delay={100}
        />
        <StatCard
          label="Active"
          value={activeCount}
          description="Currently placed"
          icon={CheckSquare}
          iconBg="bg-emerald-500"
          cardBg="bg-card-emerald"
          delay={150}
        />
        <StatCard
          label="Tasks to review"
          value={pendingTasks}
          description="Submitted submissions"
          icon={Clock}
          href="/tasks"
          iconBg="bg-amber-500"
          cardBg="bg-card-amber"
          alert={pendingTasks > 5}
          delay={200}
        />
        <StatCard
          label="Draft evaluations"
          value={draftEvals}
          description="Not yet submitted"
          icon={Star}
          href="/evaluations"
          iconBg="bg-violet-500"
          cardBg="bg-card-violet"
          delay={250}
        />
      </div>

      {/* Intern list */}
      <div className="animate-fade-up delay-300 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your interns</h3>
          <Button variant="ghost" size="sm" asChild className="text-xs cursor-pointer">
            <Link href="/interns">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {interns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Users className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold">No interns assigned yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contact HR to get interns assigned to your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {interns.map((intern, i) => (
              <Link key={intern._id} href={`/interns/${intern._id}`}>
                <div
                  className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card px-4 py-3.5 cursor-pointer hover-lift animate-fade-up"
                  style={{ animationDelay: `${350 + i * 40}ms` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {intern.firstName[0]}{intern.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {intern.firstName} {intern.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {intern.institution} · {intern.course}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={STATUS_VARIANT[intern.status]} className="text-xs">
                      {intern.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {meData?.data?.supervisor?.department && (
        <div className="animate-fade-up delay-400 flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Department: </span>
            <span className="font-semibold">{meData.data.supervisor.department.name}</span>
            {meData.data.supervisor.department.subsidiary && (
              <span className="ml-1 text-muted-foreground">
                · {meData.data.supervisor.department.subsidiary}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return user.role === "SUPERVISOR"
    ? <SupervisorDashboard firstName={user.firstName} />
    : <HRDashboard         firstName={user.firstName} />;
}
