import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import type {
  SupervisorObject,
  InternObject,
  CreateSupervisorInput,
  UpdateSupervisorInput,
  ApiResponse,
  ApiPaginatedResponse,
} from "@/types";

const BASE = "/api/v1/supervisors";
const INTERNS_BASE = "/api/v1/interns";

export async function listSupervisors(params: {
  page?: number;
  limit?: number;
  department?: string;
  isActive?: boolean;
} = {}): Promise<ApiPaginatedResponse<SupervisorObject>> {
  const qs = new URLSearchParams();
  if (params.page       != null) qs.set("page",       String(params.page));
  if (params.limit      != null) qs.set("limit",      String(params.limit));
  if (params.department)         qs.set("department", params.department);
  if (params.isActive   != null) qs.set("isActive",   String(params.isActive));
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<SupervisorObject>>(`${BASE}${query}`);
}

export async function getSupervisor(
  id: string
): Promise<ApiResponse<{ supervisor: SupervisorObject }>> {
  return apiGet<ApiResponse<{ supervisor: SupervisorObject }>>(`${BASE}/${id}`);
}

export async function getSupervisorInterns(
  id: string
): Promise<ApiResponse<{ interns: InternObject[] }>> {
  return apiGet<ApiResponse<{ interns: InternObject[] }>>(`${BASE}/${id}/interns`);
}

export async function createSupervisor(
  input: CreateSupervisorInput
): Promise<ApiResponse<{ supervisor: SupervisorObject }>> {
  return apiPost<ApiResponse<{ supervisor: SupervisorObject }>>(BASE, input);
}

export async function updateSupervisor(
  id: string,
  input: UpdateSupervisorInput
): Promise<ApiResponse<{ supervisor: SupervisorObject }>> {
  return apiPatch<ApiResponse<{ supervisor: SupervisorObject }>>(`${BASE}/${id}`, input);
}

// ─── Intern assignment ────────────────────────────────────────────────────────

export async function assignSupervisor(
  internId: string,
  supervisorId: string
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiPut<ApiResponse<{ intern: InternObject }>>(
    `${INTERNS_BASE}/${internId}/supervisor`,
    { supervisorId }
  );
}

export async function removeSupervisor(
  internId: string
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiDelete<ApiResponse<{ intern: InternObject }>>(
    `${INTERNS_BASE}/${internId}/supervisor`
  );
}

export async function assignDepartment(
  internId: string,
  departmentId: string
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiPut<ApiResponse<{ intern: InternObject }>>(
    `${INTERNS_BASE}/${internId}/department`,
    { departmentId }
  );
}

export async function removeDepartment(
  internId: string
): Promise<ApiResponse<{ intern: InternObject }>> {
  return apiDelete<ApiResponse<{ intern: InternObject }>>(
    `${INTERNS_BASE}/${internId}/department`
  );
}

// apiPut helper (not in client yet — re-export from client)
function apiPut<T>(path: string, body?: unknown): Promise<T> {
  // Import inline to avoid circular deps
  return import("@/lib/api/client").then(({ apiPut: put }) => put<T>(path, body));
}
