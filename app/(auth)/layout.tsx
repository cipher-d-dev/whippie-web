import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { ShieldCheck, Users, CalendarCheck, CheckCircle2 } from "lucide-react";

/**
 * Clean, modern Auth layout.
 * Left: DAAR Communications branding with clean editorial layout and value propositions.
 * Right: Minimal, focused sign-in card.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/10">
      {/* Left Brand Showcase — Desktop */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between border-r border-border/60 bg-muted/30 p-12 lg:p-14">
        {/* Top Header & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <WhippieLogo size={24} />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground block">
              Whippie
            </span>
            <span className="text-xs text-muted-foreground block">
              DAAR Communications Plc
            </span>
          </div>
        </div>

        {/* Hero Narrative & Features */}
        <div className="my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
            <span>Staff Portal</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground leading-snug">
            Internship management, simplified.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
            Centralized portal for DAAR Communications HR administrators and supervisors across AIT, Raypower, Faaji, and Corporate.
          </p>

          <div className="mt-8 space-y-3.5 max-w-sm">
            {[
              {
                icon: Users,
                title: "Cohort Management",
                desc: "Screen, approve, and assign interns directly to departments.",
              },
              {
                icon: CalendarCheck,
                title: "Attendance & Geofencing",
                desc: "Real-time verified GPS check-in records across all stations.",
              },
              {
                icon: CheckCircle2,
                title: "Evaluations & Reports",
                desc: "Structured weekly log reviews and certified performance evaluations.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/60 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-6">
          <span>&copy; {new Date().getFullYear()} DAAR Communications Plc</span>
          <span>HR & Supervisors Portal</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        {children}
      </div>
    </div>
  );
}
