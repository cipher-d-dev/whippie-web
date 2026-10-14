"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useReports } from "@/features/reports/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { ReportStatus, ReportType } from "@/types";

const STATUS_CONFIG: Record<ReportStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT:     { label: "Draft",     variant: "outline"   },
  SUBMITTED: { label: "Submitted", variant: "secondary" },
  REVIEWED:  { label: "Reviewed",  variant: "default"   },
};

function getInternName(report: { intern: { _id: string; firstName: string; lastName: string } | string }): string {
  if (typeof report.intern === "string") return "—";
  return `${report.intern.firstName} ${report.intern.lastName}`;
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus | "ALL">("ALL");
  const [type,   setType]   = useState<ReportType | "ALL">("ALL");
  const [page,   setPage]   = useState(1);

  const { data, isLoading, isError } = useReports({
    page, limit: 25,
    ...(status !== "ALL" && { status }),
    ...(type   !== "ALL" && { type }),
  });

  const reports    = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const needsReview = reports.filter((r) => r.status === "SUBMITTED").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {!isLoading && `${total} report${total !== 1 ? "s" : ""}`}
            {needsReview > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {needsReview} awaiting review
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v as ReportStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v as ReportType | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reports.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No reports found</p>
          <p className="mt-1 text-xs text-muted-foreground">Intern-submitted reports will appear here.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Intern</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError  && <TableRow><TableCell colSpan={6} className="py-10 text-center text-destructive">Failed to load reports.</TableCell></TableRow>}
              {reports.map((report) => (
                <TableRow key={report._id} className={report.status === "SUBMITTED" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}>
                  <TableCell>
                    <Link href={`/reports/${report._id}`} className="font-medium hover:underline line-clamp-1">
                      {report.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getInternName(report as Parameters<typeof getInternName>[0])}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{report.type.toLowerCase()}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[report.status].variant}>{STATUS_CONFIG[report.status].label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(report.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/reports/${report._id}`}>{report.status === "SUBMITTED" ? "Review" : "View"}</Link>
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
