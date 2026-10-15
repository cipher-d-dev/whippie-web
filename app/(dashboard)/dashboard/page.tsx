"use client";

import Link from "next/link";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { InternshipStatus } from "@/types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  accent,
  loading,
  alert,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent?: string;
  loading?: boolean;
  alert?: boolean;
}) {
  const content = (
    <Card className={`group transition-all hover:shadow-md ${href ? "cursor-pointer" : ""} ${alert ? "border-destructive/40 bg-destructive/5" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ?? "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-white" : "text-primary"}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <p className={`text-3xl font-bold tracking-tight ${alert && Number(value) > 0 ? "text-destructive" : ""}`}>
            {value}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <CardDescription className="text-xs">{description}</CardDescription>
          {href && (
            <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

/**
 * Tiny inline SVG sparkline for the attendance trend.
 * Renders as a simple path over the last N data points.
 */
function Sparkline({ data, width = 120, height = 36 }: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const pad = 4;
  const step = (width - pad * 2) / Math.max(data.length - 1, 1);
  const scaleY = (v: number) => height - pad - ((v / max) * (height - pad * 2));

  const points = data.map((v, i) => ({
    x: pad + i * step,
    y: scaleY(v),
  }));

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Area fill path
  const areaD = `${d} L${points[points.length - 1]!.x.toFixed(1)},${height} L${pad},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Latest value dot */}
      <circle
        cx={points[points.length - 1]!.x}
        cy={points[points.length - 1]!.y}
        r="2.5"
        fill="hsl(var(--primary))"
      />
    </svg>
  );
}

// ─── Attendance trend card ─────────────────────────────────────────────────────

function AttendanceTrendCard() {
  // Fetch check-in counts for each of the last 7 days in parallel
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i)); // oldest → newest
    return d.toISOString().slice(0, 10);
  });

  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: ["attendance", "trend", date],
      queryFn: () => listAttendance({ date, checkType: "CHECK_IN", limit: 1 }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const counts = results.map((r) => r.data?.total ?? 0);
  const isLoading = results.some((r) => r.isLoading);
  const todayCount = counts[counts.length - 1] ?? 0;
  const prevCount  = counts[counts.length - 2] ?? 0;
  const diff       = todayCount - prevCount;

  // Short day labels Mon–Sun
  const labels = dates.map((d) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" })
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Attendance trend
          </CardTitle>
          <Link href="/attendance">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            {isLoading ? (
              <div className="h-8 w-10 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">{todayCount}</p>
            )}
            <div className="mt-0.5 flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Check-ins today</p>
              {!isLoading && diff !== 0 && (
                <span className={`text-xs font-medium ${diff > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {diff > 0 ? "+" : ""}{diff} vs yesterday
                </span>
              )}
            </div>
          </div>
          {!isLoading && (
            <div className="flex flex-col items-end gap-1">
              <Sparkline data={counts} />
              <div className="flex gap-1">
                {labels.map((label, i) => (
                  <span key={label} className={`w-[14px] text-center text-[9px] leading-none ${i === labels.length - 1 ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {label.slice(0, 1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Upcoming endings card ─────────────────────────────────────────────────────

function UpcomingEndingsCard() {
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30Str = in30Days.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch active interns; filter client-side for those ending within 30 days
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

  const daysLeft = (endDate: string) => {
    const diff = Math.ceil(
      (new Date(endDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000
    );
    return diff;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ending within 30 days
          </CardTitle>
          <Link href="/exit">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              Exit <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : ending.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <CheckSquare className="h-4 w-4 shrink-0" />
            No interns ending in the next 30 days
          </div>
        ) : (
          <div className="space-y-2">
            {ending.map((intern) => {
              const days = daysLeft(intern.endDate!);
              const urgent = days <= 7;
              return (
                <Link key={intern._id} href={`/interns/${intern._id}`}>
                  <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent ${urgent ? "border border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border bg-card"}`}>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {intern.firstName[0]}{intern.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs">{intern.firstName} {intern.lastName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{intern.institution}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgent ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                      {days}d
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── HR dashboard ─────────────────────────────────────────────────────────────

function HRDashboard({ firstName }: { firstName: string }) {
  // Stat queries — each uses limit:1 so we only need the `total` field
  const { data: allInternsData,        isLoading: loadingAll }    = useInterns({ limit: 1 });
  const { data: activeInternsData,     isLoading: loadingActive } = useInterns({ status: "ACTIVE",     limit: 1 });
  const { data: onboardingInternsData, isLoading: loadingOnb }    = useInterns({ status: "ONBOARDING", limit: 5 });
  const { data: pendingEvalsData,      isLoading: loadingEvals }  = useEvaluations({ status: "DRAFT", limit: 1 });
  const { data: submittedTasksData,    isLoading: loadingTasks }  = useTasks({ status: "SUBMITTED", limit: 1 });

  const todayISO = new Date().toISOString().slice(0, 10);
  const { data: todayAttendance, isLoading: loadingAtt } = useAttendance({ date: todayISO, checkType: "CHECK_IN", limit: 1 });

  // Derived values
  const totalInterns    = allInternsData?.total ?? 0;
  const activeInterns   = activeInternsData?.total ?? 0;
  const onboardingCount = onboardingInternsData?.total ?? 0;
  const onboardingList  = onboardingInternsData?.data ?? [];
  const pendingEvals    = pendingEvalsData?.total ?? 0;
  const needsReview     = submittedTasksData?.total ?? 0;
  const todayCheckIns   = todayAttendance?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {firstName} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s the intern programme overview for DAAR Communications.
        </p>
      </div>

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total interns"
          value={totalInterns}
          description="All records"
          icon={Users}
          href="/interns"
          accent="bg-primary"
          loading={loadingAll}
        />
        <StatCard
          label="Active"
          value={activeInterns}
          description="Currently placed"
          icon={CheckSquare}
          href="/interns"
          accent="bg-emerald-500"
          loading={loadingActive}
        />
        <StatCard
          label="Onboarding"
          value={onboardingCount}
          description="Awaiting completion"
          icon={ClipboardCheck}
          href="/onboarding"
          accent="bg-amber-500"
          loading={loadingOnb}
        />
        <StatCard
          label="Attendance today"
          value={todayCheckIns}
          description="Check-ins recorded"
          icon={CalendarDays}
          href="/attendance"
          accent="bg-blue-500"
          loading={loadingAtt}
        />
      </div>

      {/* Action-needed stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Tasks to review"
          value={needsReview}
          description="Submitted, awaiting feedback"
          icon={Clock}
          href="/tasks"
          accent={needsReview > 0 ? "bg-orange-500" : "bg-muted-foreground"}
          loading={loadingTasks}
          alert={needsReview > 5}
        />
        <StatCard
          label="Pending evaluations"
          value={pendingEvals}
          description="Drafts not yet submitted"
          icon={Star}
          href="/evaluations"
          accent={pendingEvals > 0 ? "bg-violet-500" : "bg-muted-foreground"}
          loading={loadingEvals}
          alert={pendingEvals > 3}
        />
        <StatCard
          label="Interns onboarding"
          value={onboardingCount}
          description="Documents & setup pending"
          icon={AlertTriangle}
          href="/onboarding"
          accent={onboardingCount > 0 ? "bg-amber-400" : "bg-muted-foreground"}
          loading={loadingOnb}
        />
      </div>

      {/* Charts + upcoming endings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceTrendCard />
        <UpcomingEndingsCard />
      </div>

      {/* Onboarding in progress */}
      {onboardingList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Currently onboarding</h3>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/onboarding">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {onboardingList.map((intern) => (
              <Link key={intern._id} href={`/interns/${intern._id}`}>
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {intern.firstName[0]}{intern.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
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
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Quick actions</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Add intern",       href: "/interns/new",    icon: Users },
            { label: "Review documents", href: "/documents",      icon: ClipboardCheck },
            { label: "Departments",      href: "/departments",    icon: BookOpen },
            { label: "Exit management",  href: "/exit",           icon: Timer },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </Link>
          ))}
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
  const pendingTasks = submittedTasksData?.total ?? "—";

  const { data: draftEvalsData } = useEvaluations({ status: "DRAFT", limit: 1 });
  const draftEvals = draftEvalsData?.total ?? "—";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {firstName} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your supervision workspace at DAAR Communications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned interns"
          value={interns.length}
          description="Under your supervision"
          icon={Users}
          accent="bg-primary"
        />
        <StatCard
          label="Active"
          value={activeCount}
          description="Currently placed"
          icon={CheckSquare}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Tasks to review"
          value={pendingTasks}
          description="Submitted submissions"
          icon={Clock}
          href="/tasks"
          accent="bg-amber-500"
          alert={Number(pendingTasks) > 5}
        />
        <StatCard
          label="Draft evaluations"
          value={draftEvals}
          description="Not yet submitted"
          icon={Star}
          href="/evaluations"
          accent="bg-violet-500"
        />
      </div>

      {/* Intern list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your interns</h3>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/interns">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {interns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <Users className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No interns assigned yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contact HR to get interns assigned to your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {interns.map((intern) => (
              <Link key={intern._id} href={`/interns/${intern._id}`}>
                <div className="group flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-sm hover:border-primary/30">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {intern.firstName[0]}{intern.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {intern.firstName} {intern.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {intern.institution} · {intern.course}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={STATUS_VARIANT[intern.status]} className="text-xs">
                      {intern.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Department info */}
      {meData?.data?.supervisor?.department && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
          <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Department: </span>
            <span className="font-medium">{meData.data.supervisor.department.name}</span>
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

// ─── Root dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return user.role === "SUPERVISOR"
    ? <SupervisorDashboard firstName={user.firstName} />
    : <HRDashboard         firstName={user.firstName} />;
}
