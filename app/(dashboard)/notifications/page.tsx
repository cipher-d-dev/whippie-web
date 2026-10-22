"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/features/notifications/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { NotificationObject, NotificationType } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENTITY_HREF: Partial<Record<NotificationType, (id: string) => string>> = {
  TASK_ASSIGNED:                (id) => `/tasks/${id}`,
  TASK_FEEDBACK:                (id) => `/tasks/${id}`,
  SUBMISSION_APPROVED:          (id) => `/tasks/${id}`,
  SUBMISSION_CHANGES_REQUESTED: (id) => `/tasks/${id}`,
  EVALUATION_SUBMITTED:         (id) => `/evaluations/${id}`,
  DOCUMENT_STATUS_CHANGED:      (id) => `/documents/${id}`,
  REPORT_REVIEWED:              (id) => `/reports/${id}`,
  NEW_INTERN_PENDING:           (id) => `/interns/${id}`,
  ATTENDANCE_FLAGGED:           (id) => `/attendance/${id}`,
  DOCUMENT_UPLOADED:            (id) => `/documents/${id}`,
  REPORT_SUBMITTED:             (id) => `/reports/${id}`,
};

function getEntityHref(n: NotificationObject): string | null {
  const fn = ENTITY_HREF[n.type];
  if (!fn || !n.relatedEntity?.id) return null;
  return fn(n.relatedEntity.id);
}

function fmtRelative(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  ACCOUNT_APPROVED:             "Account approved",
  ACCOUNT_REJECTED:             "Account rejected",
  SUPERVISOR_ASSIGNED:          "Supervisor assigned",
  TASK_ASSIGNED:                "Task assigned",
  TASK_FEEDBACK:                "Task feedback",
  SUBMISSION_APPROVED:          "Submission approved",
  SUBMISSION_CHANGES_REQUESTED: "Changes requested",
  EVALUATION_SUBMITTED:         "Evaluation submitted",
  DOCUMENT_STATUS_CHANGED:      "Document update",
  REPORT_REVIEWED:              "Report reviewed",
  NEW_INTERN_PENDING:           "New applicant",
  ATTENDANCE_FLAGGED:           "Attendance flagged",
  DOCUMENT_UPLOADED:            "Document uploaded",
  REPORT_SUBMITTED:             "Report submitted",
};

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationObject;
  onRead: (id: string) => void;
}) {
  const href = getEntityHref(notification);

  const inner = (
    <div
      className={`group flex items-start gap-4 rounded-xl border px-4 py-4 transition-all hover:shadow-sm cursor-pointer ${
        !notification.read
          ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
          : "bg-card hover:bg-accent/50"
      }`}
      onClick={() => { if (!notification.read) onRead(notification._id); }}
    >
      {/* Unread indicator */}
      <div className="mt-2 flex h-2 w-2 shrink-0">
        {!notification.read
          ? <span className="h-2 w-2 rounded-full bg-primary" />
          : <span className="h-2 w-2 rounded-full bg-transparent" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm leading-snug ${!notification.read ? "font-semibold" : "font-medium"}`}>
            {notification.title}
          </p>
          <Badge variant="outline" className="text-[10px] px-1.5">
            {TYPE_LABELS[notification.type] ?? notification.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {fmtRelative(notification.createdAt)}
        </p>
      </div>

      {/* Link arrow */}
      {href && (
        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ReadFilter = "ALL" | "UNREAD" | "READ";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<ReadFilter>("ALL");
  const [page, setPage]     = useState(1);

  const params = {
    page, limit: 20,
    ...(filter === "UNREAD" && { read: false }),
    ...(filter === "READ"   && { read: true  }),
  };

  const { data, isLoading } = useNotifications(params);
  const markReadMut  = useMarkRead();
  const markAllMut   = useMarkAllRead(() => setFilter("ALL"));

  const notifications = data?.data ?? [];
  const total         = data?.total ?? 0;
  const totalPages    = data?.totalPages ?? 1;
  const unreadTotal   = filter === "ALL" ? (data?.data ?? []).filter((n) => !n.read).length : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {!isLoading && `${total} notification${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markAllMut.isPending}
          onClick={() => markAllMut.mutate()}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filter} onValueChange={(v) => { setFilter(v as ReadFilter); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="UNREAD">Unread</SelectItem>
            <SelectItem value="READ">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Bell className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {filter === "UNREAD" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow
              key={n._id}
              notification={n}
              onRead={(id) => markReadMut.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
