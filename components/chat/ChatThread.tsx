"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BellOff, ChevronDown, Loader2, MessageCircle, Wifi, WifiOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmojiPanel } from "./EmojiPanel";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage, ConversationSummary } from "@/features/chat/api";
import { useThread, type ThreadMessage } from "@/features/chat/hooks";
import { Composer, type ComposerHandle } from "./Composer";
import { MessageBubble, type Tick } from "./MessageBubble";
import { dayLabel, initials, isNewDay, lastSeen } from "./format";

const NEAR_BOTTOM = 120;
const GROUP_GAP_MS = 5 * 60_000;

export interface ChatViewer { id: string; name: string; role: "HR" | "SUPERVISOR" | "INTERN" | string }

/**
 * One conversation, WhatsApp style. Works for every pairing:
 * - intern chat seen by HR: HR messages (any HR member) are on the right
 * - intern chat seen by the intern: their messages on the right, HR on the left
 * - HR/supervisor DM: mine on the right
 */
export function ChatThread({
  conversation,
  me,
  onBack,
  headerExtra,
  footer,
  onReport,
  focusMessageId,
  onOpenInfo,
}: {
  conversation: ConversationSummary;
  me: ChatViewer;
  onBack?: () => void;
  headerExtra?: React.ReactNode;
  /** Shown instead of the message box when I can't send (blocked, or HR reading a reported chat) */
  footer?: React.ReactNode;
  /** Private intern chats: report a message */
  onReport?: (m: ChatMessage) => void;
  /** Scroll to and highlight this message once loaded (e.g. the reported one) */
  focusMessageId?: string | null;
  /** Tap the header (name/avatar) to see the chat info page */
  onOpenInfo?: () => void;
}) {
  const pair = conversation.with.kind === "INTERN_PAIR"; // HR reading two interns' reported chat
  const readOnly = conversation.canSend === false;
  const internChat = conversation.kind === "INTERN_HR";
  const hrViewingIntern = internChat && me.role === "HR";
  const internUserId = conversation.with.userId;

  const isOurSide = useCallback(
    (m: ChatMessage) => !pair && (m.sender.id === me.id || (hrViewingIntern && m.sender.role === "HR")),
    [me.id, hrViewingIntern, pair],
  );
  const isOtherSideUser = useCallback(
    (userId: string) => (hrViewingIntern ? userId === internUserId : userId !== me.id),
    [hrViewingIntern, internUserId, me.id],
  );

  const t = useThread(conversation.id, me, { isOurSide, isOtherSideUser });
  const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
  const [editing, setEditing] = useState<ThreadMessage | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [reactingTo, setReactingTo] = useState<ThreadMessage | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenBelow, setUnseenBelow] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);

  // Where the "unread messages" line goes: fixed when the chat opens.
  const openedReadAt = useRef<string | null | undefined>(undefined);
  useEffect(() => { openedReadAt.current = undefined; setReplyTo(null); setEditing(null); setUnseenBelow(0); }, [conversation.id]);
  if (openedReadAt.current === undefined && !t.loading) openedReadAt.current = conversation.myReadAt;
  const firstUnreadId = useMemo(() => {
    const r = openedReadAt.current;
    const m = t.messages.find((x) => !x.local && !isOurSide(x) && (!r || x.createdAt > r));
    return m?.id ?? null;
  }, [t.messages, isOurSide, t.loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const unreadAtOpen = useMemo(() => {
    const r = openedReadAt.current;
    return t.messages.filter((x) => !x.local && !isOurSide(x) && (!r || x.createdAt > r)).length;
  }, [firstUnreadId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scrolling ──────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // First load: start at the unread line, or the bottom.
  const didInitialScroll = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (t.loading || didInitialScroll.current === conversation.id) return;
    didInitialScroll.current = conversation.id;
    const target = firstUnreadId && document.getElementById(`unread-line`);
    if (target && scroller.current) scroller.current.scrollTop = target.offsetTop - 80;
    else scrollToBottom();
  }, [t.loading, conversation.id, firstUnreadId, scrollToBottom]);

  // Keep the view still when older messages are added above.
  const prevHeight = useRef<number | null>(null);
  const loadOlder = useCallback(async () => {
    if (!scroller.current) return;
    prevHeight.current = scroller.current.scrollHeight;
    await t.loadOlder();
  }, [t]);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && prevHeight.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    }
  }, [t.messages.length]);

  // New messages: follow them if I'm at the bottom (or sent them), else count them.
  const lastId = t.messages.at(-1)?.id;
  const lastCount = useRef(t.messages.length);
  useLayoutEffect(() => {
    const added = t.messages.length - lastCount.current;
    lastCount.current = t.messages.length;
    if (added <= 0 || prevHeight.current !== null || t.windowed) return;
    const last = t.messages.at(-1);
    if (!last) return;
    if (atBottom || isOurSide(last)) requestAnimationFrame(() => scrollToBottom(true));
    else setUnseenBelow((n) => n + added);
  }, [lastId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    setAtBottom(bottom);
    if (bottom && !t.windowed) setUnseenBelow(0);
    if (el.scrollTop < 200 && t.hasOlder && !t.loadingOlder) void loadOlder();
    if (bottom && t.windowed && t.hasNewer) void t.loadLatest();
  };

  // Mark as read while the newest messages are on screen and the tab is visible.
  useEffect(() => {
    if (t.loading || !atBottom || t.windowed) return;
    const go = () => document.visibilityState === "visible" && void t.markRead();
    const timer = setTimeout(go, 400);
    document.addEventListener("visibilitychange", go);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", go); };
  }, [t.loading, atBottom, t.windowed, lastId, t]);

  const jumpToLatest = async () => {
    if (t.windowed || t.hasNewer) await t.loadLatest();
    setUnseenBelow(0);
    requestAnimationFrame(() => scrollToBottom(true));
  };

  // Tap a quote: scroll to the original (loading it if it's far back) and flash it.
  const jumpTo = useCallback(async (id: string) => {
    if (!(await t.ensureLoaded(id))) return;
    requestAnimationFrame(() => {
      document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(id);
      setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1600);
    });
  }, [t]);

  // Jump to a message given from outside (e.g. the reported one), once loaded.
  const focused = useRef<string | null>(null);
  useEffect(() => {
    if (!focusMessageId || t.loading || focused.current === focusMessageId) return;
    focused.current = focusMessageId;
    const timer = setTimeout(() => void jumpTo(focusMessageId), 300);
    return () => clearTimeout(timer);
  }, [focusMessageId, t.loading, jumpTo]);

  // ── Ticks ──────────────────────────────────────────────────────────────────
  const tickFor = (m: ThreadMessage): Tick | null => {
    if (!isOurSide(m) || m.deletedAt) return null;
    if (m.local) return m.local.status === "failed" ? "failed" : "sending";
    if (t.otherReadAt && t.otherReadAt >= m.createdAt) return "read";
    if (t.otherDeliveredAt && t.otherDeliveredAt >= m.createdAt) return "delivered";
    return "sent";
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const w = conversation.with;
  const status = t.typing ? (internChat && me.role === "INTERN" ? `${t.typing.split(" ")[0]} is typing…` : "typing…") : lastSeen(w.lastSeenAt);
  const nm = initials(w.name);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b px-3 py-2.5 sm:px-4">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to chats" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenInfo}
          disabled={!onOpenInfo}
          aria-label={onOpenInfo ? `Chat info: ${w.name}` : undefined}
          className="-my-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left enabled:hover:bg-muted/50"
        >
          {w.kind === "HR" ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="h-4 w-4" /></span>
          ) : (
            <PersonAvatar firstName={nm.firstName} lastName={nm.lastName} size="md" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-semibold">{w.name}</span>
              {conversation.mutedUntil && <BellOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Muted" />}
            </span>
            <span className={cn("block truncate text-[12.5px]", t.typing ? "text-primary" : "text-muted-foreground")}>
              {status ?? w.subtitle ?? ""}
              {!t.typing && status && w.subtitle ? ` · ${w.subtitle}` : ""}
              {!t.typing && onOpenInfo && !status && !w.subtitle ? "Tap for info" : ""}
            </span>
          </span>
        </button>
        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex" title={t.live ? "Messages arrive instantly" : "Checking for new messages every few seconds"}>
          {t.live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        </span>
        {headerExtra}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="h-full overflow-y-auto overscroll-contain bg-canvas py-3"
          role="log"
          aria-live="polite"
          aria-label={`Messages with ${w.name}`}
        >
          {t.loading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : t.error && t.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              {t.error}
              <Button variant="outline" size="sm" onClick={() => void t.loadLatest()}>Try again</Button>
            </div>
          ) : t.messages.length === 0 ? (
            <div className="mx-auto mt-10 max-w-xs rounded-xl bg-card px-5 py-4 text-center text-[13px] text-muted-foreground shadow-sm">
              {internChat && me.role === "INTERN"
                ? "Ask HR anything about your internship. Anyone on the HR team can reply."
                : internChat
                  ? `Say hello to ${w.name.split(" ")[0]}. Anyone on the HR team can see and reply to this chat.`
                  : `Your messages with ${w.name} are only between the two of you.`}
            </div>
          ) : (
            <>
              {t.hasOlder && (
                <div className="flex justify-center py-2">
                  {t.loadingOlder ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                    <button type="button" onClick={() => void loadOlder()} className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm hover:text-foreground">Load older messages</button>
                  )}
                </div>
              )}
              {t.messages.map((m, i) => {
                const prev = t.messages[i - 1];
                const newDay = isNewDay(prev?.createdAt, m.createdAt);
                const ours = isOurSide(m);
                const first = newDay || !prev || prev.sender.id !== m.sender.id || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > GROUP_GAP_MS || m.id === firstUnreadId;
                // Names: an intern sees which HR person wrote; HR sees which colleague wrote.
                const showName = first && (pair || (!ours && internChat && me.role === "INTERN") || (ours && m.sender.id !== me.id));
                return (
                  <Fragment key={m.clientId ?? m.id}>
                    {newDay && (
                      <div className="sticky top-1 z-10 my-2 flex justify-center">
                        <span className="rounded-lg bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">{dayLabel(m.createdAt)}</span>
                      </div>
                    )}
                    {m.id === firstUnreadId && unreadAtOpen > 0 && !pair && (
                      <div id="unread-line" className="my-3 flex justify-center bg-primary/[0.06] py-1">
                        <span className="text-[12px] font-medium text-primary">{unreadAtOpen} unread message{unreadAtOpen === 1 ? "" : "s"}</span>
                      </div>
                    )}
                    <MessageBubble
                      m={m}
                      ours={ours}
                      mine={m.sender.id === me.id}
                      first={first}
                      showName={showName}
                      tick={tickFor(m)}
                      highlighted={highlight === m.id}
                      onReply={(x) => { setEditing(null); setReplyTo(x); }}
                      onJump={jumpTo}
                      onEdit={(x) => { setReplyTo(null); setEditing(x); }}
                      onDelete={(x) => { if (confirm("Delete this message for everyone?")) void t.remove(x); }}
                      onRetry={t.retry}
                      onDiscard={t.discard}
                      onReport={onReport}
                      readOnly={readOnly}
                      meId={me.id}
                      onReact={(x, e) => void t.react(x, e)}
                      onPickReaction={setReactingTo}
                    />
                  </Fragment>
                );
              })}
              {t.typing && (
                <div className="mt-2 flex px-3 sm:px-6">
                  <span className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-card px-3.5 py-3 shadow-sm ring-1 ring-border" aria-label={`${t.typing} is typing`}>
                    {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d * 150}ms` }} />)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {(!atBottom || t.windowed) && !t.loading && (
          <button
            type="button"
            onClick={() => void jumpToLatest()}
            aria-label={unseenBelow || t.newWhileAway ? `${unseenBelow + t.newWhileAway} new messages, go to latest` : "Go to latest message"}
            className="absolute bottom-3 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md ring-1 ring-border hover:text-foreground"
          >
            <ChevronDown className="h-5 w-5" />
            {(unseenBelow > 0 || t.newWhileAway > 0) && (
              <span className="absolute -top-1.5 right-0 min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold leading-5 text-primary-foreground">
                {unseenBelow + t.newWhileAway}
              </span>
            )}
          </button>
        )}
      </div>

      {readOnly ? (
        <div className="border-t bg-background px-4 py-3 text-center text-[13px] text-muted-foreground">{footer ?? "You can't send messages in this chat."}</div>
      ) : (
      <Composer
        ref={composer}
        replyTo={replyTo}
        editing={editing}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditing(null)}
        conversationId={conversation.id}
        onSend={(out) => { t.send(out, replyTo); setReplyTo(null); requestAnimationFrame(() => scrollToBottom(true)); }}
        onSaveEdit={(m, text) => void t.edit(m, text)}
        onTyping={t.notifyTyping}
      />
      )}

      <Dialog open={!!reactingTo} onOpenChange={(o) => !o && setReactingTo(null)}>
        <DialogContent className="max-w-[min(92vw,420px)] overflow-hidden p-0">
          <DialogTitle className="px-4 pt-4 text-base">React</DialogTitle>
          <EmojiPanel compact onEmoji={(e) => { if (reactingTo) void t.react(reactingTo, e); setReactingTo(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
