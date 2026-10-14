"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useInterns } from "@/features/interns/hooks";
import { useChecklist } from "@/features/documents/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChecklistItem, DocumentStatus } from "@/types";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<DocumentStatus | "MISSING", React.ReactNode> = {
  PENDING:           <Clock       className="h-4 w-4 text-amber-500" />,
  DIGITAL_RECEIVED:  <AlertCircle className="h-4 w-4 text-blue-500" />,
  PHYSICAL_RECEIVED: <AlertCircle className="h-4 w-4 text-blue-500" />,
  VERIFIED:          <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  REJECTED:          <XCircle     className="h-4 w-4 text-destructive" />,
  MISSING:           <Clock       className="h-4 w-4 text-muted-foreground/50" />,
};

const STATUS_LABEL: Record<DocumentStatus | "MISSING", string> = {
  PENDING:           "Pending",
  DIGITAL_RECEIVED:  "Uploaded — awaiting review",
  PHYSICAL_RECEIVED: "Physical received — awaiting review",
  VERIFIED:          "Verified",
  REJECTED:          "Rejected",
  MISSING:           "Not submitted",
};

function progressColor(pct: number) {
  if (pct === 100) return "bg-emerald-500";
  if (pct >= 60)   return "bg-blue-500";
  if (pct >= 30)   return "bg-amber-500";
  return "bg-rose-500";
}

// ─── Per-intern checklist row ─────────────────────────────────────────────────

function InternChecklistRow({ internId, name }: { internId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useChecklist(internId);
  const checklist: ChecklistItem[] = data?.data?.checklist ?? [];

  const required  = checklist.filter((c) => c.requirement.isRequired);
  const verified  = required.filter((c) => c.document?.status === "VERIFIED").length;
  const total     = required.length;
  const pct       = total > 0 ? Math.round((verified / total) * 100) : 0;
  const hasIssues = checklist.some(
    (c) => c.document?.status === "REJECTED"
  );

  return (
    <Card className={`transition-shadow hover:shadow-sm ${hasIssues ? "border-destructive/40" : ""}`}>
      {/* Summary row */}
      <CardHeader className="p-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-4 p-4 text-left"
          aria-expanded={open}
        >
          {/* Name + link */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/interns/${internId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold hover:underline"
              >
                {name}
              </Link>
              {hasIssues && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Action needed
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            {!isLoading && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {verified}/{total} required
                </span>
              </div>
            )}
          </div>

          {/* Badge + chevron */}
          <div className="flex shrink-0 items-center gap-2">
            <span className={`text-sm font-semibold tabular-nums ${pct === 100 ? "text-emerald-600" : "text-muted-foreground"}`}>
              {pct}%
            </span>
            {open
              ? <ChevronUp   className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CardHeader>

      {/* Expanded checklist */}
      {open && (
        <CardContent className="border-t pt-3 pb-4 px-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No document requirements configured.</p>
          ) : (
            <ul className="space-y-2">
              {checklist.map((item) => {
                const statusKey = (item.document?.status ?? "MISSING") as DocumentStatus | "MISSING";
                return (
                  <li key={item.requirement._id} className="flex items-center gap-3">
                    <span className="shrink-0">{STATUS_ICON[statusKey]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{item.requirement.label}</span>
                        {item.requirement.isRequired && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Required</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{STATUS_LABEL[statusKey]}</p>
                    </div>
                    {item.document && (
                      <Button variant="ghost" size="sm" asChild className="shrink-0 h-7 text-xs">
                        <Link href={`/documents/${item.document._id}`}>Review</Link>
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data, isLoading } = useInterns({ status: "ONBOARDING", limit: 50 });
  const interns = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Onboarding</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Document completion status for all interns currently onboarding
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/documents">
            <FileText className="mr-2 h-4 w-4" />
            All documents
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : interns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No interns currently onboarding</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Interns with status ONBOARDING will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interns.map((intern) => (
            <InternChecklistRow
              key={intern._id}
              internId={intern._id}
              name={`${intern.firstName} ${intern.lastName}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
