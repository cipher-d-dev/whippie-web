import { apiGet, apiPatch } from "@/lib/api/client";
import type {
  AttendanceObject,
  AttendanceStatus,
  AttendanceCheckType,
  ApiResponse,
  ApiPaginatedResponse,
} from "@/types";

const BASE = "/api/v1/attendance";

export async function listAttendance(params: {
  page?: number;
  limit?: number;
  intern?: string;
  status?: AttendanceStatus;
  checkType?: AttendanceCheckType;
  date?: string; // ISO date string e.g. "2026-10-14"
} = {}): Promise<ApiPaginatedResponse<AttendanceObject>> {
  const qs = new URLSearchParams();
  if (params.page)      qs.set("page",      String(params.page));
  if (params.limit)     qs.set("limit",     String(params.limit));
  if (params.intern)    qs.set("intern",    params.intern);
  if (params.status)    qs.set("status",    params.status);
  if (params.checkType) qs.set("checkType", params.checkType);
  if (params.date)      qs.set("date",      params.date);
  const query = qs.toString() ? `?${qs}` : "";
  return apiGet<ApiPaginatedResponse<AttendanceObject>>(`${BASE}${query}`);
}

export async function getAttendanceRecord(
  id: string
): Promise<ApiResponse<{ attendance: AttendanceObject }>> {
  return apiGet<ApiResponse<{ attendance: AttendanceObject }>>(`${BASE}/${id}`);
}

export async function correctAttendance(
  id: string,
  input: { status: AttendanceStatus; correctionNote: string }
): Promise<ApiResponse<{ attendance: AttendanceObject }>> {
  return apiPatch<ApiResponse<{ attendance: AttendanceObject }>>(
    `${BASE}/${id}/correct`,
    input
  );
}
