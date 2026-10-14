"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Inbox,
  Download,
  Loader2,
} from "lucide-react";
import { useDocument, useMarkPhysical, useReviewDocument } from "@/features/documents/hooks";
import { getDownloadUrl } from "@/features/documents/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DocumentStatus, DocumentType } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STEPS: DocumentStatus[] = [
  "PENDING",
  "DIGITAL_RECEIVED",
  "VERIFIED",
];

const STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING:           "Pending",
  DIGITAL_RECEIVED:  "Uploaded",
  PHYSICAL_RECEIVED: "Physical received",
  VERIFIED:          "Verified",
  REJECTED:          "Rejected",
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
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
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

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ current }: { current: DocumentStatus }) {
  const isRejected = current === "REJECTED";
  const isPhysical = current === "PHYSICAL_RECEIVED";

  const steps = isPhysical
    ? (["PENDING", "PHYSICAL_RECEIVED", "VERIFIED"] as DocumentStatus[])
    : STATUS_STEPS;

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone    = current === "VERIFIED" || (i < steps.indexOf(current));
        const isCurrent = step === current && !isRejected;
        const isLast    = i === steps.length - 1;

        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  isDone || isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                }`}
              >
                {isDone && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {STATUS_LABELS[step]}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div
                className={`mx-1 mb-4 h-0.5 w-12 sm:w-20 transition-colors ${
                  isDone ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}

      {/* Rejected indicator */}
      {isRejected && (
        <div className="ml-4 flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-destructive">Rejected</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useDocument(id);
  const doc = data?.data?.document;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [physicalOpen, setPhysicalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [physicalNotes, setPhysicalNotes] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");

  const markPhysicalMut = useMarkPhysical(id, () => setPhysicalOpen(false));
  const reviewMut       = useReviewDocument(id, () => { setRejectOpen(false); setVerifyOpen(false); });

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>;
  }

  if (isError || !doc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-destructive">Document not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/documents">Back to documents</Link>
        </Button>
      </div>
    );
  }

  const requirement = typeof doc.requirement === "string" ? null : doc.requirement;
  const intern      = typeof doc.intern      === "string" ? null : doc.intern;
  const reviewer    = typeof doc.reviewedBy  === "string" ? null : doc.reviewedBy;

  const canMarkPhysical = doc.status === "PENDING";
  const canReview       = doc.status === "DIGITAL_RECEIVED" || doc.status === "PHYSICAL_RECEIVED";
  const hasFile         = !!doc.originalFilename;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to documents
          </Link>
        </Button>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {requirement ? requirement.label : "Document"}
            </h2>
            {intern && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {intern.firstName} {intern.lastName}
              </p>
            )}
          </div>
          <Badge
            variant={
              doc.status === "VERIFIED"   ? "default"     :
              doc.status === "REJECTED"   ? "destructive" :
              doc.status === "PENDING"    ? "outline"     : "secondary"
            }
          >
            {STATUS_LABELS[doc.status]}
          </Badge>
        </div>
      </div>

      {/* Status timeline */}
      <Card>
        <CardContent className="flex justify-center overflow-x-auto pt-6 pb-5">
          <StatusTimeline current={doc.status} />
        </CardContent>
      </Card>

      {/* Document info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Document details
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Type"        value={requirement ? TYPE_LABELS[requirement.type] : "—"} />
          <Row label="Intern"      value={intern ? `${intern.firstName} ${intern.lastName}` : "—"} />
          <Row label="Required"    value={requirement?.isRequired ? "Yes" : "No"} />
          <Row label="Uploaded"    value={doc.originalFilename} />
          <Row label="File size"   value={doc.fileSizeBytes ? `${Math.round(doc.fileSizeBytes / 1024)} KB` : "—"} />
          <Row label="Reviewed by" value={reviewer ? `${reviewer.firstName ?? ""} ${reviewer.lastName ?? ""}`.trim() || "—" : "—"} />
          <Row label="Reviewed at" value={fmt(doc.reviewedAt)} />
          {doc.notes && <Row label="Notes" value={doc.notes} />}
          {doc.rejectionReason && (
            <div className="py-2">
              <span className="text-sm text-muted-foreground">Rejection reason</span>
              <p className="mt-1 rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {doc.rejectionReason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {(hasFile || canMarkPhysical || canReview) && (
        <div className="flex flex-wrap gap-3">
          {hasFile && (
            <Button variant="outline" asChild>
              <a href={getDownloadUrl(id)} download>
                <Download className="mr-2 h-4 w-4" />
                Download file
              </a>
            </Button>
          )}

          {canMarkPhysical && (
            <Button variant="outline" onClick={() => setPhysicalOpen(true)}>
              <Inbox className="mr-2 h-4 w-4" />
              Mark physical received
            </Button>
          )}

          {canReview && (
            <>
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setVerifyOpen(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verify
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">
        Created {fmt(doc.createdAt)} · Last updated {fmt(doc.updatedAt)}
      </p>

      {/* Verify dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Verify document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Confirm that the document is valid and meets requirements.
            </p>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Checked and filed."
                rows={2}
                className="resize-none"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={reviewMut.isPending}
              onClick={() => reviewMut.mutate({ status: "VERIFIED", notes: verifyNotes || undefined })}
            >
              {reviewMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              The intern will be notified and asked to resubmit.
            </p>
            <div className="space-y-1.5">
              <Label>Reason for rejection</Label>
              <Textarea
                placeholder="e.g. Signature missing on page 2."
                rows={3}
                className="resize-none"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full"
              disabled={reviewMut.isPending}
              onClick={() =>
                reviewMut.mutate({
                  status: "REJECTED",
                  rejectionReason: rejectionReason || undefined,
                })
              }
            >
              {reviewMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Physical received dialog */}
      <Dialog open={physicalOpen} onOpenChange={setPhysicalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark physical document received</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Confirm that the physical copy has been handed to HR.
            </p>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Original handed in — copy filed."
                rows={2}
                className="resize-none"
                value={physicalNotes}
                onChange={(e) => setPhysicalNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={markPhysicalMut.isPending}
              onClick={() => markPhysicalMut.mutate(physicalNotes || undefined)}
            >
              {markPhysicalMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
