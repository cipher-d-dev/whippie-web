"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  X,
  ChevronsUpDown,
  Loader2,
  Calendar,
  Building2,
  UserCheck,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ClipboardList,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Star
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
import { useChecklist } from "@/features/documents/hooks";
import { useReports } from "@/features/reports/hooks";
import { useEvaluations } from "@/features/evaluations/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InternshipStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InternshipStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  SCREENED: {
    label: "Screened",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  ONBOARDING: {
    label: "Onboarding",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500 animate-pulse",
  },
  ACTIVE: {
    label: "Active Intern",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    dotClass: "bg-zinc-400",
  },
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const isHR = user?.role === "HR";
  const { data, isLoading, isError } = useIntern(id);
  const intern = data?.data?.intern;

  // Active tab state
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "attendance" | "documents" | "reports">("overview");

  // Assignment dialog state
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [supervisorDialogOpen, setSvDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSv, setSelectedSv] = useState("");

  // Data queries
  const { data: deptData } = useDepartments({ limit: 100 });
  const { data: svData } = useSupervisors({ limit: 100 });
  const departments = deptData?.data ?? [];
  const supervisors = svData?.data ?? [];

  // Related data for tabs & stats
  const { data: tasksData } = useTasks({ intern: id, limit: 10 });
  const { data: attendanceData } = useAttendance({ intern: id, limit: 15 });
  const { data: checklistData } = useChecklist(id);
  const { data: reportsData } = useReports({ intern: id, limit: 10 });
  const { data: evalData } = useEvaluations({ intern: id, limit: 5 });

  // Mutations
  const assignDept = useAssignDepartment(id);
  const removeDept = useRemoveDepartment(id);
  const assignSv = useAssignSupervisor(id);
  const removeSv = useRemoveSupervisor(id);

  const handleAssignDept = () => {
    if (!selectedDept) return;
    assignDept.mutate(selectedDept, {
      onSuccess: () => {
        setDeptDialogOpen(false);
        setSelectedDept("");
      },
    });
  };

  const handleAssignSv = () => {
    if (!selectedSv) return;
    assignSv.mutate(selectedSv, {
      onSuccess: () => {
        setSvDialogOpen(false);
        setSelectedSv("");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading intern profile...</p>
      </div>
    );
  }

  if (isError || !intern) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">Intern Record Not Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The requested intern record may have been removed or does not exist.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/interns">Back to all interns</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[intern.status] ?? STATUS_CONFIG.SCREENED;
  const initials = `${intern.firstName?.[0] ?? ""}${intern.lastName?.[0] ?? ""}`.toUpperCase();

  // Summary counts
  const tasks = tasksData?.data ?? [];
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const attendanceRecords = attendanceData?.data ?? [];
  const flaggedAttendance = attendanceRecords.filter((a) => a.status === "FLAGGED").length;
  const checklist = checklistData?.data?.checklist ?? [];
  const verifiedDocs = checklist.filter((d) => d.document?.status === "VERIFIED").length;
  const reports = reportsData?.data ?? [];
  const evaluations = evalData?.data ?? [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top back breadcrumb */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/interns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isHR ? "All Interns" : "My Interns"}
          </Link>
        </Button>
        {isHR && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditSheetOpen(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 text-xl font-bold tracking-tight text-primary">
              {initials}
              <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${statusConfig.dotClass}`} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {intern.firstName} {intern.lastName}
                </h1>
                <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.badgeClass}`}>
                  {statusConfig.label}
                </Badge>
                <Badge variant="secondary" className="text-xs font-normal">
                  {intern.internshipType === "NYSC_IT" ? "NYSC / IT" : "Standard Internship"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{intern.course}</span>
                <span className="opacity-40">•</span>
                <span>{intern.institution}</span>
                {intern.level && (
                  <>
                    <span className="opacity-40">•</span>
                    <span>{intern.level}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Metrics Header Pill */}
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
            <div className="text-left md:text-right">
              <p className="text-xs text-muted-foreground">Placement Duration</p>
              <p className="text-sm font-semibold mt-0.5 text-foreground">
                {fmt(intern.startDate)} — {fmt(intern.endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Action / Placement Status Strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t">
          {/* Department Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-background border text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold truncate text-foreground">
                  {intern.department?.name ?? "Unassigned"}
                </p>
              </div>
            </div>
            {isHR && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setSelectedDept(intern.department?._id ?? "");
                    setDeptDialogOpen(true);
                  }}
                >
                  <ChevronsUpDown className="h-3 w-3 mr-1" />
                  {intern.department ? "Change" : "Assign"}
                </Button>
                {intern.department && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDept.mutate()}
                    disabled={removeDept.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Supervisor Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-background border text-primary">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Supervisor</p>
                <p className="text-sm font-semibold truncate text-foreground">
                  {intern.supervisor ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}` : "Unassigned"}
                </p>
              </div>
            </div>
            {isHR && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setSelectedSv(intern.supervisor?._id ?? "");
                    setSvDialogOpen(true);
                  }}
                >
                  <ChevronsUpDown className="h-3 w-3 mr-1" />
                  {intern.supervisor ? "Change" : "Assign"}
                </Button>
                {intern.supervisor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSv.mutate()}
                    disabled={removeSv.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tasks Progress Metric */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border">
            <div className="p-2 rounded-lg bg-background border text-primary">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tasks</p>
              <p className="text-sm font-semibold text-foreground">
                {completedTasks} / {tasks.length} Completed
              </p>
            </div>
          </div>

          {/* Document Verification Metric */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border">
            <div className="p-2 rounded-lg bg-background border text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Verification</p>
              <p className="text-sm font-semibold text-foreground">
                {verifiedDocs} / {checklist.length || 0} Documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
          className="rounded-full text-xs"
        >
          Overview & Info
        </Button>
        <Button
          variant={activeTab === "tasks" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("tasks")}
          className="rounded-full text-xs"
        >
          Assigned Tasks ({tasks.length})
        </Button>
        <Button
          variant={activeTab === "attendance" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("attendance")}
          className="rounded-full text-xs"
        >
          Attendance ({attendanceRecords.length})
          {flaggedAttendance > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 font-bold">
              {flaggedAttendance}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === "documents" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("documents")}
          className="rounded-full text-xs"
        >
          Documents ({checklist.length})
        </Button>
        <Button
          variant={activeTab === "reports" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("reports")}
          className="rounded-full text-xs"
        >
          Reports & Evals ({reports.length + evaluations.length})
        </Button>
      </div>

      {/* TAB 1: OVERVIEW & INFO */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Academic & Placement Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Academic & Education Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Institution</span>
                  <p className="font-medium mt-0.5 text-foreground">{intern.institution || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Course of Study</span>
                  <p className="font-medium mt-0.5 text-foreground">{intern.course || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Academic Level</span>
                  <p className="font-medium mt-0.5 text-foreground">{intern.level || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Program Type</span>
                  <p className="font-medium mt-0.5 text-foreground">
                    {intern.internshipType === "NYSC_IT" ? "NYSC / IT Placement" : "Undergraduate Internship"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Phone Number</span>
                  <p className="font-medium mt-0.5 text-foreground">{intern.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Address</span>
                  <p className="font-medium mt-0.5 text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {intern.address || "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Completion Banner if completed */}
            {intern.completedAt && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Internship Completed
                  </CardTitle>
                  <CardDescription>
                    This intern completed their placement on {fmt(intern.completedAt)}.
                  </CardDescription>
                </CardHeader>
                {intern.completionNote && (
                  <CardContent className="pt-2 text-sm text-foreground">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Completion Note:</p>
                    <p className="mt-1 bg-background/80 p-3 rounded-lg border text-sm">{intern.completionNote}</p>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Right Sidebar: Timeline & Quick Audit */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Placement Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-0 last:pb-0 space-y-1">
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs font-semibold text-foreground">Registration</p>
                  <p className="text-xs text-muted-foreground">Joined {fmt(intern.createdAt)}</p>
                </div>
                <div className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-0 last:pb-0 space-y-1">
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs font-semibold text-foreground">Start Date</p>
                  <p className="text-xs text-muted-foreground">{fmt(intern.startDate)}</p>
                </div>
                <div className="relative pl-6 pb-0 border-l-2 border-primary/20 last:border-0 last:pb-0 space-y-1">
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">Target Completion</p>
                  <p className="text-xs text-muted-foreground">{fmt(intern.endDate)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Supervisor Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {intern.supervisor ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {intern.supervisor.firstName} {intern.supervisor.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Department: {intern.department?.name ?? "General"}
                    </p>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild className="w-full text-xs h-8">
                        <Link href={`/supervisors/${intern.supervisor._id}`}>
                          View Supervisor Profile
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-muted-foreground">No supervisor assigned to this intern yet.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs w-full"
                      onClick={() => setSvDialogOpen(true)}
                    >
                      Assign Supervisor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === "tasks" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Assigned Tasks</CardTitle>
              <CardDescription>Tasks created and assigned to this intern.</CardDescription>
            </div>
            <Button size="sm" asChild variant="outline" className="text-xs h-8">
              <Link href="/tasks">View All Tasks</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No tasks assigned to this intern yet.
              </div>
            ) : (
              <div className="divide-y rounded-xl border">
                {tasks.map((task) => (
                  <div key={task._id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/tasks/${task._id}`} className="font-semibold text-sm hover:underline text-foreground">
                          {task.title}
                        </Link>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                      {task.deadline ? `Due ${fmt(task.deadline)}` : `Created ${fmt(task.createdAt)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === "attendance" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Attendance History</CardTitle>
              <CardDescription>Recent check-in and check-out logs.</CardDescription>
            </div>
            <Button size="sm" asChild variant="outline" className="text-xs h-8">
              <Link href="/attendance">Full Attendance Log</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No attendance logs found for this intern.
              </div>
            ) : (
              <div className="divide-y rounded-xl border">
                {attendanceRecords.map((att) => (
                  <div key={att._id} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={att.status === "FLAGGED" ? "destructive" : "secondary"} className="text-[10px]">
                          {att.status}
                        </Badge>
                        <span className="font-medium text-sm text-foreground">
                          {att.checkType === "CHECK_IN" ? "Check In" : "Check Out"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({new Date(att.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </span>
                      </div>
                      {att.flagReasons && att.flagReasons.length > 0 && (
                        <p className="text-xs text-destructive">
                          Flag reasons: {att.flagReasons.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                      {fmt(att.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === "documents" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Required Documents Checklist</CardTitle>
              <CardDescription>Onboarding & institutional documents status.</CardDescription>
            </div>
            <Button size="sm" asChild variant="outline" className="text-xs h-8">
              <Link href="/documents">Document Management</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {checklist.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No required documents configured.
              </div>
            ) : (
              <div className="divide-y rounded-xl border">
                {checklist.map((item) => (
                  <div key={item.requirement._id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm text-foreground">{item.requirement.label}</span>
                        {item.requirement.isRequired && (
                          <Badge variant="outline" className="text-[9px] uppercase border-amber-500/30 text-amber-600">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.requirement.type}</p>
                    </div>
                    <div>
                      <Badge
                        variant={item.document?.status === "VERIFIED" ? "default" : item.document?.status === "REJECTED" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {item.document?.status ?? "NOT UPLOADED"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: REPORTS & EVALS */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Submitted Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No periodic reports submitted yet.
                </div>
              ) : (
                <div className="divide-y rounded-xl border">
                  {reports.map((rep) => (
                    <div key={rep._id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{rep.title}</p>
                        <p className="text-xs text-muted-foreground">{rep.type} · {rep.status}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{fmt(rep.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Performance Evaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No evaluations recorded yet.
                </div>
              ) : (
                <div className="divide-y rounded-xl border">
                  {evaluations.map((ev) => (
                    <div key={ev._id} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          Status: {ev.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{fmt(ev.createdAt)}</span>
                      </div>
                      <p className="text-xs text-foreground font-medium mt-1">{ev.comments || "No comments."}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign department dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Department</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name}{d.subsidiary ? ` — ${d.subsidiary}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAssignDept}
              disabled={!selectedDept || assignDept.isPending}
              className="w-full"
            >
              {assignDept.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign supervisor dialog */}
      <Dialog open={supervisorDialogOpen} onOpenChange={setSvDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Supervisor</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedSv} onValueChange={setSelectedSv}>
              <SelectTrigger>
                <SelectValue placeholder="Select a supervisor" />
              </SelectTrigger>
              <SelectContent>
                {supervisors
                  .filter((s) => s.isActive)
                  .map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.firstName} {s.lastName}
                      {s.department ? ` · ${s.department.name}` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAssignSv}
              disabled={!selectedSv || assignSv.isPending}
              className="w-full"
            >
              {assignSv.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Sheet */}
      <EditInternSheet
        intern={intern}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />
    </div>
  );
}
