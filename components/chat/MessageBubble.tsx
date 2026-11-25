"use client";

import { memo, useRef, useState } from "react";
import { AlertCircle, Ban, Check, CheckCheck, Clock3, Copy, Flag, MoreHorizontal, Pencil, Plus, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import type { ThreadMessage } from "@/features/chat/hooks";
import { MessageAttachments } from "./Attachments";
import { clock } from "./format";
import { RichText, stripFormatting } from "./RichText";
import { QUICK_REACTIONS, isEmojiOnly, stickerLabel } from "./emoji-data";

const SWIPE_TRIGGER = 56;
const EDIT_WINDOW_MS = 15 * 60_000;
const DELETE_WINDOW_MS = 24 * 60 * 60_000;

export type Tick = "sending" | "failed" | "sent" | "delivered" | "read";

export interface BubbleProps {
  m: ThreadMessage;
  ours: boolean;
  mine: boolean;
  /** first in a run from the same person: show name and a tail */
  first: boolean;
  showName: boolean;
  tick: Tick | null;
  highlighted: boolean;
  onReply: (m: ThreadMessage) => void;
  onJump: (messageId: string) => void;
  onEdit: (m: ThreadMessage) => void;
  onDelete: (m: ThreadMessage) => void;
  onRetry: (m: ThreadMessage) => void;
  onDiscard: (m: ThreadMessage) => void;
  /** Private intern chats: report someone else's message to HR */
  onReport?: (m: ThreadMessage) => void;
  /** Read-only view (HR reading a reported chat): no reply/edit/delete */
  readOnly?: boolean;
  meId: string;
  /** Toggle my reaction */
  onReact?: (m: ThreadMessage, emoji: string) => void;
  /** Open the full emoji picker to react */
  onPickReaction?: (m: ThreadMessage) => void;
}

function TickIcon({ tick }: { tick: Tick }) {
  if (tick === "sending") return <Clock3 className="h-3.5 w-3.5" aria-label="Sending" />;
  if (tick === "failed") return <AlertCircle className="h-3.5 w-3.5 text-danger" aria-label="Not sent" />;
  if (tick === "sent") return <Check className="h-3.5 w-3.5" aria-label="Sent" />;
  return <CheckCheck className={cn("h-3.5 w-3.5", tick === "read" && "text-[#7DD3FC]")} aria-label={tick === "read" ? "Read" : "Delivered"} />;
}

export const MessageBubble = memo(function MessageBubble(p: BubbleProps) {
  const { m, ours, mine } = p;
  const deleted = !!m.deletedAt;
  const local = m.local;
  const [dx, setDx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const start = useRef<{ x: number; y: number; locked: boolean | null } | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Swipe right to reply (phones and touch screens)
  const onTouchStart = (e: React.TouchEvent) => {
    if (deleted || local || p.readOnly) return;
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, locked: null };
    // Long press opens the menu (reply, copy, edit, delete)
    press.current = setTimeout(() => { setMenuOpen(true); navigator.vibrate?.(15); start.current = null; }, 480);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = start.current;
    if (!s) return;
    const t = e.touches[0];
    const x = t.clientX - s.x;
    const y = t.clientY - s.y;
    if (Math.abs(x) > 8 || Math.abs(y) > 8) clearTimeout(press.current);
    if (s.locked === null && (Math.abs(x) > 8 || Math.abs(y) > 8)) s.locked = Math.abs(x) > Math.abs(y) && x > 0;
    if (s.locked) setDx(Math.max(0, Math.min(80, x * 0.7)));
  };
  const onTouchEnd = () => {
    clearTimeout(press.current);
    if (dx >= SWIPE_TRIGGER) {
      p.onReply(m);
      navigator.vibrate?.(10);
    }
    setDx(0);
    start.current = null;
  };

  const age = Date.now() - new Date(m.createdAt).getTime();
  const canEdit = !p.readOnly && mine && !deleted && !local && !!m.text && age < EDIT_WINDOW_MS;
  const canDelete = !p.readOnly && mine && !deleted && !local && age < DELETE_WINDOW_MS;
  const copy = () => navigator.clipboard?.writeText(m.text).then(() => toast.success("Copied"));
  const canReact = !p.readOnly && !deleted && !local && !!p.onReact;
  const myReaction = m.reactions?.find((r) => r.users.some((u) => u.id === p.meId))?.emoji;
  // Stickers and messages of only 1–3 emoji are shown large without a bubble, like WhatsApp.
  const bare = !deleted && (!!m.sticker || (isEmojiOnly(m.text) && !m.attachments.length && !m.replyTo));

  const sideBtn = "hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 sm:flex";
  const actions = (
    <span className={cn("flex items-center", ours ? "flex-row-reverse" : "flex-row")}>
      {!p.readOnly && <button type="button" onClick={() => p.onReply(m)} aria-label="Reply" className={sideBtn}><Reply className="h-4 w-4" /></button>}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="Message options" className={cn(sideBtn, "flex w-0 overflow-hidden sm:w-7", menuOpen && "sm:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={ours ? "end" : "start"} className="w-56">
          {canReact && (
            <div className="flex items-center justify-between gap-0.5 px-1 pb-1 pt-0.5" role="group" aria-label="React">
              {QUICK_REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { p.onReact!(m, e); setMenuOpen(false); }}
                  aria-label={`React ${e}`}
                  aria-pressed={myReaction === e}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xl transition-transform hover:scale-110", myReaction === e && "bg-primary/15")}
                >
                  {e}
                </button>
              ))}
              {p.onPickReaction && (
                <button type="button" onClick={() => { setMenuOpen(false); p.onPickReaction!(m); }} aria-label="More reactions" className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {!p.readOnly && <DropdownMenuItem onClick={() => p.onReply(m)}><Reply className="mr-2 h-4 w-4" /> Reply</DropdownMenuItem>}
          {m.text && <DropdownMenuItem onClick={copy}><Copy className="mr-2 h-4 w-4" /> Copy</DropdownMenuItem>}
          {p.onReport && !mine && (
            <DropdownMenuItem onClick={() => p.onReport!(m)} className="text-danger-foreground focus:text-danger-foreground"><Flag className="mr-2 h-4 w-4" /> Report to HR</DropdownMenuItem>
          )}
          {canEdit && <DropdownMenuItem onClick={() => p.onEdit(m)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
          {canDelete && (
            <DropdownMenuItem onClick={() => p.onDelete(m)} className="text-danger-foreground focus:text-danger-foreground">
              <Trash2 className="mr-2 h-4 w-4" /> Delete for everyone
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );

  return (
    <div
      id={`msg-${m.id}`}
      onContextMenu={(e) => { if (!deleted && !local && (e.nativeEvent as PointerEvent).pointerType !== "mouse" && matchMedia("(pointer: coarse)").matches) { e.preventDefault(); setMenuOpen(true); } }}
      className={cn("group relative flex select-text px-3 [-webkit-touch-callout:none] sm:px-6", ours ? "justify-end" : "justify-start", p.first ? "mt-2" : "mt-0.5")}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* reply arrow revealed by the swipe */}
      <span
        aria-hidden
        className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-opacity"
        style={{ opacity: Math.min(1, dx / SWIPE_TRIGGER), transform: `translateY(-50%) scale(${0.6 + Math.min(1, dx / SWIPE_TRIGGER) * 0.4})` }}
      >
        <Reply className="h-4 w-4" />
      </span>

      <div
        className={cn("relative flex max-w-[min(78%,560px)] items-center gap-1", (m.reactions?.length ?? 0) > 0 && "mb-3.5")}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform 160ms ease-out" }}
      >
        {/* desktop: actions beside the bubble on hover */}
        {!deleted && !local && ours && actions}

        <div
          className={cn(
            "relative min-w-[84px] rounded-2xl text-[14.5px] leading-snug transition-colors",
            bare
              ? "flex flex-col items-end bg-transparent p-0"
              : cn("px-3 pb-1.5 pt-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.08)]", ours ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border"),
            !bare && p.first && (ours ? "rounded-tr-md" : "rounded-tl-md"),
            p.highlighted && (ours ? "ring-4 ring-primary/30" : "ring-4 ring-primary/25"),
            local?.status === "failed" && "opacity-80",
          )}
        >
          {p.showName && (
            <p className={cn("mb-0.5 self-start text-[12.5px] font-semibold", bare ? "text-primary" : ours ? "text-white/85" : "text-primary")}>
              {m.sender.name}{m.sender.role === "HR" ? " · HR" : ""}
            </p>
          )}

          {m.replyTo && !deleted && (
            <button
              type="button"
              onClick={() => p.onJump(m.replyTo!.id)}
              className={cn(
                "mb-1.5 block w-full rounded-lg border-l-[3px] px-2.5 py-1.5 text-left text-[13px]",
                ours ? "border-white/70 bg-white/15 hover:bg-white/20" : "border-primary bg-primary/[0.06] hover:bg-primary/10",
              )}
            >
              <span className={cn("block text-[12px] font-semibold", ours ? "text-white" : "text-primary")}>{m.replyTo.senderName}</span>
              <span className={cn("line-clamp-2", ours ? "text-white/85" : "text-muted-foreground")}>
                {m.replyTo.deleted ? <em>This message was deleted</em> : stripFormatting(m.replyTo.text)}
              </span>
            </button>
          )}

          {deleted ? (
            <p className={cn("flex items-center gap-1.5 italic", ours ? "text-white/80" : "text-muted-foreground")}>
              <Ban className="h-3.5 w-3.5" /> {mine ? "You deleted this message" : "This message was deleted"}
            </p>
          ) : m.sticker ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/stickers/${m.sticker}.svg`} alt={`Sticker: ${stickerLabel(m.sticker)}`} className="h-36 w-36 select-none" draggable={false} />
          ) : bare ? (
            <p className="text-[44px] leading-tight" aria-label={m.text}>{m.text}</p>
          ) : (
            <>
              {m.attachments.length > 0 && (
                <div className={cn(m.text && "mb-1.5")}>
                  <MessageAttachments messageId={m.id} attachments={m.attachments} localFiles={local?.files} mine={ours} />
                </div>
              )}
              {m.text && (
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  <RichText text={m.text} />
                  {/* room for the time so it never overlaps the last line */}
                  <span aria-hidden className="inline-block w-[72px]" />
                </p>
              )}
            </>
          )}

          <span className={cn(
            "flex items-center gap-1 text-[11px]",
            bare
              ? "mt-0.5 rounded-full bg-card/90 px-1.5 py-0.5 text-muted-foreground shadow-sm ring-1 ring-border"
              : cn(ours ? "text-white/75" : "text-muted-foreground", !m.text && !deleted ? "mt-1 justify-end" : "absolute bottom-1 right-2.5"),
          )}>
            {m.editedAt && !deleted && <span>edited</span>}
            <time dateTime={m.createdAt}>{clock(m.createdAt)}</time>
            {p.tick && <span className={cn(bare && p.tick === "read" && "[&_svg]:text-info")}><TickIcon tick={p.tick} /></span>}
          </span>

          {(m.reactions?.length ?? 0) > 0 && (
            <div className={cn("absolute -bottom-4 z-[1] flex gap-0.5", ours ? "right-2" : "left-2")}>
              {m.reactions!.map((r) => {
                const mineHere = r.users.some((u) => u.id === p.meId);
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    disabled={!canReact}
                    onClick={() => p.onReact?.(m, r.emoji)}
                    title={r.users.map((u) => (u.id === p.meId ? "You" : u.name)).join(", ")}
                    aria-label={`${r.emoji} ${r.users.length}: ${r.users.map((u) => (u.id === p.meId ? "you" : u.name)).join(", ")}${mineHere ? ". Tap to remove yours" : ""}`}
                    className={cn("flex h-6 items-center gap-0.5 rounded-full bg-card px-1.5 text-[13px] shadow-sm ring-1", mineHere ? "ring-primary/50" : "ring-border")}
                  >
                    <span>{r.emoji}</span>
                    {r.users.length > 1 && <span className="text-[11px] font-medium text-muted-foreground">{r.users.length}</span>}
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {!deleted && !local && !ours && actions}
      </div>

      {local?.status === "failed" && (
        <div className="ml-2 flex flex-col justify-center gap-1 text-[12px]">
          <button type="button" onClick={() => p.onRetry(m)} className="font-medium text-danger-foreground hover:underline">Tap to retry</button>
          <button type="button" onClick={() => p.onDiscard(m)} className="text-muted-foreground hover:underline">Remove</button>
        </div>
      )}
    </div>
  );
});
