"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFacePhotos, useMissingFaces, useReviewFace } from "./hooks";
import type { FacePhotoRow } from "./api";
import { AuthImage } from "@/components/face/AuthImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate } from "@/lib/utils/format";

const REASONS = ["Face is too dark", "Face is blurred", "Not the same person we met", "Wearing a cap or sunglasses"];

/** Face photos waiting for HR. Approve, or ask for a retake with a reason. */
export function FacePhotoQueue() {
  const [view, setView] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const { data, isLoading, isError, error, refetch, isFetching } = useFacePhotos(view);
  const { data: missing } = useMissingFaces();
  const review = useReviewFace();
  const [retake, setRetake] = useState<FacePhotoRow | null>(null);
  const [reason, setReason] = useState("");
  const rows = data ?? [];

  const filter = (
    <div role="tablist" aria-label="Which photos" className="flex w-fit rounded-lg border bg-card p-0.5 text-[13px] font-medium">
      {([["PENDING", "Waiting"], ["APPROVED", "Approved"], ["REJECTED", "Retake asked"]] as const).map(([k, label]) => (
        <button
          key={k}
          role="tab"
          aria-selected={view === k}
          onClick={() => setView(k)}
          className={cn("h-8 rounded-md px-3", view === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (isError) {
    return (
      <>
        {filter}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
          <span>Couldn&apos;t load face photos{error?.message ? `: ${error.message}` : "."}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>Try again</Button>
        </div>
      </>
    );
  }

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}</div>;

  const missingList = missing && missing.length > 0 && (
    <details className="rounded-xl border bg-card">
      <summary className="cursor-pointer px-5 py-3.5 text-sm font-medium">
        {missing.length} intern{missing.length === 1 ? " hasn't" : "s haven't"} sent a face photo yet
      </summary>
      <ul className="divide-y border-t">
        {missing.map((m) => (
          <li key={m._id} className="flex items-center justify-between px-5 py-2.5 text-sm">
            <Link href={`/interns/${m._id}`} className="hover:underline">{m.firstName} {m.lastName}</Link>
            <span className="text-xs text-muted-foreground">{m.department?.name ?? ""}</span>
          </li>
        ))}
      </ul>
      <p className="border-t px-5 py-2.5 text-xs text-muted-foreground">They&apos;re asked for it the next time they open the app.</p>
    </details>
  );

  if (rows.length === 0) {
    return (
      <>
      {filter}
      {missingList}
      <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
        <ScanFace className="h-7 w-7 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">{view === "PENDING" ? "No face photos waiting" : view === "APPROVED" ? "No approved face photos yet" : "No retakes asked for"}</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">When an intern sends their face photo for check-in, it appears here for you to approve.</p>
      </div>
      </>
    );
  }

  return (
    <>
      {filter}
      {missingList}
      <p className="text-sm text-muted-foreground">
        {view !== "PENDING" ? (view === "APPROVED" ? "Check-in selfies are matched to these photos. Ask for a retake if one isn't right." : "These interns were asked for a new photo and haven't sent one yet.") : <>Approve the photo if it&apos;s clearly the person you met. Their check-in selfies are matched to it from then on.</>}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const name = r.intern ? `${r.intern.firstName} ${r.intern.lastName}` : "Intern";
          return (
            <li key={r.internId} className="overflow-hidden rounded-xl border bg-card">
              <AuthImage path={`/api/v1/face/${r.internId}/photo`} alt={`Face photo of ${name}`} className="aspect-[4/5] w-full -scale-x-100" />
              <div className="space-y-3 p-4">
                <div>
                  <Link href={`/interns/${r.internId}`} className="font-medium hover:underline">{name}</Link>
                  <p className="text-xs text-muted-foreground">
                    Sent {fmtDate(r.submittedAt)}
                    {r.status === "APPROVED" && r.reviewedAt && ` · approved ${fmtDate(r.reviewedAt)}`}
                  </p>
                  {r.status === "REJECTED" && r.rejectionReason && <p className="mt-1 text-xs text-warning-foreground">Asked: {r.rejectionReason}</p>}
                </div>
                {r.status !== "REJECTED" && (
                <div className={cn("grid gap-2", r.status === "PENDING" ? "grid-cols-2" : "grid-cols-1")}>
                  <Button variant="outline" size="sm" onClick={() => { setRetake(r); setReason(""); }} disabled={review.isPending}>
                    <RotateCcw /> Retake
                  </Button>
                  {r.status === "PENDING" && (
                  <Button size="sm" onClick={() => review.mutate({ internId: r.internId, action: "APPROVE" })} disabled={review.isPending}>
                    <Check /> Approve
                  </Button>
                  )}
                </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!retake} onOpenChange={(o) => !o && setRetake(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask for a new photo</DialogTitle>
            <DialogDescription>They&apos;ll see your reason and must retake it before they can check in.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (retake && reason.trim()) review.mutate({ internId: retake.internId, action: "REJECT", reason: reason.trim() }, { onSuccess: () => setRetake(null) });
            }}
          >
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full border px-3 py-1 text-xs hover:bg-muted">{r}</button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="retake-reason">Reason</Label>
              <Input id="retake-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!reason.trim() || review.isPending}>Send</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
