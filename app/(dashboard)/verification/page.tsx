"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  XCircle,
  Clock,
  Chrome,
  Mail,
  Loader2,
  CheckCircle2,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { useVerificationQueue, useApproveUser, useRejectUser } from "@/features/users/hooks";
import type { PendingUser } from "@/features/users/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / 86_400_000
  );
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ─── Reject dialog ────────────────────────────────────────────────────────────

function RejectDialog({
  user,
  open,
  onClose,
}: {
  user: PendingUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const reject = useRejectUser();
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (!user || !reason.trim()) return;
    reject.mutate(
      { userId: user._id, reason: reason.trim() },
      { onSuccess: () => { setReason(""); onClose(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject account</DialogTitle>
          <DialogDescription>
            {user && `Reject ${user.firstName} ${user.lastName} (${user.email}). A rejection email will be sent with your reason.`}
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!reason.trim() || reject.isPending}
          >
            {reject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pending user card ────────────────────────────────────────────────────────

function PendingUserCard({
  user,
  onApprove,
  onReject,
  approving,
}: {
  user: PendingUser;
  onApprove: (user: PendingUser) => void;
  onReject: (user: PendingUser) => void;
  approving: boolean;
}) {
  const days = daysUntil(user.verificationExpiresAt);
  const isExpiringSoon = days <= 7;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:shadow-sm">
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {initials(user.firstName, user.lastName)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {user.role.toLowerCase()}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {user.email}
          </span>
          {user.authMethod === "GOOGLE" || user.authMethod === "BOTH" ? (
            <span className="flex items-center gap-1">
              <Chrome className="h-3 w-3" />
              Google
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fmtDate(user.createdAt)}
          </span>
        </div>
        {/* Expiry warning */}
        {isExpiringSoon && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Account expires in {days} day{days !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={approving}
          onClick={() => onApprove(user)}
        >
          {approving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onReject(user)}
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Recently approved banner ─────────────────────────────────────────────────

function ApprovedBanner({
  userId,
  name,
  onDismiss,
}: {
  userId: string;
  name: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20 px-4 py-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {name} approved
        </p>
        <p className="text-xs text-emerald-600/80 dark:text-emerald-500/70">
          Welcome email sent. Create their intern record to get them started.
        </p>
      </div>
      <Button size="sm" asChild className="shrink-0 gap-1.5">
        <Link href={`/interns/new?userId=${userId}`}>
          <UserPlus className="h-3.5 w-3.5" />
          Add intern record
        </Link>
      </Button>
      <button
        onClick={onDismiss}
        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 shrink-0"
        aria-label="Dismiss"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VerificationQueuePage() {
  const { data, isLoading, isError } = useVerificationQueue();
  const approve = useApproveUser();

  const [rejectUser_, setRejectUser] = useState<PendingUser | null>(null);
  const [recentlyApproved, setRecentlyApproved] = useState<
    { userId: string; name: string } | null
  >(null);

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleApprove = (user: PendingUser) => {
    approve.mutate(user._id, {
      onSuccess: () => {
        setRecentlyApproved({
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Verification Queue</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {!isLoading && `${total} account${total !== 1 ? "s" : ""} pending HR approval`}
        </p>
      </div>

      {/* Recently approved */}
      {recentlyApproved && (
        <ApprovedBanner
          userId={recentlyApproved.userId}
          name={recentlyApproved.name}
          onDismiss={() => setRecentlyApproved(null)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load verification queue.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500/40" />
          <p className="text-sm font-semibold">No pending accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When interns sign up, their accounts will appear here for approval.
          </p>
        </div>
      )}

      {/* Queue */}
      {!isLoading && !isError && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <PendingUserCard
              key={user._id}
              user={user}
              onApprove={handleApprove}
              onReject={setRejectUser}
              approving={approve.isPending && approve.variables === user._id}
            />
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <RejectDialog
        user={rejectUser_}
        open={!!rejectUser_}
        onClose={() => setRejectUser(null)}
      />
    </div>
  );
}
