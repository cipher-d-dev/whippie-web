import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listNotifications, markRead, markAllRead } from "./api";

export const notificationKeys = {
  all:      () => ["notifications"] as const,
  list:     (p?: object) => ["notifications", "list", p ?? {}] as const,
  unread:   () => ["notifications", "list", { read: false }] as const,
  bell:     () => ["notifications", "bell"] as const,
};

/** Full paginated list — used by the /notifications page */
export function useNotifications(params?: { page?: number; limit?: number; read?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn:  () => listNotifications(params),
    refetchInterval: 60_000, // poll every 60s
  });
}

/** Latest 5 unread — used by the bell dropdown */
export function useBellNotifications() {
  return useQuery({
    queryKey: notificationKeys.bell(),
    queryFn:  () => listNotifications({ limit: 5, read: false }),
    refetchInterval: 30_000, // poll every 30s
  });
}

/** Unread count only */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn:  () => listNotifications({ limit: 1, read: false }),
    refetchInterval: 30_000,
    select: (data) => data.total,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
}

export function useMarkAllRead(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
      toast.success(res.data ? `${res.data.count} notification${res.data.count !== 1 ? "s" : ""} marked as read.` : "All marked as read.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to mark notifications."),
  });
}
