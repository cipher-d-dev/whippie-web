/**
 * Auth layout — split panel (branded left, form right).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel (hidden on small screens) */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-violet-500 to-violet-400 p-12 text-primary-foreground">
        {/* Decorative blobs */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center">
          {/* Logo mark */}
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
            <span className="text-2xl font-black text-white">W</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight">Whippe</h1>
          <p className="mt-3 text-lg font-medium opacity-80">
            DAAR Communications
          </p>
          <p className="mt-4 text-sm leading-relaxed opacity-65">
            Intern management platform for AIT, Raypower, Faaji, and Corporate — manage placements, track performance, and streamline the entire internship lifecycle.
          </p>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: "4", label: "Subsidiaries" },
              { value: "∞", label: "Interns tracked" },
              { value: "1", label: "Platform" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-4">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-0.5 text-[11px] font-medium opacity-70">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <p className="absolute bottom-6 text-xs opacity-40">
          © {new Date().getFullYear()} DAAR Communications
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {children}
      </div>
    </div>
  );
}
