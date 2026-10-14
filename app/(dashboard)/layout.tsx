"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    // Not logged in → login page
    if (!isAuthenticated) { router.replace("/login"); return; }
    // Intern role has no web dashboard — redirect to login
    if (user?.role === "INTERN") { router.replace("/login"); return; }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role === "INTERN") return null;

  return <AppShell>{children}</AppShell>;
}
