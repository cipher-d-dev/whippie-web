import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/**
 * One place that decides how every status in Whippie looks.
 * Colour follows meaning, not the entity:
 *   success = done / approved / active    warning = waiting on someone
 *   danger  = rejected / flagged / late   info    = in review / in progress
 *   neutral = draft / not started / closed
 */
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS: Record<string, { tone: Tone; label: string }> = {
  // Accounts
  PENDING_HR_VERIFICATION: { tone: "warning", label: "Awaiting HR" },
  UNVERIFIED_EMAIL:        { tone: "neutral", label: "Email not confirmed" },
  ACTIVE:                  { tone: "success", label: "Active" },
  REJECTED:                { tone: "danger",  label: "Rejected" },
  // Internship
  SCREENED:                { tone: "neutral", label: "Screened" },
  ONBOARDING:              { tone: "info",    label: "Onboarding" },
  COMPLETED:               { tone: "success", label: "Completed" },
  // Attendance
  ACCEPTED:                { tone: "success", label: "Accepted" },
  FLAGGED:                 { tone: "warning", label: "Flagged" },
  CORRECTED:               { tone: "info",    label: "Corrected" },
  // Tasks & submissions
  TODO:                    { tone: "neutral", label: "To do" },
  IN_PROGRESS:             { tone: "info",    label: "In progress" },
  SUBMITTED:               { tone: "info",    label: "Submitted" },
  CHANGES_REQUESTED:       { tone: "warning", label: "Changes requested" },
  PENDING_REVIEW:          { tone: "info",    label: "Pending review" },
  APPROVED:                { tone: "success", label: "Approved" },
  // Reports & evaluations
  DRAFT:                   { tone: "neutral", label: "Draft" },
  REVIEWED:                { tone: "success", label: "Reviewed" },
  // Documents
  PENDING:                 { tone: "neutral", label: "Not received" },
  DIGITAL_RECEIVED:        { tone: "info",    label: "Uploaded" },
  PHYSICAL_RECEIVED:       { tone: "info",    label: "Paper copy received" },
  VERIFIED:                { tone: "success", label: "Verified" },
};

export function statusTone(status: string | undefined | null): Tone {
  return (status && STATUS[status]?.tone) || "neutral";
}

export function statusLabel(status: string | undefined | null): string {
  if (!status) return "—";
  return STATUS[status]?.label ?? status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string | undefined | null;
  /** Override the default label, e.g. "Approve pending" */
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant={statusTone(status)} className={cn(className)}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}
