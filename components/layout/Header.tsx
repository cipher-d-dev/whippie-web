"use client";

import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useBellNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/features/notifications/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NotificationObject, NotificationType } from "@/types";

// ─── Page title map ───────────────────────────────────────────────────────────

function getPageTitle(pathname: string): string {
  const segment = pathname.split("/")[1] ?? "dashboard";
  const titles: Record<string, string> = {
    dashboard:     "Dashboard",
    interns:       "Interns",
    departments:   "Departments",
    onboarding:    "Onboarding",
    attendance:    "Attendance",
    tasks:         "Tasks",
    reports:       "Reports",
    supervisors:   "Supervisors",
    documents:     "Documents",
    evaluations:   "Evaluations",
    exit:          "Exit & Completion",
    notifications: "Notifications",
  };
  return titles[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

// ─── Notification entity link map ─────────────────────────────────────────────

const ENTITY_HREF: Partial<Record<NotificationType, (id: string) => string>> = {
  TASK_ASSIGNED:                (id) => `/tasks/${id}`,
  TASK_FEEDBACK:                (id) => `/tasks/${id}`,
  SUBMISSION_APPROVED:          (id) => `/tasks/${id}`,
  SUBMISSION_CHANGES_REQUESTED: (id) => `/tasks/${id}`,
  EVALUATION_SUBMITTED:         (id) => `/evaluations/${id}`,
  DOCUMENT_STATUS_CHANGED:      (id) => `/documents/${id}`,
  REPORT_REVIEWED:              (id) => `/reports/${id}`,
};

function getEntityHref(n: NotificationObject): string | null {
  const fn = ENTITY_HREF[n.type];
  if (!fn || !n.relatedEntity?.id) return null;
  return fn(n.relatedEntity.id);
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Single notification item ─────────────────────────────────────────────────

function NotifItem({
  notification,
  onRead,
}: {
  notification: NotificationObject;
  onRead: (id: string) => void;
}) {
  const href = getEntityHref(notification);

  const content = (
    <div
      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent ${
        !notification.read ? "bg-primary/5" : ""
      }`}
      onClick={() => { if (!notification.read) onRead(notification._id); }}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${!notification.read ? "font-semibold" : "font-medium"}`}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {fmtRelative(notification.createdAt)}
        </p>
      </div>

      {href && <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/50" />}
    </div>
  );

  return href ? (
    <Link href={href} className="block">{content}</Link>
  ) : (
    <div className="cursor-default">{content}</div>
  );
}

// ─── Bell dropdown ────────────────────────────────────────────────────────────

function NotificationBell() {
  const { data: bellData } = useBellNotifications();
  const unreadCount        = useUnreadCount().data ?? 0;
  const markReadMut        = useMarkRead();
  const markAllMut         = useMarkAllRead();

  const notifications = bellData?.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px]">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMut.mutate()}
              disabled={markAllMut.isPending}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <Separator />

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="mb-2 h-6 w-6 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((n) => (
                <NotifItem
                  key={n._id}
                  notification={n}
                  onRead={(id) => markReadMut.mutate(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-2">
          <Link
            href="/notifications"
            className="flex w-full items-center justify-center rounded-md py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "HR")         return "default";
  if (role === "SUPERVISOR") return "secondary";
  return "outline";
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-base font-semibold text-foreground">
        {getPageTitle(pathname)}
      </h1>

      <div className="flex items-center gap-3">
        {user && (
          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
            {user.role}
          </Badge>
        )}

        <NotificationBell />

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
