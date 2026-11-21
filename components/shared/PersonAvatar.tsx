import { cn } from "@/lib/utils/cn";

// Soft tints for initials. A name always gets the same tint, so people are
// easier to spot across lists. Each pair passes 4.5:1 in light and dark.
const TINTS = [
  "bg-[#E3ECFF] text-[#0F4FDB] dark:bg-[#172447] dark:text-[#9DBBFF]",
  "bg-[#E6F6EC] text-[#116B3B] dark:bg-[#10261A] dark:text-[#6EE7A0]",
  "bg-[#FFF1DB] text-[#8A5300] dark:bg-[#2A1F08] dark:text-[#FCD34D]",
  "bg-[#F1E8FF] text-[#5B2EA6] dark:bg-[#231739] dark:text-[#C4B5FD]",
  "bg-[#FFE4E6] text-[#9F1239] dark:bg-[#2C1418] dark:text-[#FDA4AF]",
  "bg-[#E0F2FE] text-[#075985] dark:bg-[#0C2233] dark:text-[#7DD3FC]",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
};

export function PersonAvatar({
  firstName,
  lastName,
  src,
  size = "sm",
  className,
}: {
  firstName?: string;
  lastName?: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const base = cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", SIZES[size], className);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn(base, "object-cover")} />;
  }
  return (
    <span aria-hidden="true" className={cn(base, TINTS[hash(name) % TINTS.length])} title={name}>
      {initials}
    </span>
  );
}

/** Avatar + name + optional second line, the standard way to show a person in a row. */
export function PersonCell({
  firstName,
  lastName,
  sub,
  src,
  size = "sm",
}: {
  firstName?: string;
  lastName?: string;
  sub?: React.ReactNode;
  src?: string | null;
  size?: keyof typeof SIZES;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <PersonAvatar firstName={firstName} lastName={lastName} src={src} size={size} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">
          {firstName} {lastName}
        </span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    </span>
  );
}
