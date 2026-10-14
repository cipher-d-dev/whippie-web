"use client";

import { useAuth } from "@/lib/auth/context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  CheckSquare,
} from "lucide-react";

const placeholderStats = [
  { label: "Active Interns",      value: "—", description: "Currently placed",      icon: Users },
  { label: "Pending Onboarding",  value: "—", description: "Awaiting completion",   icon: ClipboardCheck },
  { label: "Attendance Today",    value: "—", description: "Check-ins recorded",    icon: CalendarDays },
  { label: "Overdue Tasks",       value: "—", description: "Across all interns",    icon: CheckSquare },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.firstName ?? "—"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at DAAR Communications today.
          </p>
        </div>
        {user && (
          <Badge
            variant={user.role === "HR" ? "default" : "secondary"}
            className="px-3 py-1 text-sm"
          >
            {user.role}
          </Badge>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
                <CardDescription className="mt-1 text-xs">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder notice */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Dashboard metrics will populate as you add interns, attendance
            records, and tasks.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start by creating departments and supervisor profiles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
