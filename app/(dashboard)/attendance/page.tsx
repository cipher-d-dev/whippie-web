"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarDays,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { useAttendance } from "@/features/attendance/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { AttendanceStatus, AttendanceCheckType } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive"; rowClass: string }
> = {
  ACCEPTED: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    variant: "default",
    rowClass: "",
  },
  FLAGGED: {
    label: "Flagged",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    variant: "secondary",
    rowClass: "bg-amber-50/50 dark:bg-amber-950/10",
  },
  REJECTED: {
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5 text-destructive" />,
    variant: "destructive",
    rowClass: "bg-rose-50/50 dark:bg-rose-950/10",
  },
};

function getInternName(r: { intern: { _id: string; firstName: string; lastName: string } | string }): string {
  if (typeof r.intern === "string") return "—";
  return `${r.intern.firstName} ${r.intern.lastName}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZE = 30;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [status,    setStatus]    = useState<AttendanceStatus | "ALL">("ALL");
  const [checkType, setCheckType] = useState<AttendanceCheckType | "ALL">("ALL");
  const [date,      setDate]      = useState("");
  const [page,      setPage]      = useState(1);

  const params = {
    page, limit: PAGE_SIZE,
    ...(status    !== "ALL" && { status }),
    ...(checkType !== "ALL" && { checkType }),
    ...(date && { date }),
  };

  const { data, isLoading, isError } = useAttendance(params);
  const records    = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const flagged  = records.filter((r) => r.status === "FLAGGED").length;
  const rejected = records.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Attendance</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {!isLoading && `${total} record${total !== 1 ? "s" : ""}`}
            {flagged > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                {flagged} flagged
              </span>
            )}
            {rejected > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                <XCircle className="h-3 w-3" />
                {rejected} rejected
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
          className="w-44"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v as AttendanceStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={checkType} onValueChange={(v) => { setCheckType(v as AttendanceCheckType | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="CHECK_IN">Check-in</SelectItem>
            <SelectItem value="CHECK_OUT">Check-out</SelectItem>
          </SelectContent>
        </Select>
        {(date || status !== "ALL" || checkType !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDate(""); setStatus("ALL"); setCheckType("ALL"); setPage(1); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {records.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No attendance records found</p>
          <p className="mt-1 text-xs text-muted-foreground">Records submitted by interns via the PWA will appear here.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intern</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {isError && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-destructive">Failed to load records.</TableCell></TableRow>
              )}
              {records.map((record) => {
                const cfg = STATUS_CONFIG[record.status];
                return (
                  <TableRow key={record._id} className={cfg.rowClass}>
                    <TableCell className="font-medium">
                      {getInternName(record as Parameters<typeof getInternName>[0])}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(record.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {record.checkType === "CHECK_IN"
                          ? <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-500" />
                          : <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-500" />}
                        {record.checkType === "CHECK_IN" ? "In" : "Out"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {fmtTime(record.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="inline-flex items-center gap-1.5">
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.distanceFromOffice != null
                        ? `${record.distanceFromOffice}m`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/attendance/${record._id}`}>
                          {record.status !== "ACCEPTED" ? "Review" : "View"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
