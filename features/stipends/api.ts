import { apiGet } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export interface StipendRow {
  internId: string;
  firstName: string;
  lastName: string;
  internshipType: "INTERNSHIP" | "NYSC_IT";
  department: string | null;
  supervisor: string | null;
  activeFrom: string;
  activeTo: string;
  expectedDays: number;
  daysWorked: number;
  flaggedDays: number;
  rejectedDays: number;
  /** Days checked in late (already counted in days worked). */
  lateDays?: number;
  fullAmount: number;
  suggestedAmount: number;
}

export interface StipendReport {
  period: { from: string; to: string; calendarMonth: boolean };
  rules: { INTERNSHIP: { days: number; amount: number }; NYSC_IT: { days: number; amount: number } };
  rows: StipendRow[];
  totals: { suggestedAmount: number; people: number };
  /** On the programme in the period but not on payroll (e.g. SIWES), so not listed. */
  notOnAllowance?: number;
}

export function getStipendReport(from: string, to: string) {
  return apiGet<ApiResponse<{ report: StipendReport }>>(`/api/v1/admin/stipends?from=${from}&to=${to}`);
}
