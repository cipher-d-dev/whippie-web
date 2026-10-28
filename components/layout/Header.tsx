"use client";

import Link from "next/link";
import { Bell, CheckCheck, ExternalLink, Sun, Moon, Camera, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { getAvatarUploadInfo, uploadAvatarFile, updateUserAvatar } from "@/features/users/api";
import { toast } from "sonner";
import { useRef } from "react";
import { useBellNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/features/notifications/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ProfileSettingsModal } from "@/components/shared/ProfileSettingsModal";
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
    // Add transitioning class to trigger smooth CSS crossfade
    const html = document.documentElement;
    html.classList.add("transitioning");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("transitioning"), 350);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground cursor-pointer hover-press"
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        )}
      />
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
        "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer hover:bg-accent",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => { if (!notification.read) onRead(notification._id); }}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex h-2 w-2 shrink-0">
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
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
        <p className="mt-1 text-[10px] text-muted-foreground/60">
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
          className="relative h-9 w-9 rounded-xl hover:bg-accent cursor-pointer"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-scale-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] animate-scale-in">{unreadCount}</Badge>
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
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="mt-0.5 text-xs text-muted-foreground">No unread notifications</p>
            </div>
          ) : (
            <div className="py-1 px-1">
              {notifications.map((n, i) => (
                <div key={n._id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
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
            className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
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
  const [isPwdModalOpen, setPwdModalOpen] = useState(false);
  const pathname = usePathname();
  const { user }  = useAuth();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";

  const roleLabel = user?.role === "HR" ? "HR" : user?.role === "SUPERVISOR" ? "Supervisor" : "";

  return (
    <div className="flex flex-1 items-center justify-between px-4 lg:px-6">
      <h1 className="text-base font-semibold text-foreground animate-fade-in">
        {getPageTitle(pathname)}
      </h1>

      <div className="flex items-center gap-2">
        {roleLabel && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {roleLabel}
          </span>
        )}

        <ThemeToggle />
        <NotificationBell />

        <UserAvatarUpload />
          {/* Change Password Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPwdModalOpen(true)}
            className="h-8 px-2"
          >
            Change Password
          </Button>
          {/* Password Modal */}
          <ProfileSettingsModal open={isPwdModalOpen} onOpenChange={setPwdModalOpen} />
      </div>
    </div>
  );
}

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
    <div
      onClick={() => fileInputRef.current?.click()}
      title="Click to change profile picture"
      className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-primary/10 text-xs font-bold text-primary cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all select-none"
    >
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={`${user.firstName} ${user.lastName}`}
          className="h-full w-full object-cover rounded-xl"
        />
      ) : (
        <span>{initials}</span>
      )}

      {/* Overlay with camera icon */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={handleFileChange}
      />
    </div>
  );
}
