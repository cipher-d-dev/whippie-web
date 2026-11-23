"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useInternFace, useReviewFace } from "./hooks";
import { AuthImage } from "@/components/face/AuthImage";
import { Section } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDate } from "@/lib/utils/format";

const LABEL = { NONE: "Not taken yet", PENDING: "Waiting for your approval", APPROVED: "Approved", REJECTED: "New photo requested" } as const;

/** The intern's reference face photo on their profile (HR only). */
export function InternFacePanel({ internId }: { internId: string }) {
  const { data: face } = useInternFace(internId);
  const review = useReviewFace();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  if (!face) return null;

  return (
    <Section title="Face photo" action={<span className="text-xs text-muted-foreground">{LABEL[face.status]}</span>} bodyClassName="p-5">
      {face.status === "NONE" ? (
        <p className="text-[13px] text-muted-foreground">They&apos;ll be asked to take it in the app before checking in.</p>
      ) : (
        <div className="flex gap-4">
          <AuthImage path={`/api/v1/face/${internId}/photo`} alt="Face photo" className="aspect-[3/4] w-24 shrink-0 -scale-x-100 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2 text-[13px]">
            {face.submittedAt && <p className="text-muted-foreground">Sent {fmtDate(face.submittedAt)}</p>}
            {face.status === "REJECTED" && face.rejectionReason && <p className="text-muted-foreground">Reason: {face.rejectionReason}</p>}
            {face.status === "PENDING" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => review.mutate({ internId, action: "APPROVE" })} disabled={review.isPending}><Check /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setAsking(true)} disabled={review.isPending}><RotateCcw /> Retake</Button>
              </div>
            )}
            {face.status === "APPROVED" && !asking && (
              <Button size="sm" variant="outline" onClick={() => setAsking(true)}><RotateCcw /> Ask for a new photo</Button>
            )}
            {asking && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reason.trim()) review.mutate({ internId, action: "REJECT", reason: reason.trim() }, { onSuccess: () => { setAsking(false); setReason(""); } });
                }}
              >
                <Label htmlFor="face-reason" className="text-xs">Reason they&apos;ll see</Label>
                <Input id="face-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="h-8" />
                <div className="flex gap-2">
                  <Button size="sm" type="submit" disabled={!reason.trim() || review.isPending}>Send</Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setAsking(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
