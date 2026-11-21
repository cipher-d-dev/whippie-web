import type { ReactNode } from "react";
import { WhippieLogo } from "@/components/shared/WhippieLogo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Form side */}
      <div className="flex min-h-screen flex-1 flex-col px-6 py-7 sm:px-10">
        <div className="flex items-center gap-2.5">
          <WhippieLogo size={28} />
          <span className="text-lg font-semibold tracking-[-0.02em]">Whippie</span>
        </div>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </main>
        <footer className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} DAAR Communications PLC</footer>
      </div>

      {/* Brand side */}
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[#1660FF] p-12 text-white lg:flex" aria-hidden="true">
        <WhippieLogo tone="white" size={560} className="pointer-events-none absolute -right-32 -top-16 opacity-[0.12]" />
        <p className="relative font-mono text-xs uppercase tracking-[0.08em] text-white/75">Intern management · DAAR Communications</p>
        <p className="relative max-w-[520px] text-5xl font-semibold leading-[1.04] tracking-[-0.035em]">
          Every intern, every day, in one place.
        </p>
        <p className="relative flex flex-wrap gap-6 text-sm text-white/75">
          <span>AIT</span><span>Raypower</span><span>Faaji</span><span>DAAR Corporate</span>
        </p>
      </aside>
    </div>
  );
}
