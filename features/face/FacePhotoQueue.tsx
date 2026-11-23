"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, ScanFace } from "lucide-react";
import { useFacePhotos, useReviewFace } from "./hooks";
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
  const { data, isLoading } = useFacePhotos("PENDING");
  const review = useReviewFace();
  const [retake, setRetake] = useState<FacePhotoRow | null>(null);
  const [reason, setReason] = useState("");
  const rows = data ?? [];

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}</div>;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
        <ScanFace className="h-7 w-7 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No face photos waiting</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">When an intern sends their face photo for check-in, it appears here for you to approve.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Approve the photo if it&apos;s clearly the person you met. Their check-in selfies are matched to it from then on.
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
                  <p className="text-xs text-muted-foreground">Sent {fmtDate(r.submittedAt)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setRetake(r); setReason(""); }} disabled={review.isPending}>
                    <RotateCcw /> Retake
                  </Button>
                  <Button size="sm" onClick={() => review.mutate({ internId: r.internId, action: "APPROVE" })} disabled={review.isPending}>
                    <Check /> Approve
                  </Button>
                </div>
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
