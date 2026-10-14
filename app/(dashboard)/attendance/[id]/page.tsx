"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  MapPin, Clock, Crosshair, Loader2, Pencil,
} from "lucide-react";
import { useAttendanceRecord, useCorrectAttendance } from "@/features/attendance/hooks";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AttendanceStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "destructive" | "outline";
  description: string;
}> = {
  ACCEPTED: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    variant: "default",
    description: "Within geofence with good location accuracy.",
  },
  FLAGGED: {
    label: "Flagged",
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    variant: "secondary",
    description: "Within geofence but location accuracy was poor (>50m).",
  },
  REJECTED: {
    label: "Rejected",
    icon: <XCircle className="h-5 w-5 text-destructive" />,
    variant: "destructive",
    description: "Outside the DAAR Communications geofence.",
  },
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Row({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon && <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>}
      <div className="grid flex-1 grid-cols-2 gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value ?? "—"}</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const { data, isLoading, isError } = useAttendanceRecord(id);
  const record = data?.data?.attendance;

  const [correctOpen, setCorrectOpen]       = useState(false);
  const [newStatus, setNewStatus]           = useState<AttendanceStatus>("ACCEPTED");
  const [correctionNote, setCorrectionNote] = useState("");

  const correctMut = useCorrectAttendance(id, () => { setCorrectOpen(false); setCorrectionNote(""); });

  const isHR     = user?.role === "HR";
  const canCorrect = isHR && record && record.status !== "ACCEPTED";

  if (isLoading) return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  if (isError || !record) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-sm text-destructive">Record not found.</p>
      <Button variant="outline" size="sm" asChild><Link href="/attendance">Back</Link></Button>
    </div>
  );

  const cfg        = STATUS_CONFIG[record.status];
  const internName = typeof record.intern !== "string"
    ? `${record.intern.firstName} ${record.intern.lastName}` : "—";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/attendance"><ArrowLeft className="mr-2 h-4 w-4" />Back to attendance</Link>
          </Button>
          <h2 className="mt-2 text-xl font-semibold">
            {record.checkType === "CHECK_IN" ? "Check-in" : "Check-out"} — {internName}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(record.date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        {canCorrect && (
          <Button size="sm" variant="outline" onClick={() => { setNewStatus("ACCEPTED"); setCorrectOpen(true); }}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Correct
          </Button>
        )}
      </div>

      {/* Status card */}
      <div className={`flex items-start gap-4 rounded-xl border p-5 ${
        record.status === "FLAGGED"  ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10" :
        record.status === "REJECTED" ? "border-destructive/30 bg-rose-50/50 dark:bg-rose-950/10" :
        "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10"
      }`}>
        {cfg.icon}
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{cfg.description}</p>
          {record.flagReasons && record.flagReasons.length > 0 && (
            <ul className="mt-2 space-y-1">
              {record.flagReasons.map((reason, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Record details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y px-4">
          <Row label="Intern"      value={internName} />
          <Row label="Check type"  value={record.checkType === "CHECK_IN" ? "Check-in" : "Check-out"} icon={<Clock className="h-4 w-4" />} />
          <Row label="Submitted"   value={fmt(record.submittedAt)} />
          <Row label="Within geofence" value={record.withinGeofence != null ? (record.withinGeofence ? "Yes" : "No") : "—"} icon={<MapPin className="h-4 w-4" />} />
          <Row label="Distance from office" value={record.distanceFromOffice != null ? `${record.distanceFromOffice} m` : "—"} />
          <Row label="Location accuracy" value={record.locationAccuracy != null ? `±${record.locationAccuracy} m` : "—"} icon={<Crosshair className="h-4 w-4" />} />
        </CardContent>
      </Card>

      {/* Correction info */}
      {record.correctionNote && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">HR correction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{record.correctionNote}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Corrected {fmt(record.correctedAt)}</p>
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">Created {fmt(record.createdAt)}</p>

      {/* Correction dialog */}
      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Correct attendance record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">
              Override the automated verification result. This action is logged.
            </p>
            <div className="space-y-1.5">
              <Label>New status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as AttendanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="FLAGGED">Flagged</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Correction note <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="e.g. Confirmed intern was present — GPS signal issue in the building."
                rows={3}
                className="resize-none"
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!correctionNote.trim() || correctMut.isPending}
              onClick={() => correctMut.mutate({ status: newStatus, correctionNote })}
            >
              {correctMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
