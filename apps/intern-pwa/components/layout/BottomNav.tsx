import Link from "next/link";

/**
 * Mobile bottom navigation bar.
 * Phase 1 adds active-route highlighting and role-aware items.
 */
const navItems = [
  { label: "Home", href: "/home" },
  { label: "Tasks", href: "/tasks" },
  { label: "Attendance", href: "/attendance" },
  { label: "Reports", href: "/reports" },
  { label: "Profile", href: "/profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-card">
      <ul className="flex items-center justify-around">
        {navItems.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="flex flex-col items-center py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
