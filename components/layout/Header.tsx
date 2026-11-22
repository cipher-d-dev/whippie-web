"use client";

import Link from "next/link";
import { Bell, CheckCheck, ExternalLink, Sun, Moon, Camera, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { getAvatarUploadInfo, uploadAvatarFile, updateUserAvatar } from "@/features/users/api";
import { toast } from "sonner";
import { useBellNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/features/notifications/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils/cn";
import type { NotificationObject, NotificationType } from "@/types";

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = theme === "dark";

  const toggle = () => {
    const html = document.documentElement;
    html.classList.add("transitioning");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("transitioning"), 350);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

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
    settings:      "Settings",
    verification:  "Verification",
  };
  return titles[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

const SECTION: Record<string, string> = {
  verification: "People", interns: "People", supervisors: "People", departments: "People",
  onboarding: "Programme", attendance: "Programme", tasks: "Programme", reports: "Programme",
  evaluations: "Programme", documents: "Programme", exit: "Programme", configuration: "Admin",
};

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
  const diff  = Date.now() - new Date(iso).getTime();
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
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer hover:bg-muted",
        !notification.read && "bg-accent/60"
      )}
      onClick={() => { if (!notification.read) onRead(notification._id); }}
    >
      <div className="mt-1.5 flex h-2 w-2 shrink-0">
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-sm leading-snug",
          !notification.read ? "font-semibold" : "font-medium"
        )}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {fmtRelative(notification.createdAt)}
        </p>
      </div>

      {href && <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/40" />}
    </div>
  );

  return href ? (
    <Link href={href} className="block">{content}</Link>
  ) : (
    <div>{content}</div>
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
          className="relative h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-primary px-0.5 font-mono text-[9px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[340px] p-0 rounded-xl" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Badge variant="info" dot={false} className="font-mono">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMut.mutate()}
              disabled={markAllMut.isPending}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <Separator />

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up</p>
              <p className="mt-0.5 text-xs text-muted-foreground">No unread notifications</p>
            </div>
          ) : (
            <div className="py-1 px-1">
              {notifications.map((n) => (
                <div key={n._id}>
                  <NotifItem
                    notification={n}
                    onRead={(id) => markReadMut.mutate(id)}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-2">
          <Link
            href="/notifications"
            className="flex w-full items-center justify-center rounded-lg py-2 text-[13px] font-medium text-primary transition-colors hover:bg-muted"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const pathname  = usePathname();
  const { user }  = useAuth();

  const isHR = user?.role === "HR";
  const getSection = (path: string) => (isHR ? SECTION[path.split("/")[1] ?? ""] : undefined);

  return (
    <div className="flex flex-1 items-center justify-between gap-3">
      <nav aria-label="Breadcrumb" className="min-w-0 truncate text-[13px] text-muted-foreground">
        {getSection(pathname) && <span>{getSection(pathname)} / </span>}
        <span className="text-foreground">{getPageTitle(pathname)}</span>
      </nav>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <NotificationBell />
        <UserAvatarUpload />
      </div>
    </div>
  );
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function UserAvatarUpload() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const info = await getAvatarUploadInfo();
      await uploadAvatarFile(info, file);
      const avatarUrl = `${info.endpoint}/storage/buckets/${info.bucketId}/files/${info.fileId}/view?project=${info.projectId}`;
      await updateUserAvatar(avatarUrl);
      await refreshUser();
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      title="Change profile picture"
      aria-label="Change profile picture"
      disabled={uploading}
      className="group relative ml-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-accent-foreground transition-shadow hover:ring-2 hover:ring-primary/30"
    >
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={`${user.firstName} ${user.lastName}`}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </div>

    </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={uploading}
        onChange={handleFileChange}
      />
    </>
  );
}
