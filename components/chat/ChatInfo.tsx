"use client";

import { useState } from "react";
import { ArrowLeft, Ban, Bell, BellOff, Building2, CalendarDays, ExternalLink, FileText, Flag, GraduationCap, Image as ImageIcon, Link2, Loader2, MessageCircle, Mic, Users, X } from "lucide-react";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { cn } from "@/lib/utils/cn";
import { apiGetBlob, attachmentPath, type ChatInfo as Info, type SharedFile } from "@/features/chat/api";
import { useChatInfo, useChatModeration } from "@/features/chat/hooks";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PrivateImage, VoicePlayer } from "./Attachments";
import { fileSize, initials, lastSeen } from "./format";

const TYPE_LABEL: Record<string, string> = { NYSC_IT: "Corps member", INTERNSHIP: "Intern" };
type Tab = "media" | "docs" | "voice" | "links";

/**
 * WhatsApp's "contact info": who you're talking to (basic, nothing sensitive),
 * notifications, block/report for private intern chats, and everything shared.
 */
export function ChatInfo({
  conversationId,
  onClose,
  onReport,
  profileHref,
  closeIcon = "back",
}: {
  conversationId: string;
  onClose: () => void;
  /** Private intern chats: open the report dialog */
  onReport?: () => void;
  /** Staff portal: link to the intern's full profile */
  profileHref?: string | null;
  closeIcon?: "back" | "close";
}) {
  const { data, isLoading, isError, refetch } = useChatInfo(conversationId);
  const mod = useChatModeration(conversationId);
  const [tab, setTab] = useState<Tab>("media");

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
        Couldn&apos;t load chat info.
        <button type="button" onClick={() => refetch()} className="font-medium text-primary hover:underline">Try again</button>
      </div>
    );
  }

  const c = data.conversation;
  const p = data.profile;
  const privateChat = c.kind === "INTERN_DM" && c.with.kind === "INTERN_PERSON";
  const canMute = c.with.kind !== "INTERN_PAIR";
  const first = c.with.name.split(" ")[0];
  const nm = initials(p?.name ?? c.with.name);
  const counts: Record<Tab, number> = { media: data.media.length, docs: data.docs.length, voice: data.voice.length, links: data.links.length };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="flex items-center gap-2 border-b bg-background px-3 py-2.5">
        <button type="button" onClick={onClose} aria-label="Close chat info" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
          {closeIcon === "back" ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
        <p className="text-[15px] font-semibold">{c.kind === "INTERN_HR" && c.with.kind === "HR" ? "HR team" : privateChat ? "Contact info" : "Chat info"}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Who */}
        <section className="flex flex-col items-center bg-background px-6 pb-5 pt-6 text-center">
          {c.with.kind === "HR" ? (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="h-10 w-10" /></span>
          ) : (
            <PersonAvatar firstName={nm.firstName} lastName={nm.lastName} src={p?.avatarUrl} size="xl" className="!h-24 !w-24 !text-2xl" />
          )}
          <h2 className="mt-3 text-xl font-semibold">{p?.name ?? c.with.name}</h2>
          {p?.lastSeenAt && <p className="mt-0.5 text-[13px] text-muted-foreground">{lastSeen(p.lastSeenAt)}</p>}
          {c.with.kind === "INTERN_PAIR" && <p className="mt-0.5 text-[13px] text-danger-foreground">Reported private chat · read only</p>}
        </section>

        {(p?.department || p?.internshipType || p?.since || p?.team?.length) && (
          <section className="mt-2 space-y-3 bg-background px-5 py-4 text-[14px]">
            {p?.internshipType && <Row icon={<GraduationCap />} label={TYPE_LABEL[p.internshipType] ?? p.internshipType} />}
            {p?.department && <Row icon={<Building2 />} label={p.department} sub={p.station ?? undefined} />}
            {p?.since && <Row icon={<CalendarDays />} label={`On the programme since ${new Date(p.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`} />}
            {p?.team?.length ? <Row icon={<Users />} label="Anyone in HR can read and reply" sub={p.team.join(", ")} /> : null}
          </section>
        )}

        {/* Actions */}
        <section className="mt-2 divide-y bg-background">
          {profileHref && (
            <a href={profileHref} className="flex items-center gap-3 px-5 py-3.5 text-[14px] hover:bg-muted/50"><ExternalLink className="h-5 w-5 text-muted-foreground" /> View full profile</a>
          )}
          {canMute && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-[14px] hover:bg-muted/50" disabled={mod.pending}>
                  {c.mutedUntil ? <BellOff className="h-5 w-5 text-muted-foreground" /> : <Bell className="h-5 w-5 text-muted-foreground" />}
                  <span className="flex-1">
                    Mute notifications
                    <span className="block text-[12.5px] text-muted-foreground">
                      {c.mutedUntil
                        ? new Date(c.mutedUntil).getFullYear() > 9000 ? "Muted" : `Muted until ${new Date(c.mutedUntil).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
                        : "Off"}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => void mod.mute("8h")}>For 8 hours</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void mod.mute("1w")}>For 1 week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void mod.mute("always")}>Always</DropdownMenuItem>
                {c.mutedUntil && <DropdownMenuItem onClick={() => void mod.mute("off")}>Unmute</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {privateChat && (
            <>
              <button
                type="button"
                disabled={mod.pending}
                onClick={() => {
                  if (c.blocked?.byMe) void mod.unblock();
                  else if (confirm(`Block ${first}? Neither of you will be able to send messages in this chat.`)) void mod.block();
                }}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-[14px] text-danger-foreground hover:bg-danger-soft/40"
              >
                <Ban className="h-5 w-5" /> {c.blocked?.byMe ? `Unblock ${first}` : `Block ${first}`}
              </button>
              {onReport && (
                <button type="button" onClick={onReport} className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-[14px] text-danger-foreground hover:bg-danger-soft/40">
                  <Flag className="h-5 w-5" /> Report {first} to HR
                </button>
              )}
            </>
          )}
        </section>

        {/* Shared */}
        <section className="mt-2 bg-background pb-6">
          <div role="tablist" aria-label="Shared in this chat" className="flex border-b px-2">
            {([["media", "Media", ImageIcon], ["docs", "Docs", FileText], ["voice", "Voice", Mic], ["links", "Links", Link2]] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn("flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-[13px] font-medium", tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
              >
                <Icon className="h-4 w-4" /> {label}
                {counts[k] > 0 && <span className="text-[11px] text-muted-foreground">{counts[k]}</span>}
              </button>
            ))}
          </div>
          <SharedTab tab={tab} data={data} />
        </section>
      </div>
    </div>
  );
}

function Row({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 text-left">
      <span className="mt-0.5 text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span>
        <span className="block">{label}</span>
        {sub && <span className="block text-[12.5px] text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SharedTab({ tab, data }: { tab: Tab; data: Info }) {
  const [viewing, setViewing] = useState<SharedFile | null>(null);
  const empty = (what: string) => <p className="px-6 py-10 text-center text-sm text-muted-foreground">No {what} shared in this chat yet.</p>;

  if (tab === "media") {
    if (!data.media.length) return empty("photos");
    return (
      <>
        <div className="grid grid-cols-3 gap-0.5 p-0.5 sm:grid-cols-4">
          {data.media.map((f) => (
            <button key={`${f.messageId}-${f.index}`} type="button" onClick={() => setViewing(f)} className="aspect-square overflow-hidden bg-muted" aria-label={`Open ${f.name}`}>
              <PrivateImage messageId={f.messageId} index={f.index} alt={f.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="max-w-[min(92vw,1000px)] border-0 bg-black p-2">
            <DialogTitle className="sr-only">{viewing?.name}</DialogTitle>
            {viewing && <PrivateImage messageId={viewing.messageId} index={viewing.index} alt={viewing.name} className="mx-auto max-h-[82vh] w-auto object-contain" />}
          </DialogContent>
        </Dialog>
      </>
    );
  }
  if (tab === "docs") {
    if (!data.docs.length) return empty("documents");
    return (
      <ul className="divide-y">
        {data.docs.map((f) => (
          <li key={`${f.messageId}-${f.index}`}>
            <button
              type="button"
              onClick={async () => {
                const blob = await apiGetBlob(attachmentPath(f.messageId, f.index));
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              }}
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger-foreground"><FileText className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{f.name}</span>
                <span className="block text-[12px] text-muted-foreground">PDF · {fileSize(f.size)} · {when(f.at)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }
  if (tab === "voice") {
    if (!data.voice.length) return empty("voice messages");
    return (
      <ul className="divide-y">
        {data.voice.map((f) => (
          <li key={`${f.messageId}-${f.index}`} className="flex items-center gap-3 px-5 py-2.5">
            <VoicePlayer messageId={f.messageId} a={{ ...f }} mine={false} />
            <span className="ml-auto shrink-0 text-[12px] text-muted-foreground">{when(f.at)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (!data.links.length) return empty("links");
  return (
    <ul className="divide-y">
      {data.links.map((l, i) => {
        let host = l.url;
        try { host = new URL(l.url).hostname.replace(/^www\./, ""); } catch { /* keep the raw text */ }
        return (
          <li key={`${l.messageId}-${i}`}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Link2 className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{host}</span>
                <span className="block truncate text-[12px] text-muted-foreground">{l.url}</span>
              </span>
              <span className="shrink-0 text-[12px] text-muted-foreground">{when(l.at)}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
