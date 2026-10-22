"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, X, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

const STATUS_VARIANT: Record<InternshipStatus, "default" | "secondary" | "outline"> = {
  SCREENED:   "outline",
  ONBOARDING: "secondary",
  ACTIVE:     "default",
  COMPLETED:  "secondary",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

// ─── Assignment row with change/remove controls ───────────────────────────────

function AssignmentRow({
  label,
  current,
  onAssign,
  onRemove,
  isPendingAssign,
  isPendingRemove,
  children,
}: {
  label: string;
  current?: string | null;
  onAssign: () => void;
  onRemove: () => void;
  isPendingAssign: boolean;
  isPendingRemove: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{current ?? "Not assigned"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {children}
        <Button
          variant="outline"
          size="sm"
          onClick={onAssign}
          disabled={isPendingAssign || isPendingRemove}
          className="h-7 gap-1.5 text-xs"
        >
          {isPendingAssign
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <ChevronsUpDown className="h-3 w-3" />}
          {current ? "Change" : "Assign"}
        </Button>
        {current && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isPendingRemove || isPendingAssign}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${label}`}
          >
            {isPendingRemove
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <X className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError } = useIntern(id);
  const intern = data?.data?.intern;

  // Assignment dialog state
  const [deptDialogOpen, setDeptDialogOpen]       = useState(false);
  const [supervisorDialogOpen, setSvDialogOpen]   = useState(false);
  const [editSheetOpen, setEditSheetOpen]         = useState(false);
  const [selectedDept, setSelectedDept]           = useState("");
  const [selectedSv, setSelectedSv]               = useState("");

  // Data for selects
  const { data: deptData }  = useDepartments({ limit: 100 });
  const { data: svData }    = useSupervisors({ limit: 100 });
  const departments         = deptData?.data ?? [];
  const supervisors         = svData?.data ?? [];

  // Mutations
  const assignDept    = useAssignDepartment(id);
  const removeDept    = useRemoveDepartment(id);
  const assignSv      = useAssignSupervisor(id);
  const removeSv      = useRemoveSupervisor(id);

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
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isError || !intern) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-destructive">Could not load intern record.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/interns">Back to interns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/interns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to interns
            </Link>
          </Button>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold">
              {intern.firstName} {intern.lastName}
            </h2>
            <Badge variant={STATUS_VARIANT[intern.status]}>{intern.status}</Badge>
          </div>
        </div>
        <Button size="sm" onClick={() => setEditSheetOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Personal info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Personal information
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Full name" value={`${intern.firstName} ${intern.lastName}`} />
          <Row label="Phone"     value={intern.phone} />
          <Row label="Address"   value={intern.address} />
        </CardContent>
      </Card>

      {/* Academic */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Academic information
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Institution" value={intern.institution} />
          <Row label="Course"      value={intern.course} />
          <Row label="Level"       value={intern.level} />
        </CardContent>
      </Card>

      {/* Internship details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Internship details
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Type"       value={intern.internshipType === "NYSC_IT" ? "NYSC IT" : "Internship"} />
          <Row label="Status"     value={intern.status} />
          <Row label="Start date" value={fmt(intern.startDate)} />
          <Row label="End date"   value={fmt(intern.endDate)} />
        </CardContent>
      </Card>

      {/* Placement (with live assignment controls) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Placement
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <AssignmentRow
            label="Department"
            current={intern.department?.name}
            onAssign={() => { setSelectedDept(intern.department?._id ?? ""); setDeptDialogOpen(true); }}
            onRemove={() => removeDept.mutate()}
            isPendingAssign={assignDept.isPending}
            isPendingRemove={removeDept.isPending}
          />
          <AssignmentRow
            label="Supervisor"
            current={intern.supervisor ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}` : null}
            onAssign={() => { setSelectedSv(intern.supervisor?._id ?? ""); setSvDialogOpen(true); }}
            onRemove={() => removeSv.mutate()}
            isPendingAssign={assignSv.isPending}
            isPendingRemove={removeSv.isPending}
          />
        </CardContent>
      </Card>

      {/* Completion */}
      {intern.completedAt && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Row label="Completed on" value={fmt(intern.completedAt)} />
            <Row label="Note"         value={intern.completionNote} />
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">
        Record created {fmt(intern.createdAt)} · Last updated {fmt(intern.updatedAt)}
      </p>

      {/* Assign department dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign department</DialogTitle>
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
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign supervisor dialog */}
      <Dialog open={supervisorDialogOpen} onOpenChange={setSvDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign supervisor</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedSv} onValueChange={setSelectedSv}>
              <SelectTrigger>
                <SelectValue placeholder="Select a supervisor" />
              </SelectTrigger>
              <SelectContent>
                {supervisors.filter((s) => s.isActive).map((s) => (
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
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-over quick edit */}
      <EditInternSheet
        intern={intern}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />
    </div>
  );
}
