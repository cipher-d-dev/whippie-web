"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Derive a human-readable page title from the pathname
function getPageTitle(pathname: string): string {
  const segment = pathname.split("/")[1] ?? "dashboard";
  const titles: Record<string, string> = {
    dashboard:   "Dashboard",
    interns:     "Interns",
    departments: "Departments",
    onboarding:  "Onboarding",
    attendance:  "Attendance",
    tasks:       "Tasks",
    reports:     "Reports",
    supervisors: "Supervisors",
    documents:   "Documents",
    evaluations: "Evaluations",
    exit:        "Exit & Completion",
  };
  return titles[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "HR") return "default";
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
      {/* Page title */}
      <h1 className="text-base font-semibold text-foreground">
        {getPageTitle(pathname)}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        {user && (
          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
            {user.role}
          </Badge>
        )}

        {/* Notifications bell — placeholder for Phase 11 */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {/* Unread dot — wired up in notifications phase */}
        </Button>

        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
