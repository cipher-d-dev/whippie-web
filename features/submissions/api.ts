import { apiGet, apiPatch } from "@/lib/api/client";
import type { SubmissionObject, SubmissionStatus, ApiResponse } from "@/types";

const BASE = "/api/v1/submissions";

export async function getTaskSubmissions(
  taskId: string
): Promise<ApiResponse<{ submissions: SubmissionObject[] }>> {
  return apiGet<ApiResponse<{ submissions: SubmissionObject[] }>>(`${BASE}/task/${taskId}`);
}

export async function reviewSubmission(
  id: string,
  input: { status: "APPROVED" | "CHANGES_REQUESTED"; feedback?: string }
): Promise<ApiResponse<{ submission: SubmissionObject }>> {
  return apiPatch<ApiResponse<{ submission: SubmissionObject }>>(`${BASE}/${id}/review`, input);
}
