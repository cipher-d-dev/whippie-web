import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type {
  DepartmentObject,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ApiResponse,
  ApiPaginatedResponse,
} from "@/types";

const BASE = "/api/v1/departments";

export async function listDepartments(params: {
  page?: number;
  limit?: number;
  isActive?: boolean;
} = {}): Promise<ApiPaginatedResponse<DepartmentObject>> {
  const qs = new URLSearchParams();
  if (params.page  != null) qs.set("page",     String(params.page));
  if (params.limit != null) qs.set("limit",    String(params.limit));
  if (params.isActive != null) qs.set("isActive", String(params.isActive));
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<DepartmentObject>>(`${BASE}${query}`);
}

export async function getDepartment(
  id: string
): Promise<ApiResponse<{ department: DepartmentObject }>> {
  return apiGet<ApiResponse<{ department: DepartmentObject }>>(`${BASE}/${id}`);
}

export async function createDepartment(
  input: CreateDepartmentInput
): Promise<ApiResponse<{ department: DepartmentObject }>> {
  return apiPost<ApiResponse<{ department: DepartmentObject }>>(BASE, input);
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput
): Promise<ApiResponse<{ department: DepartmentObject }>> {
  return apiPatch<ApiResponse<{ department: DepartmentObject }>>(`${BASE}/${id}`, input);
}
