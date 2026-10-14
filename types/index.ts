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

// ─── Exit / Completion ────────────────────────────────────────────────────────

export interface ExitChecklistItem {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ExitChecklist {
  internId: string;
  internName: string;
  canComplete: boolean;
  items: ExitChecklistItem[];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus  = "ACCEPTED" | "FLAGGED" | "REJECTED";
export type AttendanceCheckType = "CHECK_IN" | "CHECK_OUT";

export interface AttendanceObject {
  _id: string;
  intern: { _id: string; firstName: string; lastName: string } | string;
  date: string;
  checkType: AttendanceCheckType;
  status: AttendanceStatus;
  submittedAt: string;
  distanceFromOffice?: number;
  withinGeofence?: boolean;
  locationAccuracy?: number;
  flagReasons?: string[];
  correctionNote?: string;
  correctedBy?: string;
  correctedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportType   = "DAILY" | "WEEKLY";
export type ReportStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

export interface ReportObject {
  _id: string;
  type: ReportType;
  title: string;
  content: string;
  status: ReportStatus;
  periodStart?: string;
  periodEnd?: string;
  intern: { _id: string; firstName: string; lastName: string } | string;
  reviewedBy?: { _id: string; firstName?: string; lastName?: string } | string;
  reviewedAt?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Evaluations ──────────────────────────────────────────────────────────────

export type EvaluationStatus = "DRAFT" | "SUBMITTED";

export interface EvaluationScores {
  workQuality:       number;
  reliability:       number;
  communication:     number;
  learningProgress:  number;
  professionalism:   number;
}

export interface EvaluationObject {
  _id: string;
  intern: { _id: string; firstName: string; lastName: string } | string;
  supervisor: { _id: string; firstName: string; lastName: string } | string;
  status: EvaluationStatus;
  scores: EvaluationScores;
  comments: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "COMPLETED";

export interface TaskObject {
  _id: string;
  title: string;
  description: string;
  intern: { _id: string; firstName: string; lastName: string } | string;
  supervisor: { _id: string; firstName: string; lastName: string } | string | null;
  createdBy: string;
  status: TaskStatus;
  deadline?: string;
  feedback?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  internId: string;
  deadline?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  deadline?: string;
  status?: TaskStatus;
  feedback?: string;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export type SubmissionStatus = "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";

export interface SubmissionObject {
  _id: string;
  task: string;
  intern: { _id: string; firstName: string; lastName: string } | string;
  content: string;
  status: SubmissionStatus;
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType =
  | "ACCEPTANCE_LETTER"
  | "GUARANTOR_FORM"
  | "IDENTIFICATION"
  | "SCHOOL_LETTER"
  | "NYSC_CALL_UP"
  | "REPORT"
  | "EVALUATION"
  | "EXIT_DOCUMENT"
  | "OTHER";

export type DocumentStatus =
  | "PENDING"
  | "DIGITAL_RECEIVED"
  | "PHYSICAL_RECEIVED"
  | "VERIFIED"
  | "REJECTED";

export interface RequirementObject {
  _id: string;
  type: DocumentType;
  label: string;
  description?: string;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentObject {
  _id: string;
  intern: { _id: string; firstName: string; lastName: string } | string;
  requirement: RequirementObject | string;
  status: DocumentStatus;
  originalFilename?: string;
  contentType?: string;
  fileSizeBytes?: number;
  rejectionReason?: string;
  notes?: string;
  reviewedBy?: { _id: string; firstName?: string; lastName?: string } | string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  requirement: RequirementObject;
  document: Pick<DocumentObject, "_id" | "status"> | null;
}

export interface UploadInfo {
  endpoint: string;
  projectId: string;
  bucketId: string;
  fileId: string;
}

// ─── Departments ──────────────────────────────────────────────────────────────

export type Subsidiary = "AIT" | "Raypower" | "Faaji" | "Corporate";

export interface DepartmentObject {
  _id: string;
  name: string;
  subsidiary?: Subsidiary;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  subsidiary?: Subsidiary;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  subsidiary?: Subsidiary;
  description?: string;
  isActive?: boolean;
}

// ─── Supervisors ──────────────────────────────────────────────────────────────

export interface SupervisorObject {
  _id: string;
  user?: { _id: string; email: string };
  firstName: string;
  lastName: string;
  phone?: string;
  department?: { _id: string; name: string; subsidiary?: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupervisorInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
}

export interface UpdateSupervisorInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
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
