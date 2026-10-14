import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type {
  TaskObject,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  ApiResponse,
  ApiPaginatedResponse,
} from "@/types";

const BASE = "/api/v1/tasks";

export async function listTasks(params: {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  intern?: string;
  supervisor?: string;
} = {}): Promise<ApiPaginatedResponse<TaskObject>> {
  const qs = new URLSearchParams();
  if (params.page)       qs.set("page",       String(params.page));
  if (params.limit)      qs.set("limit",      String(params.limit));
  if (params.status)     qs.set("status",     params.status);
  if (params.intern)     qs.set("intern",     params.intern);
  if (params.supervisor) qs.set("supervisor", params.supervisor);
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<TaskObject>>(`${BASE}${query}`);
}

export async function getTask(id: string): Promise<ApiResponse<{ task: TaskObject }>> {
  return apiGet<ApiResponse<{ task: TaskObject }>>(`${BASE}/${id}`);
}

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<{ task: TaskObject }>> {
  return apiPost<ApiResponse<{ task: TaskObject }>>(BASE, input);
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<ApiResponse<{ task: TaskObject }>> {
  return apiPatch<ApiResponse<{ task: TaskObject }>>(`${BASE}/${id}`, input);
}
