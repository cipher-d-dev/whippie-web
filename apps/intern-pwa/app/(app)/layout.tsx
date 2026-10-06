import { BottomNav } from "@/components/layout/BottomNav";

/**
 * Authenticated app layout — wraps all intern pages in the mobile
 * shell with bottom navigation.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
