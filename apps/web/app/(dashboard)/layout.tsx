import { AppShell } from "@/components/layout/AppShell";

/**
 * Dashboard group layout.
 * Wraps all authenticated pages in the application shell (sidebar + header).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
