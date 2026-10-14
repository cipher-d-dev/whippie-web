import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type { EvaluationObject, EvaluationScores, EvaluationStatus, ApiResponse, ApiPaginatedResponse } from "@/types";

const BASE = "/api/v1/evaluations";

export async function listEvaluations(params: {
  page?: number; limit?: number; status?: EvaluationStatus; intern?: string; supervisor?: string;
} = {}): Promise<ApiPaginatedResponse<EvaluationObject>> {
  const qs = new URLSearchParams();
  if (params.page)       qs.set("page",       String(params.page));
  if (params.limit)      qs.set("limit",      String(params.limit));
  if (params.status)     qs.set("status",     params.status);
  if (params.intern)     qs.set("intern",     params.intern);
  if (params.supervisor) qs.set("supervisor", params.supervisor);
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<EvaluationObject>>(`${BASE}${query}`);
}

export async function getEvaluation(id: string): Promise<ApiResponse<{ evaluation: EvaluationObject }>> {
  return apiGet<ApiResponse<{ evaluation: EvaluationObject }>>(`${BASE}/${id}`);
}

export async function createEvaluation(input: {
  internId: string; scores: EvaluationScores; comments: string;
}): Promise<ApiResponse<{ evaluation: EvaluationObject }>> {
  return apiPost<ApiResponse<{ evaluation: EvaluationObject }>>(BASE, input);
}

export async function updateEvaluation(id: string, input: {
  scores?: Partial<EvaluationScores>; comments?: string;
}): Promise<ApiResponse<{ evaluation: EvaluationObject }>> {
  return apiPatch<ApiResponse<{ evaluation: EvaluationObject }>>(`${BASE}/${id}`, input);
}

export async function submitEvaluation(id: string): Promise<ApiResponse<{ evaluation: EvaluationObject }>> {
  return apiPost<ApiResponse<{ evaluation: EvaluationObject }>>(`${BASE}/${id}/submit`, {});
}
