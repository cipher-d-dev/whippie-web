import { redirect } from "next/navigation";

/**
 * Root route — redirect to the dashboard shell.
 * Phase 1 will redirect unauthenticated users to /login instead.
 */
export default function RootPage() {
  redirect("/dashboard");
}
