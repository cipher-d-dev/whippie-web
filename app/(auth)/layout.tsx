import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { ShieldCheck, Users, CalendarCheck, CheckCircle2 } from "lucide-react";

/**
 * Modernized Auth layout — high-end SaaS split-panel.
 * Left: Rich dark executive slate backdrop with subtle glowing accents and social proof badges.
 * Right: Clean, centered authentication card.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/20">
      {/* Left Brand Showcase — Desktop */}
      <div className="relative hidden lg:flex lg:w-[48%] xl:w-[46%] flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white border-r border-slate-800/80">
        {/* Subtle Ambient Radial Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-indigo-500/15 blur-[120px]" />

        {/* Technical Grid Pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Header & Logo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md shadow-inner">
            <WhippieLogo size={32} className="brightness-200" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">
              Whippie
            </span>
            <span className="text-xs font-medium text-slate-400 block tracking-wide">
              DAAR Communications Plc
            </span>
          </div>
        </div>

        {/* Hero Narrative & Stats in Middle */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300 backdrop-blur-md mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
            <span>Official HR & Administration Portal</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
            Streamline your intern operations with precision.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-md font-normal">
            The unified system for DAAR Communications subsidiaries — AIT,
            Raypower, and Corporate. Supervise verify queues, live geofenced attendance,
            milestone reviews, and certified evaluations.
          </p>

          {/* Value Prop Highlights */}
          <div className="mt-8 grid grid-cols-1 gap-3.5 max-w-md">
            {[
              {
                icon: Users,
                title: "Cohort Management",
                desc: "Real-time candidate verification and department routing",
              },
              {
                icon: CalendarCheck,
                title: "Live Geofenced Attendance",
                desc: "GPS-validated check-in monitoring across all stations",
              },
              {
                icon: CheckCircle2,
                title: "Automated Evaluations",
                desc: "Standardized supervisor assessments and exportable reports",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 backdrop-blur-sm transition-colors hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white/95">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-6">
          <span>&copy; {new Date().getFullYear()} DAAR Communications Plc</span>
          <span className="font-mono text-[11px] text-slate-600">v1.0 Staff Access</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
        {children}
      </div>
    </div>
  );
}
