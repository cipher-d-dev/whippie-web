/**
 * Auth layout — centred card layout for login/register pages.
 * Phase 1 will add real content.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      {children}
    </div>
  );
}
