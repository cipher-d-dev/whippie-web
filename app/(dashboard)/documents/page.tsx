"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Upload,
} from "lucide-react";
import { useDocuments } from "@/features/documents/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DocumentStatus, DocumentType } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING:           { label: "Pending",           icon: <Clock        className="h-3 w-3" />, variant: "outline"     },
  DIGITAL_RECEIVED:  { label: "Uploaded",           icon: <Upload       className="h-3 w-3" />, variant: "secondary"   },
  PHYSICAL_RECEIVED: { label: "Physical received",  icon: <AlertCircle  className="h-3 w-3" />, variant: "secondary"   },
  VERIFIED:          { label: "Verified",           icon: <CheckCircle2 className="h-3 w-3" />, variant: "default"     },
  REJECTED:          { label: "Rejected",           icon: <XCircle      className="h-3 w-3" />, variant: "destructive" },
};

const TYPE_LABELS: Record<DocumentType, string> = {
  ACCEPTANCE_LETTER: "Acceptance Letter",
  GUARANTOR_FORM:    "Guarantor Form",
  IDENTIFICATION:    "Identification",
  SCHOOL_LETTER:     "School Letter",
  NYSC_CALL_UP:      "NYSC Call-Up",
  REPORT:            "Report",
  EVALUATION:        "Evaluation",
  EXIT_DOCUMENT:     "Exit Document",
  OTHER:             "Other",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInternName(doc: { intern: { _id: string; firstName: string; lastName: string } | string }): string {
  if (typeof doc.intern === "string") return doc.intern;
  return `${doc.intern.firstName} ${doc.intern.lastName}`;
}

function getRequirementLabel(doc: { requirement: { _id: string; label: string; type: DocumentType } | string }): string {
  if (typeof doc.requirement === "string") return "—";
  return doc.requirement.label;
}

const PAGE_SIZE = 25;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [status, setStatus] = useState<DocumentStatus | "ALL">("ALL");
  const [type, setType]     = useState<DocumentType | "ALL">("ALL");
  const [page, setPage]     = useState(1);

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(status !== "ALL" && { status }),
    ...(type   !== "ALL" && { type }),
  };

  const { data, isLoading, isError } = useDocuments(params);
  const documents  = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total      = data?.total ?? 0;

  // Needs-attention count
  const needsReview = documents.filter(
    (d) => d.status === "DIGITAL_RECEIVED" || d.status === "PHYSICAL_RECEIVED"
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {!isLoading && `${total} record${total !== 1 ? "s" : ""}`}
            {needsReview > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {needsReview} awaiting review
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/onboarding">View by intern</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={status}
          onValueChange={(v) => { setStatus(v as DocumentStatus | "ALL"); setPage(1); }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(Object.keys(STATUS_CONFIG) as DocumentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={(v) => { setType(v as DocumentType | "ALL"); setPage(1); }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {(Object.keys(TYPE_LABELS) as DocumentType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Intern</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-destructive">Failed to load documents.</TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No documents found.</TableCell>
              </TableRow>
            )}
            {documents.map((doc) => {
              const cfg = STATUS_CONFIG[doc.status];
              const needsAction = doc.status === "DIGITAL_RECEIVED" || doc.status === "PHYSICAL_RECEIVED";
              return (
                <TableRow key={doc._id} className={needsAction ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}>
                  <TableCell className="font-medium">{getInternName(doc as Parameters<typeof getInternName>[0])}</TableCell>
                  <TableCell className="text-sm">{getRequirementLabel(doc as Parameters<typeof getRequirementLabel>[0])}</TableCell>
                  <TableCell>
                    <Badge variant={cfg.variant} className="inline-flex items-center gap-1.5">
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(doc.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/documents/${doc._id}`}>
                        {needsAction ? "Review" : "View"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
