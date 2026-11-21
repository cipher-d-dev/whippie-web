/** Display formatters shared across pages. All return "—" for empty input. */

export function fmtDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", opts);
}

export function fmtShortDate(iso?: string | null) {
  return fmtDate(iso, { day: "numeric", month: "short" });
}

export function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "09:12" today, "Yesterday", weekday this week, otherwise "12 Nov". */
export function fmtWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (days === 0) return fmtTime(iso);
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return fmtShortDate(iso);
}

export function fmtMeters(m?: number | null) {
  if (m === undefined || m === null) return "—";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function fullName(p?: { firstName?: string; lastName?: string } | string | null) {
  if (!p || typeof p === "string") return "—";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";
}

/** Programme progress in weeks, from start/end dates. */
export function programmeProgress(start?: string | null, end?: string | null, now = new Date()) {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!(e > s)) return null;
  const totalWeeks = Math.max(1, Math.round((e - s) / (7 * 86_400_000)));
  const elapsed = Math.min(Math.max(now.getTime() - s, 0), e - s);
  const week = Math.min(totalWeeks, Math.max(1, Math.ceil(elapsed / (7 * 86_400_000))));
  return { week, totalWeeks, percent: Math.round((elapsed / (e - s)) * 100) };
}

export const INTERNSHIP_TYPE_LABEL: Record<string, string> = {
  INTERNSHIP: "Intern",
  NYSC_IT: "Corps member",
};
