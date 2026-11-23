"use client";

import { TypeLabel } from "@/components/shared/TypeLabel";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Pencil, Eye } from "lucide-react";
import { useInterns } from "@/features/interns/hooks";
import { useSupervisorMe } from "@/features/supervisors/hooks";
import { useAttendance } from "@/features/attendance/hooks";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { useAuth } from "@/lib/auth/context";
import { EditInternSheet } from "@/features/interns/components/EditInternSheet";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonCell } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { fmtTime, programmeProgress } from "@/lib/utils/format";
import type { AttendanceObject, Intern, InternshipStatus, InternshipType } from "@/types";

const TABS: { value: InternshipStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "SCREENED", label: "Screened" },
  { value: "COMPLETED", label: "Completed" },
];

const SUBSIDIARY_DOT: Record<string, string> = {
  AIT: "bg-[#D92D20]", Raypower: "bg-primary", Faaji: "bg-warning", Corporate: "bg-muted-foreground",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Today's check-in for an intern: time, flagged, rejected, or absent. */
function TodayCell({ record, active }: { record?: AttendanceObject; active: boolean }) {
  if (!active) return <span className="text-muted-foreground">—</span>;
  if (!record) return <span className="text-muted-foreground">Not in</span>;
  if (record.status === "FLAGGED") return <span className="font-medium text-warning-foreground">Flagged · <span className="font-mono tabular">{fmtTime(record.submittedAt)}</span></span>;
  if (record.status === "REJECTED") return <span className="font-medium text-danger-foreground">Rejected</span>;
  return <span className="font-mono tabular text-secondary-foreground">{fmtTime(record.submittedAt)}</span>;
}

export default function InternsPage() {
  const { user } = useAuth();
  const isHR = user?.role === "HR";
  const { data: supervisorMeData } = useSupervisorMe();
  const supervisorId = !isHR ? supervisorMeData?.data?.supervisor?._id : undefined;
  const { data: stats } = useDashboardStats(isHR);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [status, setStatus] = useState<InternshipStatus | "ALL">(isHR ? "ACTIVE" : "ALL");
  // Allow links like /interns?status=ONBOARDING
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("status");
    if (q && ["SCREENED", "ONBOARDING", "ACTIVE", "COMPLETED", "ALL"].includes(q)) setStatus(q as InternshipStatus | "ALL");
    const a = new URLSearchParams(window.location.search).get("allowance");
    if (a === "yes" || a === "no") { setAllowance(a); setStatus("ALL"); }
  }, []);
  const [internshipType, setType] = useState<InternshipType | "ALL">("ALL");
  const [allowance, setAllowance] = useState<"ALL" | "yes" | "no">("ALL");
  const [page, setPage] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), 350);
  };

  const { data, isLoading, isError, refetch } = useInterns({
    page,
    limit: 20,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status !== "ALL" && { status }),
    ...(internshipType !== "ALL" && { internshipType }),
    ...(allowance !== "ALL" && { allowance }),
    ...(!isHR && supervisorId && { supervisor: supervisorId }),
  });

  const { data: todayAttendance } = useAttendance({ date: todayKey(), checkType: "CHECK_IN", limit: 200 });
  const checkInByIntern = useMemo(() => {
    const map = new Map<string, AttendanceObject>();
    for (const a of todayAttendance?.data ?? []) {
      const id = typeof a.intern === "string" ? a.intern : a.intern._id;
      map.set(id, a);
    }
    return map;
  }, [todayAttendance]);

  const interns = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const tabCount = (v: InternshipStatus | "ALL") => {
    if (!stats) return undefined;
    return v === "ALL" ? stats.interns.total : stats.interns.byStatus[v];
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={<>{isHR ? "Interns" : "My interns"} {!isLoading && <span className="font-mono text-lg font-normal text-muted-foreground tabular">{total}</span>}</>}
        description={isHR ? "Everyone on the programme, from onboarding to completion." : "Interns assigned to you."}
        actions={isHR && (
          <Button asChild>
            <Link href="/interns/new"><Plus /> Add intern</Link>
          </Button>
        )}
      />

      {/* Status tabs */}
      <div role="tablist" aria-label="Filter by status" className="relative flex gap-6 overflow-x-auto border-b">
        {TABS.map((t) => {
          const on = status === t.value;
          const n = tabCount(t.value);
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={on}
              onClick={() => { setStatus(t.value); setPage(1); }}
              className={cn(
                "-mb-px h-10 whitespace-nowrap border-b-2 text-sm font-medium transition-colors",
                on ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}{n !== undefined && <span className="ml-1.5 font-mono text-xs text-muted-foreground tabular">{n}</span>}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs flex-1 basis-60">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, institution or course"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 pl-9"
            aria-label="Search interns"
          />
        </div>
        <Select value={internshipType} onValueChange={(v) => { setType(v as InternshipType | "ALL"); setPage(1); }}>
          <SelectTrigger className="h-9 w-auto min-w-[150px]" aria-label="Type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="INTERNSHIP"><TypeLabel type="INTERNSHIP" plural /></SelectItem>
            <SelectItem value="NYSC_IT"><TypeLabel type="NYSC_IT" plural /></SelectItem>
          </SelectContent>
        </Select>
        {isHR && (
          <Select value={allowance} onValueChange={(v) => { setAllowance(v as "ALL" | "yes" | "no"); setPage(1); }}>
            <SelectTrigger className="h-9 w-auto min-w-[160px]" aria-label="Allowance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Allowance: all</SelectItem>
              <SelectItem value="yes">On allowance</SelectItem>
              <SelectItem value="no">No allowance</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
          Couldn&apos;t load interns.
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Supervisor</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Progress</th>
                <th className="px-4 py-2.5 font-medium">Today</th>
                <th className="w-12 px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    {debouncedSearch ? `No interns match “${debouncedSearch}”.` : "No interns here yet."}
                  </td>
                </tr>
              ) : (
                interns.map((intern) => {
                  const p = programmeProgress(intern.startDate, intern.endDate);
                  const sub = intern.department?.subsidiary;
                  return (
                    <tr key={intern._id} className="border-t transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link href={`/interns/${intern._id}`} className="group block rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
                          <PersonCell
                            firstName={intern.firstName}
                            lastName={intern.lastName}
                            sub={intern.institution ?? intern.course}
                          />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-secondary-foreground"><TypeLabel type={intern.internshipType} /></td>
                      <td className="px-4 py-3">
                        {intern.department ? (
                          <span className="flex flex-col">
                            <span>{intern.department.name}</span>
                            {sub && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className={cn("h-1.5 w-1.5 rounded-sm", SUBSIDIARY_DOT[sub] ?? "bg-muted-foreground")} aria-hidden="true" />
                                {sub}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {intern.supervisor && typeof intern.supervisor !== "string" ? (
                          <span className="text-secondary-foreground">{intern.supervisor.firstName} {intern.supervisor.lastName}</span>
                        ) : intern.status === "ACTIVE" ? (
                          <span className="font-medium text-danger-foreground">Unassigned</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={intern.status} /></td>
                      <td className="px-4 py-3">
                        {p ? (
                          <span className="flex items-center gap-2">
                            <span className="h-[5px] w-16 overflow-hidden rounded-full bg-muted">
                              <span className="block h-full rounded-full bg-primary" style={{ width: `${p.percent}%` }} />
                            </span>
                            <span className="font-mono text-xs text-muted-foreground tabular">Wk {p.week}/{p.totalWeeks}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <TodayCell record={checkInByIntern.get(intern._id)} active={intern.status === "ACTIVE"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label={`Actions for ${intern.firstName} ${intern.lastName}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <Link href={`/interns/${intern._id}`}><Eye className="text-muted-foreground" /> View profile</Link>
                            </DropdownMenuItem>
                            {isHR && (
                              <DropdownMenuItem onClick={() => { setEditingIntern(intern); setSheetOpen(true); }}>
                                <Pencil className="text-muted-foreground" /> Quick edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <span>
            Page <span className="font-mono tabular">{page}</span> of <span className="font-mono tabular">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <EditInternSheet intern={editingIntern} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
