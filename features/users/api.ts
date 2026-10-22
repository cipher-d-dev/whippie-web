import { apiGet, apiPatch } from "@/lib/api/client";
import type { ApiResponse, ApiPaginatedResponse } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountStatus =
  | "UNVERIFIED_EMAIL"
  | "PENDING_HR_VERIFICATION"
  | "ACTIVE"
  | "REJECTED";

export type AuthMethod = "PASSWORD" | "GOOGLE" | "BOTH";

export interface PendingUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: AccountStatus;
  authMethod: AuthMethod;
  googleId?: string;
  verificationExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getVerificationQueue(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiPaginatedResponse<PendingUser>> {
  const qs = new URLSearchParams();
  if (params?.page)  qs.set("page",  String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<PendingUser>>(
    `/api/v1/users/verification-queue${query}`
  );
}

export async function approveUser(
  userId: string
): Promise<ApiResponse<{ user: PendingUser }>> {
  return apiPatch<ApiResponse<{ user: PendingUser }>>(
    `/api/v1/users/${userId}/approve`
  );
}

export async function rejectUser(
  userId: string,
  reason: string
): Promise<ApiResponse<{ user: PendingUser }>> {
  return apiPatch<ApiResponse<{ user: PendingUser }>>(
    `/api/v1/users/${userId}/reject`,
    { reason }
  );
}

export async function listUsers(params: {
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiPaginatedResponse<PendingUser>> {
  const qs = new URLSearchParams();
  if (params.role)   qs.set("role",   params.role);
  if (params.status) qs.set("status", params.status);
  if (params.page)   qs.set("page",   String(params.page));
  if (params.limit)  qs.set("limit",  String(params.limit));
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<PendingUser>>(`/api/v1/users${query}`);
}
