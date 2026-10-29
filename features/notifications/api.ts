import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { NotificationObject, ApiResponse, ApiPaginatedResponse } from "@/types";

const BASE = "/api/v1/notifications";

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  read?: boolean;
} = {}): Promise<ApiPaginatedResponse<NotificationObject>> {
  const qs = new URLSearchParams();
  if (params.page  != null) qs.set("page",  String(params.page));
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.read  != null) qs.set("read",  String(params.read));
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<NotificationObject>>(`${BASE}${query}`);
}

export async function markRead(
  id: string
): Promise<ApiResponse<{ notification: NotificationObject }>> {
  return apiPatch<ApiResponse<{ notification: NotificationObject }>>(
    `${BASE}/${id}/read`,
    {}
  );
}

export async function markAllRead(): Promise<ApiResponse<{ count: number }>> {
  return apiPatch<ApiResponse<{ count: number }>>(`${BASE}/read-all`, {});
}

export interface BroadcastNotificationInput {
  target: "INTERNS" | "SUPERVISORS" | "BOTH";
  title: string;
  body: string;
}

export async function broadcastNotification(
  input: BroadcastNotificationInput
): Promise<ApiResponse<{ count: number }>> {
  return apiPost<ApiResponse<{ count: number }>>(`${BASE}/broadcast`, input);
}
