"use client";

import { AllowancePanel } from "@/features/interns/AllowancePanel";
import { InternFacePanel } from "@/features/face/InternFacePanel";
import { TypeLabel } from "@/components/shared/TypeLabel";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  Minus,
  Pencil,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { EditInternSheet } from "@/features/interns/components/EditInternSheet";
import { useIntern } from "@/features/interns/hooks";
import {
  useAssignDepartment,
  useRemoveDepartment,
  useAssignSupervisor,
  useRemoveSupervisor,
} from "@/features/supervisors/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { useSupervisors } from "@/features/supervisors/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useAttendance } from "@/features/attendance/hooks";
import { useReports } from "@/features/reports/hooks";
import { useEvaluations } from "@/features/evaluations/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { StatusBadge, statusLabel } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils/cn";
import { fmtDate, fmtShortDate, fmtTime, fmtMeters, programmeProgress, flagReasonText } from "@/lib/utils/format";
import type { AttendanceObject } from "@/types";

type Tab = "overview" | "tasks" | "attendance" | "reports";

// ─── Attendance grid: last 6 weeks of weekdays ────────────────────────────────

type DayState = "ontime" | "late" | "issue" | "missed" | "upcoming" | "before";

function buildAttendanceGrid(records: AttendanceObject[], startDate?: string) {
  const byDay = new Map<string, AttendanceObject>();
  for (const r of records) if (r.checkType === "CHECK_IN") byDay.set(r.date.slice(0, 10), r);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Monday of the week five weeks ago
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 35);
  const start = startDate ? new Date(startDate) : null;

  const weeks: { key: string; state: DayState; label: string }[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: { key: string; state: DayState; label: string }[] = [];
    for (let d = 0; d < 5; d++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + w * 7 + d);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      const rec = byDay.get(key);
      let state: DayState;
      if (day > today) state = "upcoming";
      else if (start && day < new Date(start.toDateString())) state = "before";
      else if (!rec) state = "missed";
      else if (rec.status !== "ACCEPTED") state = "issue";
      else state = new Date(rec.submittedAt).getHours() < 9 ? "ontime" : "late";
      const label = `${day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}: ${
        { ontime: `in at ${fmtTime(rec?.submittedAt)}`, late: `in at ${fmtTime(rec?.submittedAt)}`, issue: statusLabel(rec?.status), missed: "no check-in", upcoming: "upcoming", before: "before start" }[state]
      }`;
      week.push({ key, state, label });
    }
    weeks.push(week);
  }
  return weeks;
}

const DAY_STYLE: Record<DayState, string> = {
  ontime: "bg-primary",
  late: "bg-primary/40",
  issue: "bg-danger",
  missed: "bg-muted-foreground/25",
  upcoming: "border border-input bg-background",
  before: "bg-muted",
};

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Detail({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t py-3 text-[13px] first:border-t-0">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{v || "—"}</dd>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InternDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const isHR = user?.role === "HR";
  const { data, isLoading, isError } = useIntern(id);
  const intern = data?.data?.intern;

  const [tab, setTab] = useState<Tab>("overview");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [supervisorDialogOpen, setSvDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSv, setSelectedSv] = useState("");

  const { data: deptData } = useDepartments({ limit: 100 });
  const { data: svData } = useSupervisors({ limit: 100 });
  const departments = deptData?.data ?? [];
  const supervisors = svData?.data ?? [];

  const { data: tasksData, isLoading: tasksLoading } = useTasks({ intern: id, limit: 50 });
  const { data: attendanceData, isLoading: attLoading } = useAttendance({ intern: id, limit: 100 });
  const { data: reportsData } = useReports({ intern: id, limit: 20 });
  const { data: evalData } = useEvaluations({ intern: id, limit: 10 });

  const assignDept = useAssignDepartment(id);
  const removeDept = useRemoveDepartment(id);
  const assignSv = useAssignSupervisor(id);
  const removeSv = useRemoveSupervisor(id);

  const attendance = useMemo(() => attendanceData?.data ?? [], [attendanceData]);
  const grid = useMemo(() => buildAttendanceGrid(attendance, intern?.startDate), [attendance, intern?.startDate]);

  const handleAssignDept = () => {
    if (!selectedDept) return;
    assignDept.mutate(selectedDept, { onSuccess: () => { setDeptDialogOpen(false); setSelectedDept(""); } });
  };
  const handleAssignSv = () => {
    if (!selectedSv) return;
    assignSv.mutate(selectedSv, { onSuccess: () => { setSvDialogOpen(false); setSelectedSv(""); } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]"><Skeleton className="h-[480px] rounded-xl" /><Skeleton className="h-[480px] rounded-xl" /></div>
      </div>
    );
  }

  if (isError || !intern) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-lg font-semibold">We couldn&apos;t find that intern</p>
        <p className="mt-1 text-sm text-muted-foreground">The record may have been removed, or the link is wrong.</p>
        <Button variant="outline" size="sm" asChild className="mt-5"><Link href="/interns">Back to interns</Link></Button>
      </div>
    );
  }

  const tasks = tasksData?.data ?? [];
  const openTasks = tasks.filter((t) => t.status !== "COMPLETED").length;
  const flagged = attendance.filter((a) => a.status === "FLAGGED").length;
  const reports = reportsData?.data ?? [];
  const evaluations = evalData?.data ?? [];
  const submittedEvals = evaluations.filter((e) => e.status === "SUBMITTED").length;
  const progress = programmeProgress(intern.startDate, intern.endDate);
  const checkIns = attendance.filter((a) => a.checkType === "CHECK_IN");
  const presentDays = checkIns.filter((a) => a.status !== "REJECTED").length;
  const email = typeof intern.user === "object" ? intern.user?.email : undefined;

  const TABS: { key: Tab; label: string; count?: React.ReactNode }[] = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks", count: tasks.length },
    { key: "attendance", label: "Attendance", count: flagged > 0 ? <span className="text-warning-foreground">{flagged} flagged</span> : checkIns.length },
    { key: "reports", label: "Reports & evaluations", count: reports.length + evaluations.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Link href="/interns" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {isHR ? "All interns" : "My interns"}
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-5">
        <PersonAvatar firstName={intern.firstName} lastName={intern.lastName} size="xl" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em]">{intern.firstName} {intern.middleName ? `${intern.middleName} ` : ""}{intern.lastName}</h1>
            <StatusBadge status={intern.status} />
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary-foreground">
            <span><TypeLabel type={intern.internshipType} /></span>
            <span className="text-input" aria-hidden="true">|</span>
            <span>{intern.department ? `${intern.department.name}${intern.department.subsidiary ? ` · ${intern.department.subsidiary}` : ""}` : "No department"}</span>
            <span className="text-input" aria-hidden="true">|</span>
            <span>
              Supervisor:{" "}
              {intern.supervisor ? (
                <Link href={`/supervisors/${intern.supervisor._id}`} className="text-primary hover:underline">{intern.supervisor.firstName} {intern.supervisor.lastName}</Link>
              ) : (
                <span className="font-medium text-danger-foreground">Unassigned</span>
              )}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isHR && <Button variant="outline" onClick={() => setEditSheetOpen(true)}><Pencil /> Edit</Button>}
          <Button variant="outline" asChild><Link href="/documents/generate">Generate letter</Link></Button>
          <Button asChild><Link href="/tasks/new">Assign task</Link></Button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Profile sections" className="relative flex gap-6 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px h-10 whitespace-nowrap border-b-2 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 font-mono text-xs text-muted-foreground tabular">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="min-w-0 space-y-4">
            {intern.completedAt && (
              <div className="rounded-xl border border-success/30 bg-success-soft px-5 py-4 text-sm text-success-foreground">
                <p className="font-medium">Completed on {fmtDate(intern.completedAt)}</p>
                {intern.completionNote && <p className="mt-1">{intern.completionNote}</p>}
              </div>
            )}

            <Section title="Programme progress" bodyClassName="space-y-4 p-5">
              {progress ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-muted-foreground">
                    <span><span className="font-mono text-foreground tabular">Week {progress.week}</span> of {progress.totalWeeks}</span>
                    <span>{fmtDate(intern.startDate)} – {fmtDate(intern.endDate)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    {[["Joined", intern.createdAt], ["Started", intern.startDate], ["Ends", intern.endDate], ["Completed", intern.completedAt]].map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-medium text-secondary-foreground">{k}</dt>
                        <dd className="font-mono text-muted-foreground tabular">{v ? fmtShortDate(v) : "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Add start and end dates to track progress.</p>
              )}
            </Section>

            <Section
              title="Attendance · last 6 weeks"
              action={<span className="text-[13px] text-muted-foreground"><span className="font-mono text-foreground tabular">{presentDays}</span> check-ins recorded</span>}
              bodyClassName="space-y-4 p-5"
            >
              {attLoading ? (
                <Skeleton className="h-36 w-full" />
              ) : (
                <>
                  <div className="flex gap-2.5 overflow-x-auto">
                    <div className="grid grid-rows-5 gap-[5px] text-[11px] text-muted-foreground" aria-hidden="true">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => <span key={d} className="flex h-[22px] items-center">{d}</span>)}
                    </div>
                    <div className="flex gap-[5px]" role="img" aria-label="Check-ins over the last six weeks">
                      {grid.map((week, wi) => (
                        <div key={wi} className="grid grid-rows-5 gap-[5px]">
                          {week.map((day) => (
                            <span key={day.key} title={day.label} className={cn("h-[22px] w-[22px] rounded-[5px]", DAY_STYLE[day.state])} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-secondary-foreground">
                    {([["ontime", "Before 09:00"], ["late", "After 09:00"], ["issue", "Flagged or rejected"], ["missed", "No check-in"], ["upcoming", "Upcoming"]] as const).map(([s, l]) => (
                      <li key={s} className="flex items-center gap-1.5"><span className={cn("h-3 w-3 rounded-[3px]", DAY_STYLE[s])} />{l}</li>
                    ))}
                  </ul>
                </>
              )}
            </Section>

            <Section title="Recent tasks" action={<button onClick={() => setTab("tasks")} className="text-[13px] font-medium text-primary hover:underline">All {tasks.length} tasks</button>}>
              {tasksLoading ? <div className="p-5"><Skeleton className="h-24 w-full" /></div> : tasks.length === 0 ? (
                <EmptyRow>No tasks assigned yet.</EmptyRow>
              ) : (
                <ul>
                  {tasks.slice(0, 4).map((t, i) => (
                    <li key={t._id} className={cn(i > 0 && "border-t")}>
                      <Link href={`/tasks/${t._id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{t.title}</span>
                          <span className="block text-xs text-muted-foreground">{t.deadline ? <>Due <span className="font-mono">{fmtShortDate(t.deadline)}</span></> : `Created ${fmtShortDate(t.createdAt)}`}</span>
                        </span>
                        <StatusBadge status={t.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="min-w-0 space-y-4">
            {/* Placement */}
            <Section title="Placement" bodyClassName="divide-y">
              {[
                { label: "Department", value: intern.department ? `${intern.department.name}${intern.department.subsidiary ? ` · ${intern.department.subsidiary}` : ""}` : null, onChange: () => { setSelectedDept(intern.department?._id ?? ""); setDeptDialogOpen(true); }, onRemove: () => removeDept.mutate(), removing: removeDept.isPending },
                { label: "Supervisor", value: intern.supervisor ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}` : null, onChange: () => { setSelectedSv(intern.supervisor?._id ?? ""); setSvDialogOpen(true); }, onRemove: () => removeSv.mutate(), removing: removeSv.isPending },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className={cn("truncate text-sm font-medium", !row.value && "text-danger-foreground")}>{row.value ?? "Not assigned"}</p>
                  </div>
                  {isHR && (
                    <>
                      <Button variant="ghost" size="sm" onClick={row.onChange}>{row.value ? "Change" : "Assign"}</Button>
                      {row.value && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger-foreground" onClick={row.onRemove} disabled={row.removing} aria-label={`Remove ${row.label.toLowerCase()}`}>
                          <X />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </Section>

            {isHR && <AllowancePanel intern={intern} />}

            {isHR && <InternFacePanel internId={intern._id} />}

            <Section title="Details" bodyClassName="px-5 py-1">
              <dl>
                <Detail k="Email" v={email} />
                <Detail k="Phone" v={intern.phone} />
                <Detail k="Institution" v={intern.institution} />
                <Detail k="Institution location" v={intern.institutionLocation} />
                <Detail k="Course of study/discipline" v={intern.course} />
                {intern.level && <Detail k="Qualification/level of study" v={intern.level} />}
                {intern.stateCode && <Detail k="NYSC state code" v={<span className="font-mono">{intern.stateCode}</span>} />}
                {intern.callUpNumber && <Detail k="Call-up number" v={<span className="font-mono">{intern.callUpNumber}</span>} />}
                <Detail k="Gender" v={intern.gender ? intern.gender.charAt(0) + intern.gender.slice(1).toLowerCase() : undefined} />
                <Detail k="Address" v={intern.address} />
              </dl>
            </Section>

            {isHR && intern.status !== "COMPLETED" && (
              <Section title="Ready to complete?" bodyClassName="space-y-2.5 p-5">
                {[
                  { ok: tasks.length > 0 && openTasks === 0, text: openTasks === 0 ? "All tasks resolved" : `All tasks resolved · ${openTasks} open` },
                  { ok: submittedEvals > 0, text: "At least one evaluation submitted" },
                ].map((c) => (
                  <p key={c.text} className="flex items-center gap-2.5 text-[13px] text-secondary-foreground">
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", c.ok ? "bg-success-soft text-success-foreground" : "bg-muted text-muted-foreground")}>
                      {c.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <Minus className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {c.text}
                  </p>
                ))}
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href={`/exit/${intern._id}`}>Go to exit &amp; completion</Link>
                </Button>
              </Section>
            )}
          </div>
        </div>
      )}

      {/* ── Tasks ────────────────────────────────────────────────────────────── */}
      {tab === "tasks" && (
        <Section title="Tasks" description="Work assigned to this intern" action={<Link href="/tasks" className="text-[13px] font-medium text-primary hover:underline">All tasks</Link>}>
          {tasks.length === 0 ? <EmptyRow>No tasks assigned yet.</EmptyRow> : (
            <ul>
              {tasks.map((t, i) => (
                <li key={t._id} className={cn(i > 0 && "border-t")}>
                  <Link href={`/tasks/${t._id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.description}</span>
                    </span>
                    <span className="hidden font-mono text-xs text-muted-foreground tabular sm:block">{t.deadline ? `Due ${fmtShortDate(t.deadline)}` : ""}</span>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* ── Attendance ───────────────────────────────────────────────────────── */}
      {tab === "attendance" && (
        <Section title="Attendance history" action={<Link href="/attendance" className="text-[13px] font-medium text-primary hover:underline">Full attendance log</Link>}>
          {attendance.length === 0 ? <EmptyRow>No check-ins yet.</EmptyRow> : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Type</th>
                    <th className="px-5 py-2.5 font-medium">Time</th>
                    <th className="px-5 py-2.5 font-medium">From DAAR Lagos</th>
                    <th className="px-5 py-2.5 font-medium">GPS accuracy</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a._id} className="border-t">
                      <td className="px-5 py-3">{fmtDate(a.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                      <td className="px-5 py-3 text-secondary-foreground">{a.checkType === "CHECK_IN" ? "Check in" : "Check out"}</td>
                      <td className="px-5 py-3 font-mono text-[13px] tabular">{fmtTime(a.submittedAt)}</td>
                      <td className="px-5 py-3 font-mono text-[13px] tabular">{fmtMeters(a.distanceFromOffice)}</td>
                      <td className="px-5 py-3 font-mono text-[13px] tabular">{a.locationAccuracy !== undefined ? `±${Math.round(a.locationAccuracy)} m` : "—"}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={a.status} />
                        {a.flagReasons && a.flagReasons.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">{flagReasonText(a.flagReasons)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ── Reports & evaluations ───────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Section title="Reports">
            {reports.length === 0 ? <EmptyRow>No reports submitted yet.</EmptyRow> : (
              <ul>
                {reports.map((r, i) => (
                  <li key={r._id} className={cn(i > 0 && "border-t")}>
                    <Link href={`/reports/${r._id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.title}</span>
                        <span className="block text-xs text-muted-foreground">{r.type === "WEEKLY" ? "Weekly" : "Daily"} · {fmtShortDate(r.createdAt)}</span>
                      </span>
                      <StatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Evaluations">
            {evaluations.length === 0 ? <EmptyRow>No evaluations yet.</EmptyRow> : (
              <ul>
                {evaluations.map((ev, i) => {
                  const s = ev.scores;
                  const avg = s ? ((s.workQuality + s.reliability + s.communication + s.learningProgress + s.professionalism) / 5).toFixed(1) : null;
                  return (
                    <li key={ev._id} className={cn(i > 0 && "border-t")}>
                      <Link href={`/evaluations/${ev._id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{ev.comments || "No comments"}</span>
                          <span className="block text-xs text-muted-foreground">{fmtShortDate(ev.submittedAt ?? ev.createdAt)}</span>
                        </span>
                        {avg && <span className="font-mono text-sm tabular">{avg}<span className="text-xs text-muted-foreground">/5</span></span>}
                        <StatusBadge status={ev.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      )}

      {/* Assign department */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign department</DialogTitle></DialogHeader>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger aria-label="Department"><SelectValue placeholder="Choose a department" /></SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d._id}>{d.name}{d.subsidiary ? ` — ${d.subsidiary}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignDept} disabled={!selectedDept || assignDept.isPending}>
              {assignDept.isPending && <Loader2 className="animate-spin" />} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign supervisor */}
      <Dialog open={supervisorDialogOpen} onOpenChange={setSvDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign supervisor</DialogTitle></DialogHeader>
          <Select value={selectedSv} onValueChange={setSelectedSv}>
            <SelectTrigger aria-label="Supervisor"><SelectValue placeholder="Choose a supervisor" /></SelectTrigger>
            <SelectContent>
              {supervisors.filter((s) => s.isActive).map((s) => (
                <SelectItem key={s._id} value={s._id}>{s.firstName} {s.lastName}{s.department ? ` · ${s.department.name}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSvDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignSv} disabled={!selectedSv || assignSv.isPending}>
              {assignSv.isPending && <Loader2 className="animate-spin" />} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditInternSheet intern={intern} open={editSheetOpen} onOpenChange={setEditSheetOpen} />
    </div>
  );
}
