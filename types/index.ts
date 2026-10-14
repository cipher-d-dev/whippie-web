/**
 * Web-application-level TypeScript types.
 *
 * Feature-specific types belong inside their feature folder.
 * Only put genuinely cross-cutting types here.
 */

// ─── Auth / Account ───────────────────────────────────────────────────────────

export type UserRole = "HR" | "SUPERVISOR" | "INTERN";

export type AccountStatus =
  | "PENDING_HR_VERIFICATION"
  | "ACTIVE"
  | "REJECTED";

// ─── Internship ───────────────────────────────────────────────────────────────

export type InternshipStatus =
  | "SCREENED"
  | "ONBOARDING"
  | "ACTIVE"
  | "COMPLETED";

export type InternshipType = "INTERNSHIP" | "NYSC_IT";

export interface InternObject {
  _id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  institution: string;
  course: string;
  level?: string;
  internshipType: InternshipType;
  status: InternshipStatus;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  department?: { _id: string; name: string } | null;
  supervisor?: { _id: string; firstName: string; lastName: string } | null;
  completedAt?: string;
  completionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInternInput {
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  institution: string;
  course: string;
  level?: string;
  internshipType: InternshipType;
  status?: InternshipStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateInternInput {
  // HR-only fields
  status?: InternshipStatus;
  startDate?: string;
  endDate?: string;
  internshipType?: InternshipType;
  // Shared fields (intern can also update these)
  phone?: string;
  address?: string;
  institution?: string;
  course?: string;
  level?: string;
}

export interface InternsListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InternshipStatus;
  internshipType?: InternshipType;
  department?: string;
  supervisor?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
