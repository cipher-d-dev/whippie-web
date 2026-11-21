import { apiGet } from "@/lib/api/client";
import type { ApiResponse, InternshipStatus, InternshipType } from "@/types";

/** Shape of GET /api/v1/admin/dashboard (HR only). See whippe-api docs/API-CONTRACT.md §17. */
export interface DashboardStats {
  generatedAt: string;
  interns: {
    total: number;
    byStatus: Record<InternshipStatus, number>;
    activeByType: Record<InternshipType, number>;
    activeBySubsidiary: { subsidiary: string; count: number }[];
  };
  today: {
    date: string;
    checkedIn: number;
    accepted: number;
    flagged: number;
    rejected: number;
    corrected: number;
    notCheckedIn: number;
    averageArrival: string | null;
  };
  week: { date: string; weekday: string; checkedIn: number | null }[];
  pending: {
    verifications: number;
    documentsToVerify: number;
    tasksToReview: number;
    reportsToReview: number;
    draftEvaluations: number;
  };
}

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiGet<ApiResponse<DashboardStats>>("/api/v1/admin/dashboard");
}
