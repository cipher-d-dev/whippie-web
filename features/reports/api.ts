import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { ReportObject, ReportStatus, ReportType, ApiResponse, ApiPaginatedResponse } from "@/types";

const BASE = "/api/v1/reports";

export async function listReports(params: {
  page?: number; limit?: number;
  status?: ReportStatus; type?: ReportType; intern?: string;
} = {}): Promise<ApiPaginatedResponse<ReportObject>> {
  const qs = new URLSearchParams();
  if (params.page)   qs.set("page",   String(params.page));
  if (params.limit)  qs.set("limit",  String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.type)   qs.set("type",   params.type);
  if (params.intern) qs.set("intern", params.intern);
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<ReportObject>>(`${BASE}${query}`);
}

export async function getReport(id: string): Promise<ApiResponse<{ report: ReportObject }>> {
  return apiGet<ApiResponse<{ report: ReportObject }>>(`${BASE}/${id}`);
}

export async function reviewReport(
  id: string, feedback: string
): Promise<ApiResponse<{ report: ReportObject }>> {
  return apiPatch<ApiResponse<{ report: ReportObject }>>(`${BASE}/${id}/review`, { feedback });
}
