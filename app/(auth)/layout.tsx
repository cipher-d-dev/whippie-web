import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { ShieldCheck, Users, CalendarCheck, CheckCircle2 } from "lucide-react";

import type { ReactNode } from "react";

/**
 * Centered auth layout adhering to UI-UX Pro Max Enterprise Minimal rules:
 * - Subtle neutral background with fine dotted grid texture
 * - Clean vertical centering without distracting sidebars or AI cybersecurity gimmicks
 * - Focused, accessible container
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50/60 dark:bg-background selection:bg-primary/10">
      {/* Subtle architectural dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Centered Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </main>

      {/* Clean, quiet institutional footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground/80 border-t border-border/40">
        <p>&copy; {new Date().getFullYear()} DAAR Communications Plc. All rights reserved.</p>
      </footer>
    </div>
  );
}
