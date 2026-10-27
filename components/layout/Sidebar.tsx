"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  CheckSquare,
  FileText,
  UserCog,
  FolderOpen,
  Star,
  DoorOpen,
  LogOut,
  Building2,
  Bell,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/context";
import { useUnreadCount } from "@/features/notifications/hooks";
import { usePendingCount } from "@/features/users/hooks";
import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { toast } from "sonner";

// ─── Nav items ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const hrNav: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { label: "Verification",  href: "/verification",  icon: UserCheck },
  { label: "Interns",       href: "/interns",       icon: Users },
  { label: "Departments",   href: "/departments",   icon: Building2 },
  { label: "Onboarding",    href: "/onboarding",    icon: ClipboardCheck },
  { label: "Attendance",    href: "/attendance",    icon: CalendarDays },
  { label: "Tasks",         href: "/tasks",         icon: CheckSquare },
  { label: "Reports",       href: "/reports",       icon: FileText },
  { label: "Supervisors",   href: "/supervisors",   icon: UserCog },
  { label: "Documents",     href: "/documents",     icon: FolderOpen },
  { label: "Evaluations",   href: "/evaluations",   icon: Star },
  { label: "Exit",          href: "/exit",          icon: DoorOpen },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const supervisorNav: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { label: "My Interns",    href: "/interns",       icon: Users },
  { label: "Tasks",         href: "/tasks",         icon: CheckSquare },
  { label: "Reports",       href: "/reports",       icon: FileText },
  { label: "Evaluations",   href: "/evaluations",   icon: Star },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const unreadCount = useUnreadCount().data ?? 0;
  const pendingCount = usePendingCount().data ?? 0;

  const navItems = user?.role === "SUPERVISOR" ? supervisorNav : hrNav;

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully.");
    router.replace("/login");
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <aside className="flex w-60 flex-col bg-card border-r border-border/60">
      {/* Brand */}
      <div className="flex h-14 items-center px-5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <WhippieLogo size={28} />
          <span className="text-base font-bold tracking-tight text-foreground">
            Whippie
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3 scrollbar-thin"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="space-y-0.5 px-2">
          {navItems.map((item, i) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const isNotif = item.href === "/notifications";
            const isVerification = item.href === "/verification";
            const badgeCount = isNotif ? unreadCount : isVerification ? pendingCount : 0;

            return (
              <li
                key={item.href}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/40" />
                  )}

                  <Icon className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isActive ? "" : "group-hover:scale-110"
                  )} />

                  <span className="flex-1 truncate">{item.label}</span>

                  {/* Badge for notifications or verification queue */}
                  {badgeCount > 0 && (
                    <span className={cn(
                      "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : isVerification
                          ? "bg-amber-500 text-white animate-pulse-dot"
                          : "bg-primary text-primary-foreground animate-pulse-dot"
                    )}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-border/60 p-3 space-y-1">
        {user && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-accent/50">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-8 w-8 shrink-0 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {user.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
