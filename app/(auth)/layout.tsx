import type { ReactNode } from "react";
import { WhippieLogo } from "@/components/shared/WhippieLogo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-12">
      {/* Background ambient lighting/glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-16 h-48 w-48 -translate-y-1/2 rounded-full bg-primary/8 blur-2xl" />
      </div>

      {/* Logo + wordmark */}
      <div className="mb-7 flex flex-col items-center gap-2.5 animate-fade-up">
        <WhippieLogo size={52} />
        <div className="text-center">
          <p className="text-sm font-bold text-foreground tracking-tight">Whippie</p>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">HR Management Portal</p>
        </div>
      </div>

      {/* Form card container matching intern styling */}
      <div className="w-full max-w-[380px] animate-fade-up">
        <div className="rounded-[28px] border border-border/40 bg-card p-7 shadow-xl shadow-primary/5">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-muted-foreground/70">
        <p>&copy; {new Date().getFullYear()} DAAR Communications Plc. All rights reserved.</p>
      </footer>
    </div>
  );
}
