"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { useEvaluations } from "@/features/evaluations/hooks";
import { useAuth } from "@/lib/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { EvaluationStatus } from "@/types";

function getPersonName(val: { _id: string; firstName: string; lastName: string } | string): string {
  if (typeof val === "string") return "—";
  return `${val.firstName} ${val.lastName}`;
}

function avgScore(scores: { workQuality: number; reliability: number; communication: number; learningProgress: number; professionalism: number }): string {
  const vals = Object.values(scores);
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EvaluationsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<EvaluationStatus | "ALL">("ALL");
  const [page, setPage]     = useState(1);
  const isSupervisor = user?.role === "SUPERVISOR";

  const { data, isLoading, isError } = useEvaluations({
    page, limit: 25,
    ...(status !== "ALL" && { status }),
  });

  const evaluations = data?.data ?? [];
  const total       = data?.total ?? 0;
  const totalPages  = data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Evaluations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {!isLoading && `${total} evaluation${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isSupervisor && (
          <Button asChild>
            <Link href="/evaluations/new">
              <Plus className="mr-2 h-4 w-4" />
              New evaluation
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v as EvaluationStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {evaluations.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Star className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No evaluations yet</p>
          {isSupervisor && (
            <p className="mt-1 text-xs text-muted-foreground">Create an evaluation for one of your interns.</p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intern</TableHead>
                {!isSupervisor && <TableHead>Supervisor</TableHead>}
                <TableHead>Avg. score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError   && <TableRow><TableCell colSpan={6} className="py-10 text-center text-destructive">Failed to load evaluations.</TableCell></TableRow>}
              {evaluations.map((ev) => (
                <TableRow key={ev._id}>
                  <TableCell className="font-medium">{getPersonName(ev.intern as Parameters<typeof getPersonName>[0])}</TableCell>
                  {!isSupervisor && (
                    <TableCell className="text-sm text-muted-foreground">{getPersonName(ev.supervisor as Parameters<typeof getPersonName>[0])}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">{avgScore(ev.scores)}</span>
                      <span className="text-xs text-muted-foreground">/ 5</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ev.status === "SUBMITTED" ? "default" : "outline"}>
                      {ev.status === "SUBMITTED" ? "Submitted" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(ev.submittedAt ?? ev.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/evaluations/${ev._id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
