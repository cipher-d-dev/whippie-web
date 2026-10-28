import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
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

export interface AvatarUploadInfo {
  endpoint: string;
  projectId: string;
  bucketId: string;
  fileId: string;
}

export async function getAvatarUploadInfo(): Promise<AvatarUploadInfo> {
  const res = await apiGet<ApiResponse<{ uploadInfo: AvatarUploadInfo }>>("/api/v1/users/me/avatar-upload-info");
  if (!res.data?.uploadInfo) throw new Error("Could not retrieve upload info");
  return res.data.uploadInfo;
}

export async function uploadAvatarFile(info: AvatarUploadInfo, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("fileId", info.fileId);
  formData.append("file", file);

  const url = `${info.endpoint}/storage/buckets/${info.bucketId}/files`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": info.projectId,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Upload failed (${res.status})`);
  }
}

export async function updateUserAvatar(avatarUrl: string): Promise<ApiResponse<{ user: unknown }>> {
  return apiPatch<ApiResponse<{ user: unknown }>>("/api/v1/users/me/avatar", { avatarUrl });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<unknown>> {
  return apiPost<ApiResponse<unknown>>('/api/v1/auth/change-password', payload);
}
