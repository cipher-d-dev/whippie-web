"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useIntern } from "@/features/interns/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { InternshipStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<
  InternshipStatus,
  "default" | "secondary" | "outline"
> = {
  SCREENED:   "outline",
  ONBOARDING: "secondary",
  ACTIVE:     "default",
  COMPLETED:  "secondary",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError } = useIntern(id);
  const intern = data?.data?.intern;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
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
      {/* Back + actions */}
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
        <Button asChild size="sm">
          <Link href={`/interns/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
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
          <Row label="Phone"    value={intern.phone} />
          <Row label="Address"  value={intern.address} />
        </CardContent>
      </Card>

      {/* Academic info */}
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
          <Row
            label="Type"
            value={intern.internshipType === "NYSC_IT" ? "NYSC IT" : "Internship"}
          />
          <Row label="Status"     value={intern.status} />
          <Row label="Start date" value={fmt(intern.startDate)} />
          <Row label="End date"   value={fmt(intern.endDate)} />
        </CardContent>
      </Card>

      {/* Placement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Placement
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Department" value={intern.department?.name} />
          <Row
            label="Supervisor"
            value={
              intern.supervisor
                ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}`
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Completion (only if completed) */}
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
    </div>
  );
}
