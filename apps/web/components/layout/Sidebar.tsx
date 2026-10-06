import Link from "next/link";

/**
 * Sidebar navigation.
 *
 * Phase 1 replaces the static link list with role-aware navigation:
 * HR users see the HR nav set; Supervisors see the Supervisor nav set.
 *
 * Navigation items are documented in 02-WHIPPE-WEB-APPLICATION.md §6.
 */

const hrNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Interns", href: "/interns" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Attendance", href: "/attendance" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
  { label: "Supervisors", href: "/supervisors" },
  { label: "Documents", href: "/documents" },
  { label: "Evaluations", href: "/evaluations" },
  { label: "Exit / Completion", href: "/exit" },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold tracking-tight">Whippe</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {hrNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
