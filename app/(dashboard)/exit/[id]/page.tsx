"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Send, Loader2, DoorOpen } from "lucide-react";
import { useIntern } from "@/features/interns/hooks";
import { useExitChecklist, useCompleteInternship } from "@/features/exit/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: internData, isLoading: internLoading } = useIntern(id);
  const { data: checklistData, isLoading: checklistLoading } = useExitChecklist(id);

  const intern    = internData?.data?.intern;
  const checklist = checklistData?.data?.checklist;

  const [completeOpen, setCompleteOpen] = useState(false);
  const [note, setNote]                 = useState("");

  const completeMut = useCompleteInternship(id, () => setCompleteOpen(false));

  const isLoading  = internLoading || checklistLoading;
  const days       = daysUntil(intern?.endDate);
  const isCompleted = intern?.status === "COMPLETED";

  if (isLoading) return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  if (!intern) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-sm text-destructive">Intern not found.</p>
      <Button variant="outline" size="sm" asChild><Link href="/exit">Back</Link></Button>
    </div>
  );

  const passedAll  = checklist?.canComplete ?? false;
  const items      = checklist?.items ?? [];
  const passCount  = items.filter((i) => i.passed).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/exit"><ArrowLeft className="mr-2 h-4 w-4" />Back to exit list</Link>
          </Button>
          <h2 className="mt-2 text-xl font-semibold">{intern.firstName} {intern.lastName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={
              intern.status === "ACTIVE"     ? "default"    :
              intern.status === "COMPLETED"  ? "secondary"  : "outline"
            }>
              {intern.status}
            </Badge>
            {days !== null && !isCompleted && (
              <Badge variant={days < 0 ? "destructive" : days <= 14 ? "secondary" : "outline"}>
                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
              </Badge>
            )}
          </div>
        </div>

        {!isCompleted && passedAll && (
          <Button
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setCompleteOpen(true)}
          >
            <DoorOpen className="mr-2 h-4 w-4" />
            Complete internship
          </Button>
        )}
      </div>

      {/* Intern summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Internship summary</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {[
            ["Institution",  intern.institution],
            ["Course",       intern.course],
            ["Type",         intern.internshipType === "NYSC_IT" ? "NYSC IT" : "Internship"],
            ["Start date",   fmt(intern.startDate)],
            ["End date",     fmt(intern.endDate)],
            ["Department",   intern.department?.name],
            ["Supervisor",   intern.supervisor && typeof intern.supervisor !== "string"
              ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}`
              : undefined],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-2 gap-2 py-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value ?? "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Exit checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Exit checklist
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {passedAll
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <AlertCircle  className="h-4 w-4 text-amber-500"   />}
              <span className="text-sm font-semibold">
                {passCount}/{items.length} passed
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {isCompleted ? "Internship already completed." : "Checklist unavailable."}
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    item.passed
                      ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                      : "bg-rose-50/50 dark:bg-rose-950/10 border border-destructive/10"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {item.passed
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <XCircle      className="h-4 w-4 text-destructive"  />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Cannot complete warning */}
          {!passedAll && items.length > 0 && !isCompleted && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-2.5 dark:bg-amber-950/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Resolve all outstanding checklist items before completing this internship.
              </p>
            </div>
          )}

          {/* Already completed */}
          {isCompleted && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 py-2.5 dark:bg-emerald-950/20">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                <p className="font-medium">Internship completed on {fmt(intern.completedAt)}</p>
                {intern.completionNote && <p className="mt-0.5">{intern.completionNote}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">Record last updated {fmt(intern.updatedAt)}</p>

      {/* Complete dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete internship — {intern.firstName} {intern.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 px-4 py-3 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                All checklist items passed — ready to complete
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This action is permanent. The intern status will be set to{" "}
              <strong>COMPLETED</strong> and an audit log entry will be created.
            </p>
            <div className="space-y-1.5">
              <Label>Completion note (optional)</Label>
              <Textarea
                placeholder="e.g. Excellent performance throughout the internship. Highly recommended."
                rows={3}
                className="resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={completeMut.isPending}
              onClick={() => completeMut.mutate(note || undefined)}
            >
              {completeMut.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Send    className="mr-2 h-4 w-4" />}
              Confirm completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
