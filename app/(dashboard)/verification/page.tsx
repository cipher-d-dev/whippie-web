"use client";

import { FacePhotoQueue } from "@/features/face/FacePhotoQueue";
import { useFacePhotos } from "@/features/face/hooks";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Loader2, UserPlus, X } from "lucide-react";
import { useVerificationQueue, useApproveUser, useRejectUser, useUnlinkedInternUsers } from "@/features/users/hooks";
import type { PendingUser } from "@/features/users/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { fmtDate, fmtWhen } from "@/lib/utils/format";

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

const METHOD_LABEL: Record<string, string> = { PASSWORD: "Email & password", GOOGLE: "Google", BOTH: "Google and password" };

// ─── Reject dialog ────────────────────────────────────────────────────────────

function RejectDialog({ user, open, onClose, onDone }: { user: PendingUser | null; open: boolean; onClose: () => void; onDone: () => void }) {
  const reject = useRejectUser();
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (!user || !reason.trim()) return;
    reject.mutate(
      { userId: user._id, reason: reason.trim() },
      { onSuccess: () => { setReason(""); onClose(); onDone(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {user ? `${user.firstName} ${user.lastName}` : "account"}?</DialogTitle>
          <DialogDescription>
            {user && `We'll email ${user.email} with the reason you give below.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="e.g. Not a screened DAAR Communications intern"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject} disabled={!reason.trim() || reject.isPending}>
            {reject.isPending && <Loader2 className="animate-spin" />}
            Reject account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function Detail({
  user,
  onApprove,
  onReject,
  approving,
}: {
  user: PendingUser;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}) {
  const days = daysUntil(user.verificationExpiresAt);
  const fields = [
    { k: "Signed up", v: fmtDate(user.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
    { k: "Sign-in method", v: METHOD_LABEL[user.authMethod] ?? user.authMethod },
    { k: "Requested role", v: user.role.charAt(0) + user.role.slice(1).toLowerCase() },
  ];

  return (
    <section aria-label="Applicant" className="flex flex-col rounded-xl border">
      <div className="flex flex-wrap items-center gap-4 border-b p-6">
        <PersonAvatar firstName={user.firstName} lastName={user.lastName} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold tracking-[-0.02em]">{user.firstName} {user.lastName}</p>
          <p className="truncate text-sm text-secondary-foreground">{user.email}</p>
        </div>
        <Badge variant="warning">Awaiting HR</Badge>
      </div>

      <dl className="grid gap-x-6 px-6 py-2 sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.k} className="border-b py-3.5 last:border-b-0 sm:border-b-0">
            <dt className="text-xs text-muted-foreground">{f.k}</dt>
            <dd className="mt-1 text-sm font-medium">{f.v}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2 px-6">
        <p className="flex items-center gap-2.5 rounded-lg bg-success-soft px-4 py-3 text-[13px] text-success-foreground">
          <Check className="h-4 w-4 shrink-0" /> Email confirmed
        </p>
        {days <= 7 && (
          <p className="rounded-lg bg-warning-soft px-4 py-3 text-[13px] text-warning-foreground">
            This sign-up expires in {days} day{days === 1 ? "" : "s"} if you don&apos;t act on it.
          </p>
        )}
        <p className="pt-1 text-[13px] text-muted-foreground">
          Check the name and email belong to someone you expect. Internship type, institution, department and supervisor are added when you create their intern record.
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 p-6">
        <Button variant="outline" className="text-danger-foreground" onClick={onReject}>
          Reject…
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Sends a welcome email</span>
          <Button onClick={onApprove} disabled={approving}>
            {approving ? <Loader2 className="animate-spin" /> : <Check />}
            Approve
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerificationQueuePage() {
  const { data, isLoading, isError, refetch } = useVerificationQueue();
  const { data: unlinkedData } = useUnlinkedInternUsers();
  const approve = useApproveUser();

  const [tab, setTab] = useState<"pending" | "onboarding" | "face">("pending");
  const { data: facePending } = useFacePhotos("PENDING");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "face" || t === "onboarding") setTab(t);
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingUser | null>(null);
  const [recentlyApproved, setRecentlyApproved] = useState<{ userId: string; name: string } | null>(null);

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const unlinked = unlinkedData?.data?.users ?? [];
  const selected = users.find((u) => u._id === selectedId) ?? users[0] ?? null;

  // Keep a valid selection as the queue changes
  useEffect(() => {
    if (!selectedId && users[0]) setSelectedId(users[0]._id);
  }, [selectedId, users]);

  const nextAfter = (id: string) => {
    const i = users.findIndex((u) => u._id === id);
    return users[i + 1]?._id ?? users[i - 1]?._id ?? null;
  };

  const handleApprove = (user: PendingUser) => {
    approve.mutate(user._id, {
      onSuccess: () => {
        setRecentlyApproved({ userId: user._id, name: `${user.firstName} ${user.lastName}` });
        setSelectedId(nextAfter(user._id));
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="New sign-ups who have confirmed their email. Check the name and email match someone you expect, then approve."
        actions={
          <div role="tablist" aria-label="Accounts" className="flex rounded-lg bg-muted p-1 text-[13px] font-medium">
            {([["pending", `Pending · ${total}`], ["onboarding", `Approved, not set up · ${unlinked.length}`], ["face", `Face photos · ${facePending?.length ?? 0}`]] as const).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn("h-8 rounded-md px-3 transition-colors", tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {recentlyApproved && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <div className="min-w-0 flex-1 text-sm text-success-foreground">
            <span className="font-medium">{recentlyApproved.name} approved.</span> Welcome email sent. Create their intern record to get them started.
          </div>
          <Button size="sm" asChild>
            <Link href={`/interns/new?userId=${recentlyApproved.userId}`}><UserPlus /> Add intern record</Link>
          </Button>
          <button onClick={() => setRecentlyApproved(null)} aria-label="Dismiss" className="flex h-8 w-8 items-center justify-center rounded-lg text-success-foreground hover:bg-success/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {tab === "face" ? (
        <div className="space-y-4"><FacePhotoQueue /></div>
      ) : tab === "pending" ? (
        isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(300px,1fr)_2fr]">
            <Skeleton className="h-[420px] rounded-xl" />
            <Skeleton className="h-[420px] rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger-foreground">
            Couldn&apos;t load the verification queue.
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-success" />
            <p className="text-sm font-medium">No one is waiting for approval</p>
            <p className="mt-1 text-xs text-muted-foreground">New sign-ups appear here after they confirm their email.</p>
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,1fr)_2fr]">
            <ul className="overflow-hidden rounded-xl border" aria-label="Pending accounts">
              {users.map((u, i) => {
                const active = selected?._id === u._id;
                return (
                  <li key={u._id} className={cn(i > 0 && "border-t")}>
                    <button
                      onClick={() => setSelectedId(u._id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                        active ? "bg-accent/60 shadow-[inset_3px_0_0_hsl(var(--primary))]" : "hover:bg-muted/50"
                      )}
                    >
                      <PersonAvatar firstName={u.firstName} lastName={u.lastName} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{u.firstName} {u.lastName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground tabular">{fmtWhen(u.createdAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selected && (
              <Detail
                user={selected}
                approving={approve.isPending && approve.variables === selected._id}
                onApprove={() => handleApprove(selected)}
                onReject={() => setRejecting(selected)}
              />
            )}
          </div>
        )
      ) : unlinked.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">Everyone approved has an intern record</p>
          <p className="mt-1 text-xs text-muted-foreground">Approved accounts without a record show up here.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border">
          {unlinked.map((u, i) => (
            <li key={u._id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", i > 0 && "border-t")}>
              <PersonAvatar firstName={u.firstName} lastName={u.lastName} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{u.firstName} {u.lastName}</span>
                <span className="block truncate text-xs text-muted-foreground">{u.email} · approved {fmtDate(u.updatedAt)}</span>
              </span>
              <Button size="sm" asChild>
                <Link href={`/interns/new?userId=${u._id}`}><UserPlus /> Create intern record</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <RejectDialog
        user={rejecting}
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        onDone={() => rejecting && setSelectedId(nextAfter(rejecting._id))}
      />
    </div>
  );
}
