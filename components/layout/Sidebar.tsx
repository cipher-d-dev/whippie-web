"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  LayoutDashboard,
  Users,
  CalendarDays,
  CheckSquare,
  FileText,
  BriefcaseBusiness,
  FolderOpen,
  Star,
  DoorOpen,
  LogOut,
  Building2,
  Bell,
  UserCheck,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/context";
import { useUnreadCount } from "@/features/notifications/hooks";
import { usePendingCount } from "@/features/users/hooks";
import { useChatUnread } from "@/features/chat/hooks";
import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { toast } from "sonner";

// ─── Nav structure ────────────────────────────────────────────────────────────

type BadgeKey = "notifications" | "verification" | "messages";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: BadgeKey;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const hrNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
      { label: "Notifications", href: "/notifications", icon: Bell, badge: "notifications" },
      { label: "Messages",      href: "/messages",      icon: MessageCircle, badge: "messages" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Verification", href: "/verification", icon: UserCheck, badge: "verification" },
      { label: "Interns",      href: "/interns",      icon: Users },
      { label: "Supervisors",  href: "/supervisors",  icon: BriefcaseBusiness },
      { label: "Departments",  href: "/departments",  icon: Building2 },
    ],
  },
  {
    label: "Programme",
    items: [
      { label: "Attendance",  href: "/attendance",         icon: CalendarDays },
      { label: "Tasks",       href: "/tasks",              icon: CheckSquare },
      { label: "Reports",     href: "/reports",            icon: FileText },
      { label: "Evaluations", href: "/evaluations",        icon: Star },
      { label: "Stipends",    href: "/stipends",           icon: Wallet },
      { label: "Documents",   href: "/documents/generate", icon: FolderOpen },
      { label: "Exit",        href: "/exit",               icon: DoorOpen },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Configuration", href: "/configuration",    icon: SlidersHorizontal },
    ],
  },
];

const supervisorNav: NavGroup[] = [
  {
    items: [
      { label: "Dashboard",     href: "/dashboard",          icon: LayoutDashboard },
      { label: "My interns",    href: "/interns",            icon: Users },
      { label: "Tasks",         href: "/tasks",              icon: CheckSquare },
      { label: "Reports",       href: "/reports",            icon: FileText },
      { label: "Evaluations",   href: "/evaluations",        icon: Star },
      { label: "Documents",     href: "/documents/generate", icon: FolderOpen },
      { label: "Messages",      href: "/messages",           icon: MessageCircle, badge: "messages" },
      { label: "Notifications", href: "/notifications",      icon: Bell, badge: "notifications" },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  // "/documents/generate" should light up for every /documents page
  const base = href.startsWith("/documents") ? "/documents" : href;
  return pathname === base || pathname.startsWith(base + "/") || pathname === href;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const isHR = user?.role === "HR";
  const unreadCount  = useUnreadCount().data ?? 0;
  const pendingCount = usePendingCount().data ?? 0;
  const chatUnread   = useChatUnread(!!user).data ?? 0;

  const groups = isHR ? hrNav : supervisorNav;
  const counts: Record<BadgeKey, number> = {
    notifications: unreadCount,
    verification: isHR ? pendingCount : 0,
    messages: chatUnread,
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully.");
    router.replace("/login");
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";

  return (
    <aside className="flex h-full w-[236px] flex-col gap-4 px-2 py-3" aria-label="Sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2.5 pt-1">
        <WhippieLogo size={26} />
        <span className="flex-1 text-[17px] font-semibold tracking-[-0.02em] text-foreground">Whippie</span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            isHR ? "bg-accent text-accent-foreground" : "bg-border text-secondary-foreground"
          )}
        >
          {isHR ? "HR" : "Supervisor"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto" aria-label="Main navigation">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi} className="space-y-0.5">
            {group.label && (
              <p className="px-2.5 pb-1 text-[11px] font-medium text-muted-foreground">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                const count = item.badge ? counts[item.badge] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-card text-foreground shadow-[0_1px_2px_rgba(13,18,32,0.06),0_0_0_1px_hsl(var(--border))]"
                          : "text-secondary-foreground hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.05]"
                      )}
                    >
                      <Icon
                        className={cn("h-[17px] w-[17px] shrink-0", active ? "text-primary" : "text-muted-foreground")}
                        strokeWidth={1.8}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[11px] font-medium text-primary-foreground"
                          aria-label={`${count} ${item.badge === "verification" ? "waiting" : item.badge === "messages" ? "unread chats" : "unread"}`}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1">
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-card text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
              : "text-secondary-foreground hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.05]"
          )}
        >
          <SlidersHorizontal className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
          Settings
        </Link>
        {user && (
          <div className="flex items-center gap-2.5 rounded-xl border bg-card p-2">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{isHR ? "HR" : "Supervisor"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
