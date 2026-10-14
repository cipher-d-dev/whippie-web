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
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useInterns } from "@/features/interns/hooks";
import { useSupervisorMe, useSupervisorInterns } from "@/features/supervisors/hooks";
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

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent?: string;
}) {
  const content = (
    <Card className={`group transition-shadow hover:shadow-md ${href ? "cursor-pointer" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ?? "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-white" : "text-primary"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
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

// ─── HR dashboard ─────────────────────────────────────────────────────────────

function HRDashboard({ firstName }: { firstName: string }) {
  const { data: allInterns }        = useInterns({ limit: 200 });
  const { data: activeInterns }     = useInterns({ status: "ACTIVE",     limit: 1 });
  const { data: onboardingInterns } = useInterns({ status: "ONBOARDING", limit: 5 });

  const total      = allInterns?.total ?? 0;
  const active     = activeInterns?.total ?? 0;
  const onboarding = onboardingInterns?.total ?? 0;
  const recent     = onboardingInterns?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {firstName} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of the intern programme at DAAR Communications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total interns"
          value={total}
          description="All records"
          icon={Users}
          href="/interns"
          accent="bg-primary"
        />
        <StatCard
          label="Active"
          value={active}
          description="Currently placed"
          icon={CheckSquare}
          href="/interns"
          accent="bg-emerald-500"
        />
        <StatCard
          label="Onboarding"
          value={onboarding}
          description="Awaiting completion"
          icon={ClipboardCheck}
          href="/onboarding"
          accent="bg-amber-500"
        />
        <StatCard
          label="Attendance"
          value="—"
          description="Available in Phase 8"
          icon={CalendarDays}
          accent="bg-slate-400"
        />
      </div>

      {/* Onboarding in progress */}
      {recent.length > 0 && (
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
            {recent.map((intern) => (
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

      {/* Quick links */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Quick actions</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { label: "Add intern",       href: "/interns/new",  icon: Users },
            { label: "Review documents", href: "/documents",    icon: ClipboardCheck },
            { label: "Departments",      href: "/departments",  icon: BookOpen },
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

  const interns       = internsData?.data?.interns ?? [];
  const activeCount   = interns.filter((i) => i.status === "ACTIVE").length;
  const pendingTasks  = "—"; // wired in Phase 6

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
      <div className="grid gap-4 sm:grid-cols-3">
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
          label="Pending tasks"
          value={pendingTasks}
          description="Available in Phase 6"
          icon={Clock}
          accent="bg-slate-400"
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

// ─── Time of day helper ───────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Root dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return user.role === "SUPERVISOR"
    ? <SupervisorDashboard firstName={user.firstName} />
    : <HRDashboard         firstName={user.firstName} />;
}
