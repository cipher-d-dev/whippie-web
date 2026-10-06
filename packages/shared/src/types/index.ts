/**
 * Shared account / user role types used by both the API and client apps.
 * Keep this file lean — only add what is genuinely consumed by more than
 * one application.
 */

export type UserRole = "admin" | "hr" | "supervisor" | "intern";

export type AccountStatus =
  | "pending_hr_verification"
  | "active"
  | "rejected";

export type InternshipStatus =
  | "screened"
  | "onboarding"
  | "active"
  | "completed";
