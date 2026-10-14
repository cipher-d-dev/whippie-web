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

export type InternshipStatus =
  | "SCREENED"
  | "ONBOARDING"
  | "ACTIVE"
  | "COMPLETED";

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
