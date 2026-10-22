"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getVerificationQueue,
  approveUser,
  rejectUser,
  listUsers,
} from "./api";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const VERIFICATION_QUEUE_KEY = ["users", "verification-queue"] as const;

// ─── useVerificationQueue ─────────────────────────────────────────────────────

export function useVerificationQueue(page = 1, limit = 25) {
  return useQuery({
    queryKey: [...VERIFICATION_QUEUE_KEY, page, limit],
    queryFn: () => getVerificationQueue({ page, limit }),
    staleTime: 30 * 1000,
  });
}

// ─── usePendingCount ──────────────────────────────────────────────────────────
// Lightweight — just fetches total count for the sidebar badge

export function usePendingCount() {
  return useQuery({
    queryKey: ["users", "pending-count"],
    queryFn: async () => {
      const res = await getVerificationQueue({ limit: 1 });
      return res.total;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ─── useApproveUser ───────────────────────────────────────────────────────────

export function useApproveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => approveUser(userId),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: VERIFICATION_QUEUE_KEY });
      qc.invalidateQueries({ queryKey: ["users", "pending-count"] });
      qc.invalidateQueries({ queryKey: ["interns"] });
      toast.success("Account approved. Welcome email sent.");
      // Return the userId so the page can offer "Add intern record"
      return userId;
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Failed to approve account.";
      toast.error(msg);
    },
  });
}

// ─── useRejectUser ────────────────────────────────────────────────────────────

export function useRejectUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      rejectUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERIFICATION_QUEUE_KEY });
      qc.invalidateQueries({ queryKey: ["users", "pending-count"] });
      toast.success("Account rejected. Rejection email sent.");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Failed to reject account.";
      toast.error(msg);
    },
  });
}

export function useUsers(params: { role?: string; status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => listUsers(params),
    staleTime: 60 * 1000,
  });
}
