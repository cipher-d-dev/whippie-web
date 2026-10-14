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
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// ─── Nav items ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const hrNav: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",    icon: LayoutDashboard },
  { label: "Interns",         href: "/interns",      icon: Users },
  { label: "Departments",     href: "/departments",  icon: Building2 },
  { label: "Onboarding",      href: "/onboarding",   icon: ClipboardCheck },
  { label: "Attendance",      href: "/attendance",   icon: CalendarDays },
  { label: "Tasks",           href: "/tasks",        icon: CheckSquare },
  { label: "Reports",         href: "/reports",      icon: FileText },
  { label: "Supervisors",     href: "/supervisors",  icon: UserCog },
  { label: "Documents",       href: "/documents",    icon: FolderOpen },
  { label: "Evaluations",     href: "/evaluations",  icon: Star },
  { label: "Exit",            href: "/exit",         icon: DoorOpen },
];

const supervisorNav: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",    icon: LayoutDashboard },
  { label: "My Interns",      href: "/interns",      icon: Users },
  { label: "Tasks",           href: "/tasks",        icon: CheckSquare },
  { label: "Reports",         href: "/reports",      icon: FileText },
  { label: "Evaluations",     href: "/evaluations",  icon: Star },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = user?.role === "SUPERVISOR" ? supervisorNav : hrNav;

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully.");
    router.replace("/login");
  };

  return (
    <aside className="flex w-60 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center border-b px-5">
        <span className="text-lg font-bold tracking-tight text-primary">
          Whippe
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 text-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t p-3">
        {user && (
          <div className="mb-2 px-3 py-1">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
