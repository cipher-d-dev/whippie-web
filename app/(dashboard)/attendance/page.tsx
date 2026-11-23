"use client";

import { FaceCompare } from "@/components/face/AuthImage";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import { useAttendance, useCorrectAttendance } from "@/features/attendance/hooks";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonCell } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils/cn";
import { fmtDate, fmtTime, fmtMeters, fullName, flagReasonText } from "@/lib/utils/format";
import type { AttendanceObject, AttendanceStatus, AttendanceCheckType } from "@/types";

const PAGE_SIZE = 30;
const POOR_ACCURACY_METERS = 50;

function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDay(day: string, by: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + by);
  return localDay(d);
}

// ─── Correction dialog ────────────────────────────────────────────────────────

function CorrectDialog({
  record,
  to,
  onClose,
}: {
  record: AttendanceObject;
  to: AttendanceStatus;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const correct = useCorrectAttendance(record._id, onClose);
  const name = fullName(record.intern);
  const verb = to === "ACCEPTED" ? "Accept" : "Reject";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{verb} {name}&apos;s check-in?</DialogTitle>
          <DialogDescription>
            {fmtDate(record.date, { weekday: "long", day: "numeric", month: "long" })} at {fmtTime(record.submittedAt)} · {fmtMeters(record.distanceFromOffice)} from DAAR Lagos
            {record.locationAccuracy !== undefined && `, GPS ±${Math.round(record.locationAccuracy)} m`}
          </DialogDescription>
        </DialogHeader>
        {record.hasSelfie && typeof record.intern !== "string" && (
          <FaceCompare internId={record.intern._id} attendanceId={record._id} score={record.faceScore} />
        )}
        {record.flagReasons?.length ? <p className="text-[13px] text-muted-foreground">Flagged: {flagReasonText(record.flagReasons)}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="correction-note">Note for the record</Label>
          <Textarea
            id="correction-note"
            rows={3}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder={to === "ACCEPTED" ? "e.g. Confirmed at the front desk" : "e.g. Not in the building at this time"}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={to === "ACCEPTED" ? "default" : "destructive"}
            disabled={!note.trim() || correct.isPending}
            onClick={() => correct.mutate({ status: to, correctionNote: note.trim() })}
          >
            {correct.isPending && <Loader2 className="animate-spin" />}
            {verb} check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuth();
  const isHR = user?.role === "HR";
  const today = localDay();
  const [day, setDay] = useState<string>(today); // "" = all dates
  const [status, setStatus] = useState<AttendanceStatus | "ALL">("ALL");
  const [checkType, setCheckType] = useState<AttendanceCheckType | "ALL">("CHECK_IN");
  const [page, setPage] = useState(1);
  const [correcting, setCorrecting] = useState<{ record: AttendanceObject; to: AttendanceStatus } | null>(null);
  const { data: stats } = useDashboardStats(isHR && day === today);

  // One day: load it whole so the status counts are exact. All dates: paginate.
  const { data, isLoading, isError, refetch } = useAttendance({
    ...(day ? { date: day, limit: 300 } : { page, limit: PAGE_SIZE }),
    ...(checkType !== "ALL" && { checkType }),
  });
  const all = useMemo(() => data?.data ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: all.length, ACCEPTED: 0, FLAGGED: 0, REJECTED: 0, CORRECTED: 0 };
    for (const r of all) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [all]);
  const records = status === "ALL" ? all : all.filter((r) => r.status === status);
  const totalPages = day ? 1 : data?.totalPages ?? 1;

  const SEGMENTS: { key: AttendanceStatus | "ALL"; label: string; dot: string }[] = [
    { key: "ALL", label: "All", dot: "bg-foreground" },
    { key: "ACCEPTED", label: "Accepted", dot: "bg-success" },
    { key: "FLAGGED", label: "Flagged", dot: "bg-warning" },
    { key: "REJECTED", label: "Rejected", dot: "bg-danger" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description={<span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> DAAR Lagos office zone</span>}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => setDay(shiftDay(day || today, -1))}><ChevronLeft /></Button>
            <Input
              type="date"
              value={day}
              max={today}
              onChange={(e) => { setDay(e.target.value); setPage(1); }}
              className="h-9 w-[160px]"
              aria-label="Date"
            />
            <Button variant="outline" size="icon" aria-label="Next day" disabled={!day || day >= today} onClick={() => setDay(shiftDay(day, 1))}><ChevronRight /></Button>
            {day !== today && <Button variant="ghost" onClick={() => setDay(today)}>Today</Button>}
            {day && <Button variant="ghost" onClick={() => { setDay(""); setPage(1); }}>All dates</Button>}
          </div>
        }
      />

      {/* Status segments */}
      <div role="tablist" aria-label="Filter by status" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {SEGMENTS.map((s) => {
          const on = status === s.key;
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={on}
              onClick={() => setStatus(s.key)}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors",
                on ? "border-primary ring-[3px] ring-ring/20" : "hover:border-input"
              )}
            >
              <span className="flex items-center gap-1.5 text-[13px] text-secondary-foreground"><span className={cn("h-2 w-2 rounded-full", s.dot)} />{s.label}</span>
              <span className="font-mono text-2xl font-medium tracking-[-0.02em] tabular">{isLoading ? "–" : counts[s.key] ?? 0}</span>
            </button>
          );
        })}
        {stats && day === today && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-dashed px-4 py-3.5">
            <span className="flex items-center gap-1.5 text-[13px] text-secondary-foreground"><span className="h-2 w-2 rounded-full bg-muted-foreground/50" />Not checked in</span>
            <span className="font-mono text-2xl font-medium tracking-[-0.02em] tabular">{stats.today.notCheckedIn}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={checkType} onValueChange={(v) => { setCheckType(v as AttendanceCheckType | "ALL"); setPage(1); }}>
          <SelectTrigger className="h-9 w-auto min-w-[150px]" aria-label="Check type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CHECK_IN">Check-ins</SelectItem>
            <SelectItem value="CHECK_OUT">Check-outs</SelectItem>
            <SelectItem value="ALL">Check-ins and outs</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[13px] text-muted-foreground">
          {day ? fmtDate(`${day}T12:00:00`, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "All dates"}
        </span>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
          Couldn&apos;t load attendance.
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No {status === "ALL" ? "" : `${status.toLowerCase()} `}records{day ? " for this day" : ""}</p>
          <p className="mt-1 text-xs text-muted-foreground">Check-ins from the Whippie Intern app appear here.</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Intern</th>
                {!day && <th className="px-4 py-2.5 font-medium">Date</th>}
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">From DAAR Lagos</th>
                <th className="px-4 py-2.5 font-medium">GPS accuracy</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const needsDecision = r.status === "FLAGGED";
                const intern = typeof r.intern === "string" ? undefined : r.intern;
                const poor = (r.locationAccuracy ?? 0) > POOR_ACCURACY_METERS;
                return (
                  <tr key={r._id} className={cn("border-t", needsDecision && "bg-warning-soft/40")}>
                    <td className="px-4 py-3">
                      {intern ? (
                        <Link href={`/interns/${intern._id}`} className="block"><PersonCell firstName={intern.firstName} lastName={intern.lastName} /></Link>
                      ) : "—"}
                    </td>
                    {!day && <td className="px-4 py-3 text-secondary-foreground">{fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" })}</td>}
                    <td className="px-4 py-3 text-secondary-foreground">{r.checkType === "CHECK_IN" ? "In" : "Out"}</td>
                    <td className="px-4 py-3 font-mono text-[13px] tabular">{fmtTime(r.submittedAt)}</td>
                    <td className={cn("px-4 py-3 font-mono text-[13px] tabular", r.withinGeofence === false && "text-danger-foreground")}>{fmtMeters(r.distanceFromOffice)}</td>
                    <td className={cn("px-4 py-3 font-mono text-[13px] tabular", poor && "text-warning-foreground")}>
                      {r.locationAccuracy !== undefined ? `±${Math.round(r.locationAccuracy)} m` : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {needsDecision && isHR ? (
                        <span className="inline-flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-8 border-success/40 text-success-foreground hover:bg-success-soft" onClick={() => setCorrecting({ record: r, to: "ACCEPTED" })}>Accept</Button>
                          <Button size="sm" variant="outline" className="h-8 border-danger/40 text-danger-foreground hover:bg-danger-soft" onClick={() => setCorrecting({ record: r, to: "REJECTED" })}>Reject</Button>
                        </span>
                      ) : (
                        <Link href={`/attendance/${r._id}`} className="text-[13px] font-medium text-primary hover:underline">Details</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-1.5 text-[13px] text-muted-foreground">
        <p>Check-ins outside the office zone are rejected automatically.</p>
        <p>
          <span className="font-medium text-warning-foreground">Flagged</span>: the intern was inside the office zone, but their phone&apos;s GPS
          signal was weak (worse than {POOR_ACCURACY_METERS} m), so the location is less exact. Most of the time they are at work.
          Accept it to count the day towards their stipend.
        </p>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <span>Page <span className="font-mono">{page}</span> of <span className="font-mono">{totalPages}</span></span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {correcting && <CorrectDialog record={correcting.record} to={correcting.to} onClose={() => setCorrecting(null)} />}
    </div>
  );
}
