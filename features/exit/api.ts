import { apiGet, apiPost } from "@/lib/api/client";
import type { ExitChecklist, ApiResponse } from "@/types";

const BASE = "/api/v1/interns";

export async function getExitChecklist(
  internId: string
): Promise<ApiResponse<{ checklist: ExitChecklist }>> {
  return apiGet<ApiResponse<{ checklist: ExitChecklist }>>(
    `${BASE}/${internId}/exit-checklist`
  );
}

export async function completeInternship(
  internId: string,
  completionNote?: string
): Promise<ApiResponse<{
  internId: string;
  internName: string;
  completedAt: string;
  status: string;
}>> {
  return apiPost<ApiResponse<{ internId: string; internName: string; completedAt: string; status: string }>>(
    `${BASE}/${internId}/complete`,
    { completionNote }
  );
}
