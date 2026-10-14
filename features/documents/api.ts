import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type {
  DocumentObject,
  RequirementObject,
  ChecklistItem,
  UploadInfo,
  DocumentStatus,
  DocumentType,
  ApiResponse,
  ApiPaginatedResponse,
} from "@/types";

const BASE = "/api/v1/documents";

// ─── Requirements ─────────────────────────────────────────────────────────────

export async function listRequirements(): Promise<ApiPaginatedResponse<RequirementObject>> {
  return apiGet<ApiPaginatedResponse<RequirementObject>>(`${BASE}/requirements`);
}

export async function createRequirement(input: {
  type: DocumentType;
  label: string;
  description?: string;
  isRequired: boolean;
}): Promise<ApiResponse<{ requirement: RequirementObject }>> {
  return apiPost<ApiResponse<{ requirement: RequirementObject }>>(`${BASE}/requirements`, input);
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export async function getChecklist(
  internId: string
): Promise<ApiResponse<{ checklist: ChecklistItem[] }>> {
  return apiGet<ApiResponse<{ checklist: ChecklistItem[] }>>(`${BASE}/checklist/${internId}`);
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function listDocuments(params: {
  page?: number;
  limit?: number;
  intern?: string;
  status?: DocumentStatus;
  type?: DocumentType;
} = {}): Promise<ApiPaginatedResponse<DocumentObject>> {
  const qs = new URLSearchParams();
  if (params.page)   qs.set("page",   String(params.page));
  if (params.limit)  qs.set("limit",  String(params.limit));
  if (params.intern) qs.set("intern", params.intern);
  if (params.status) qs.set("status", params.status);
  if (params.type)   qs.set("type",   params.type);
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<DocumentObject>>(`${BASE}${query}`);
}

export async function getDocument(
  id: string
): Promise<ApiResponse<{ document: DocumentObject }>> {
  return apiGet<ApiResponse<{ document: DocumentObject }>>(`${BASE}/${id}`);
}

export async function createDocument(input: {
  internId: string;
  requirementId: string;
}): Promise<ApiResponse<{ document: DocumentObject }>> {
  return apiPost<ApiResponse<{ document: DocumentObject }>>(BASE, input);
}

export async function getUploadInfo(
  id: string
): Promise<ApiResponse<{ uploadInfo: UploadInfo }>> {
  return apiGet<ApiResponse<{ uploadInfo: UploadInfo }>>(`${BASE}/${id}/upload-info`);
}

export async function confirmUpload(
  id: string,
  meta: { storageKey: string; originalFilename: string; contentType: string; fileSizeBytes: number }
): Promise<ApiResponse<{ document: DocumentObject }>> {
  return apiPatch<ApiResponse<{ document: DocumentObject }>>(`${BASE}/${id}/upload`, meta);
}

export async function markPhysical(
  id: string,
  notes?: string
): Promise<ApiResponse<{ document: DocumentObject }>> {
  return apiPatch<ApiResponse<{ document: DocumentObject }>>(`${BASE}/${id}/physical`, { notes });
}

export async function reviewDocument(
  id: string,
  input: { status: "VERIFIED" | "REJECTED"; rejectionReason?: string; notes?: string }
): Promise<ApiResponse<{ document: DocumentObject }>> {
  return apiPatch<ApiResponse<{ document: DocumentObject }>>(`${BASE}/${id}/review`, input);
}

export function getDownloadUrl(id: string): string {
  const base = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000";
  return `${base}/api/v1/documents/${id}/download`;
}
