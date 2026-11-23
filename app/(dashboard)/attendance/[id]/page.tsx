"use client";

import { FaceCompare } from "@/components/face/AuthImage";
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { useAttendanceRecord, useCorrectAttendance } from "@/features/attendance/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils/cn";
import { fmtDate, fmtTime, fmtMeters, fullName, flagReasonText } from "@/lib/utils/format";
import type { AttendanceStatus } from "@/types";

const EXPLAIN: Record<AttendanceStatus, string> = {
  ACCEPTED: "Inside the geofence with good location accuracy.",
  FLAGGED: "Inside the office zone, but the phone's GPS signal was weak (accuracy worse than 50 m), so the location is less exact. Most of the time the intern is at work. Correct it to count the day for stipends.",
  REJECTED: "Outside the DAAR Communications geofence.",
  CORRECTED: "HR changed the automatic result. See the note below.",
};

const TONE: Record<AttendanceStatus, string> = {
  ACCEPTED: "border-success/30 bg-success-soft text-success-foreground",
  FLAGGED: "border-warning/40 bg-warning-soft text-warning-foreground",
  REJECTED: "border-danger/30 bg-danger-soft text-danger-foreground",
  CORRECTED: "border-info/30 bg-info-soft text-info-foreground",
};

function Row({ k, v, mono }: { k: string; v?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-t py-3 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("text-right font-medium", mono && "font-mono tabular")}>{v ?? "—"}</dd>
    </div>
  );
}

export default function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data, isLoading, isError } = useAttendanceRecord(id);
  const record = data?.data?.attendance;

  const [correctOpen, setCorrectOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("ACCEPTED");
  const [correctionNote, setCorrectionNote] = useState("");
  const correctMut = useCorrectAttendance(id, () => { setCorrectOpen(false); setCorrectionNote(""); });

  const isHR = user?.role === "HR";
  const canCorrect = isHR && record && record.status !== "ACCEPTED";

  if (isLoading) return <div className="mx-auto max-w-2xl space-y-4"><Skeleton className="h-16" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (isError || !record) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-lg font-semibold">We couldn&apos;t find that record</p>
        <Button variant="outline" size="sm" asChild className="mt-5"><Link href="/attendance">Back to attendance</Link></Button>
      </div>
    );
  }

  const intern = typeof record.intern === "string" ? undefined : record.intern;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/attendance" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Attendance
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar firstName={intern?.firstName} lastName={intern?.lastName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">
            {record.checkType === "CHECK_IN" ? "Check-in" : "Check-out"} · {fullName(record.intern)}
          </h1>
          <p className="text-sm text-muted-foreground">{fmtDate(record.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {canCorrect && (
          <Button variant="outline" onClick={() => { setNewStatus("ACCEPTED"); setCorrectOpen(true); }}>
            <Pencil /> Correct
          </Button>
        )}
      </div>

      <div className={cn("rounded-xl border px-5 py-4", TONE[record.status])}>
        <div className="flex items-center gap-2"><StatusBadge status={record.status} /></div>
        <p className="mt-2 text-sm">{EXPLAIN[record.status]}</p>
        {record.flagReasons && record.flagReasons.length > 0 && (
          <p className="mt-1 text-xs">Reason: {flagReasonText(record.flagReasons)}</p>
        )}
      </div>

      {record.hasSelfie && intern && (
        <Section title="Face check" bodyClassName="p-5">
          <div className="max-w-sm"><FaceCompare internId={intern._id} attendanceId={record._id} score={record.faceScore} /></div>
          {record.livenessPassed === false && <p className="mt-3 text-[13px] text-warning-foreground">The selfie didn&apos;t pass the live-person check.</p>}
        </Section>
      )}

      <Section title="Details" bodyClassName="px-5 py-1">
        <dl>
          <Row k="Submitted" v={`${fmtDate(record.submittedAt)} · ${fmtTime(record.submittedAt)}`} />
          <Row k="Inside geofence" v={record.withinGeofence == null ? "—" : record.withinGeofence ? "Yes" : "No"} />
          <Row k="Distance from DAAR Lagos" v={fmtMeters(record.distanceFromOffice)} mono />
          <Row k="GPS accuracy" v={record.locationAccuracy != null ? `±${Math.round(record.locationAccuracy)} m` : "—"} mono />
          {intern && <Row k="Intern" v={<Link href={`/interns/${intern._id}`} className="text-primary hover:underline">View profile</Link>} />}
        </dl>
      </Section>

      {record.correctionNote && (
        <Section title="HR correction" bodyClassName="p-5">
          <p className="text-sm">{record.correctionNote}</p>
          <p className="mt-2 text-xs text-muted-foreground">Corrected {fmtDate(record.correctedAt)} at {fmtTime(record.correctedAt)}</p>
        </Section>
      )}

      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Correct this record</DialogTitle>
            <DialogDescription>Overrides the automatic result. Your note is kept on the record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-status">New status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as AttendanceStatus)}>
                <SelectTrigger id="new-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="FLAGGED">Flagged</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="e.g. Confirmed present — weak GPS signal inside the building."
                rows={3}
                maxLength={500}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectOpen(false)}>Cancel</Button>
            <Button disabled={!correctionNote.trim() || correctMut.isPending} onClick={() => correctMut.mutate({ status: newStatus, correctionNote: correctionNote.trim() })}>
              {correctMut.isPending && <Loader2 className="animate-spin" />} Apply correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
