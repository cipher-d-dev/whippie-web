/** Small helpers shared by the chat screens. */

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "Today", "Yesterday", "Monday", "24 November 2026" */
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (sameDay(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  if (now.getTime() - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export function isNewDay(prev: string | undefined, cur: string) {
  return !prev || !sameDay(new Date(prev), new Date(cur));
}

/** List time: "10:42", "Yesterday", "Mon", "24/11/26" */
export function listTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  if (sameDay(d, now)) return clock(iso);
  const label = dayLabel(iso, now);
  if (label === "Yesterday") return label;
  if (now.getTime() - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** "online", "last seen today at 10:42", "last seen yesterday at 18:05", "last seen 24 Nov" */
export function lastSeen(iso: string | null | undefined, now = new Date()) {
  if (!iso) return null;
  const d = new Date(iso);
  if (now.getTime() - d.getTime() < 2 * 60_000) return "online";
  const label = dayLabel(iso, now);
  if (label === "Today") return `last seen today at ${clock(iso)}`;
  if (label === "Yesterday") return `last seen yesterday at ${clock(iso)}`;
  return `last seen ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Splits text into plain parts and links, so links can be tapped. */
export function linkify(text: string): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = [];
  const re = /\b(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/gi;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], href: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/);
  return { firstName: a, lastName: b };
}
