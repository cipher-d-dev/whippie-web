"use client";

import { useMemo, useState } from "react";
import { Ban, Camera, CheckCheck, FileText, Flag, Loader2, MessageCircle, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { cn } from "@/lib/utils/cn";
import { listContacts, type ConversationSummary } from "@/features/chat/api";
import { useConversations } from "@/features/chat/hooks";
import { initials, listTime } from "./format";

function Preview({ c, meId }: { c: ConversationSummary; meId: string }) {
  const lm = c.lastMessage;
  if (!lm) return <span className="italic">No messages yet</span>;
  if (lm.deleted) return <span className="flex items-center gap-1 italic"><Ban className="h-3.5 w-3.5" /> Message deleted</span>;
  const mine = lm.senderId === meId;
  const read = mine && c.otherReadAt && c.otherReadAt >= lm.at;
  const who = !mine && c.kind === "INTERN_HR" && c.with.kind === "INTERN" && lm.senderName && lm.senderId !== c.with.userId ? `${lm.senderName.split(" ")[0]}: ` : "";
  const icon = lm.text.startsWith("📷") ? <Camera className="h-3.5 w-3.5 shrink-0" /> : lm.text.startsWith("📄") ? <FileText className="h-3.5 w-3.5 shrink-0" /> : null;
  return (
    <span className="flex min-w-0 items-center gap-1">
      {mine && <CheckCheck className={cn("h-4 w-4 shrink-0", read ? "text-info" : "text-muted-foreground/70")} aria-label={read ? "Read" : "Sent"} />}
      {icon}
      <span className="truncate">{who}{icon ? lm.text.slice(2).trim() : lm.text}</span>
    </span>
  );
}

export function ConversationList({
  meId,
  selectedId,
  onSelect,
  canStart,
  onStart,
  starting,
}: {
  meId: string;
  selectedId: string | null;
  onSelect: (c: ConversationSummary) => void;
  canStart: boolean;
  onStart: (body: { internId?: string; userId?: string }) => void;
  starting: boolean;
}) {
  const [search, setSearch] = useState("");
  const [picker, setPicker] = useState(false);
  const { data, isLoading, isError, refetch } = useConversations();

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const all = data ?? [];
    return s ? all.filter((c) => c.with.name.toLowerCase().includes(s) || (c.with.subtitle ?? "").toLowerCase().includes(s)) : all;
  }, [data, search]);
  const interns = rows.filter((c) => c.kind === "INTERN_HR");
  const staff = rows.filter((c) => c.kind === "STAFF_DM");
  const reported = rows.filter((c) => c.kind === "INTERN_DM" && c.with.kind === "INTERN_PAIR");
  const privateChats = rows.filter((c) => c.kind === "INTERN_DM" && c.with.kind !== "INTERN_PAIR");
  const sectionCount = [interns, staff, reported, privateChats].filter((l) => l.length).length;

  const section = (title: string, list: ConversationSummary[]) =>
    list.length > 0 && (
      <div>
        {sectionCount > 1 && <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>}
        <ul>
          {list.map((c) => {
            const nm = initials(c.with.name);
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  aria-current={active ? "true" : undefined}
                  className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors", active ? "bg-primary/[0.07]" : "hover:bg-muted/60")}
                >
                  {c.with.kind === "HR" ? (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="h-5 w-5" /></span>
                  ) : (
                    <PersonAvatar firstName={nm.firstName} lastName={nm.lastName} size="lg" />
                  )}
                  <span className="min-w-0 flex-1 border-b border-border/60 pb-2.5 pt-0.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-medium">{c.with.name}</span>
                      {c.lastMessage && <span className={cn("shrink-0 text-[11.5px]", c.unread ? "font-semibold text-primary" : "text-muted-foreground")}>{listTime(c.lastMessage.at)}</span>}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-[13.5px] text-muted-foreground">
                      <Preview c={c} meId={meId} />
                      {c.unread > 0 && <span className="min-w-5 shrink-0 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold leading-5 text-primary-foreground">{c.unread}</span>}
                    </span>
                    {c.kind === "INTERN_DM" && c.with.kind === "INTERN_PAIR" ? (
                      <span className={cn("mt-0.5 flex items-center gap-1 text-[11.5px] font-medium", c.reportResolvedAt ? "text-muted-foreground" : "text-danger-foreground")}>
                        <Flag className="h-3 w-3" /> {c.reportResolvedAt ? "Report reviewed" : `Reported${c.reports?.length && c.reports.length > 1 ? ` ${c.reports.length} times` : ""}`}
                      </span>
                    ) : c.with.subtitle && <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground/80">{c.with.subtitle}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <h2 className="flex-1 text-lg font-semibold">Chats</h2>
        {canStart && (
          <Button size="sm" onClick={() => setPicker(true)} disabled={starting}>
            {starting ? <Loader2 className="animate-spin" /> : <Plus />} New chat
          </Button>
        )}
      </div>
      <div className="relative px-4 pb-2">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats" aria-label="Search chats" className="h-9 rounded-full bg-muted/60 pl-9" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Couldn&apos;t load chats.
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">{search ? "No chats match" : "No chats yet"}</p>
            {!search && canStart && <p className="mt-1 text-xs text-muted-foreground">Start one with New chat. Interns can also message HR from their app.</p>}
          </div>
        ) : (
          <>
            {section("Reported", reported)}
            {section("HR", interns.filter((c) => c.with.kind === "HR"))}
            {section("Interns", interns.filter((c) => c.with.kind !== "HR"))}
            {section("Staff", staff)}
            {section("Chats", privateChats)}
          </>
        )}
      </div>
      {canStart && <NewChatDialog open={picker} onOpenChange={setPicker} onPick={(b) => { setPicker(false); onStart(b); }} />}
    </div>
  );
}

function NewChatDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (b: { internId?: string; userId?: string }) => void }) {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["chat", "contacts"], queryFn: listContacts, enabled: open, staleTime: 60_000 });
  const s = q.trim().toLowerCase();
  const match = (n: string, sub?: string | null) => !s || n.toLowerCase().includes(s) || (sub ?? "").toLowerCase().includes(s);
  const interns = (data?.interns ?? []).filter((i) => match(i.name, i.subtitle));
  const people = (data?.people ?? []).filter((p) => match(p.name, p.subtitle));

  const row = (key: string, name: string, sub: string | null, onClick: () => void) => {
    const nm = initials(name);
    return (
      <li key={key}>
        <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted">
          <PersonAvatar firstName={nm.firstName} lastName={nm.lastName} size="md" />
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{name}</span>{sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}</span>
        </button>
      </li>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(""); }}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New chat</DialogTitle>
          <DialogDescription>
            {data?.interns.length
              ? "Message an intern (the whole HR team shares intern chats) or a supervisor directly."
              : data?.people[0]?.role === "INTERN"
                ? "Message another intern privately. Only the two of you can see the chat."
                : "Message someone in HR directly."}
          </DialogDescription>
        </DialogHeader>
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or department" aria-label="Search people" />
        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {people.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{data?.interns.length ? "Supervisors" : data?.people[0]?.role === "INTERN" ? "Interns" : "HR"}</p>
                  <ul>{people.map((p) => row(p.userId, p.name, p.subtitle, () => onPick({ userId: p.userId })))}</ul>
                </>
              )}
              {interns.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Interns</p>
                  <ul>{interns.map((i) => row(i.internId, i.name, i.subtitle, () => onPick({ internId: i.internId })))}</ul>
                </>
              )}
              {!people.length && !interns.length && <p className="p-6 text-center text-sm text-muted-foreground">Nobody matches.</p>}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
