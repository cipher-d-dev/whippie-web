import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type {
  InternObject,
  CreateInternInput,
  UpdateInternInput,
  InternsListParams,
  ApiResponse,
  ApiPaginatedResponse,
} from "@/types";

const BASE = "/api/v1/interns";

// ─── List ──────────────────────────────────────────────────────────────────────

export async function listInterns(
  params: InternsListParams = {}
): Promise<ApiPaginatedResponse<InternObject>> {
  const qs = new URLSearchParams();
  if (params.page)           qs.set("page",           String(params.page));
  if (params.limit)          qs.set("limit",          String(params.limit));
  if (params.search)         qs.set("search",         params.search);
  if (params.status)         qs.set("status",         params.status);
  if (params.internshipType) qs.set("internshipType", params.internshipType);
  if (params.department)     qs.set("department",     params.department);
  if (params.supervisor)     qs.set("supervisor",     params.supervisor);

  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<ApiPaginatedResponse<InternObject>>(`${BASE}${query}`);
}

// ─── Get one ──────────────────────────────────────────────────────────────────

export async function getIntern(
  id: string
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiGet<ApiResponse<{ intern: InternObject }>>(`${BASE}/${id}`);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createIntern(
  input: CreateInternInput
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiPost<ApiResponse<{ intern: InternObject }>>(BASE, input);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateIntern(
  id: string,
  input: UpdateInternInput
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiPatch<ApiResponse<{ intern: InternObject }>>(`${BASE}/${id}`, input);
}
