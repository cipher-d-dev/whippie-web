"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "./api";
import type { ChatMessage, ConversationKind } from "./api";
import { connectChat, disconnectChat, isLive, onChatEvent, onLiveChange } from "./realtime";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (p?: object) => ["chat", "conversations", p ?? {}] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  unread: ["chat", "unread"] as const,
};

export function useLive() {
  const [live, setLive] = useState(isLive());
  useEffect(() => onLiveChange(setLive), []);
  return live;
}

/** Keeps the live connection open while signed in, and keeps lists and badges fresh. */
export function useChatConnection(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    void connectChat(userId);
    void api.markDelivered().catch(() => undefined);

    let deliverTimer: ReturnType<typeof setTimeout> | undefined;
    const off = onChatEvent((e) => {
      if (e.name === "typing") return;
      void qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
      void qc.invalidateQueries({ queryKey: chatKeys.unread });
      if (e.name === "message" && e.data.type === "new" && e.data.message.sender.id !== userId) {
        clearTimeout(deliverTimer);
        deliverTimer = setTimeout(() => void api.markDelivered().catch(() => undefined), 800);
      }
    });
    const onFocus = () => void api.markDelivered().catch(() => undefined);
    window.addEventListener("focus", onFocus);
    return () => {
      off();
      clearTimeout(deliverTimer);
      window.removeEventListener("focus", onFocus);
      disconnectChat();
    };
  }, [userId, qc]);
}

export function useConversations(params: { search?: string; kind?: ConversationKind } = {}) {
  const live = useLive();
  return useQuery({
    queryKey: chatKeys.conversations(params),
    queryFn: () => api.listConversations(params),
    refetchInterval: live ? 120_000 : 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: chatKeys.conversation(id ?? ""),
    queryFn: () => api.getConversation(id!),
    enabled: !!id,
    refetchInterval: 60_000, // "last seen" stays roughly current
  });
}

export function useChatUnread(enabled = true) {
  const live = useLive();
  return useQuery({
    queryKey: chatKeys.unread,
    queryFn: api.getUnread,
    enabled,
    refetchInterval: live ? 120_000 : 30_000,
  });
}

// ─── One open chat ───────────────────────────────────────────────────────────

export type ThreadMessage = ChatMessage & {
  /** Only on messages being sent from this device */
  local?: { status: "sending" | "failed"; files: File[]; replyToId?: string };
};

interface ThreadState {
  messages: ThreadMessage[];
  loading: boolean;
  loadingOlder: boolean;
  error: string | null;
  hasOlder: boolean;
  hasNewer: boolean;
  otherReadAt: string | null;
  otherDeliveredAt: string | null;
  /** Set when the window was moved to show an older message (jump to reply). */
  windowed: boolean;
  newWhileAway: number;
}

type Action =
  | { type: "loading" }
  | { type: "page"; page: api.MessagePage; mode: "latest" | "older" | "around" | "newer" }
  | { type: "error"; error: string }
  | { type: "olderLoading" }
  | { type: "upsert"; message: ThreadMessage; fromLive?: boolean }
  | { type: "local"; clientId: string; patch: Partial<ThreadMessage> }
  | { type: "remove"; clientId: string }
  | { type: "marks"; readAt?: string | null; deliveredAt?: string | null };

const byTime = (a: ThreadMessage, b: ThreadMessage) =>
  a.local && !b.local ? 1 : !a.local && b.local ? -1 : a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1;

function merge(list: ThreadMessage[], incoming: ThreadMessage[]) {
  const out = [...list];
  for (const m of incoming) {
    const i = out.findIndex((x) => x.id === m.id || (!!m.clientId && x.clientId === m.clientId && !!x.local));
    if (i >= 0) out[i] = { ...m, local: m.local };
    else out.push(m);
  }
  return out.sort(byTime);
}

const later = (a: string | null | undefined, b: string | null | undefined) => (!a ? b ?? null : !b ? a : a > b ? a : b);

function reducer(s: ThreadState, a: Action): ThreadState {
  switch (a.type) {
    case "loading":
      return { ...s, loading: true, error: null };
    case "olderLoading":
      return { ...s, loadingOlder: true };
    case "error":
      return { ...s, loading: false, loadingOlder: false, error: a.error };
    case "page": {
      const p = a.page;
      const marks = { otherReadAt: later(s.otherReadAt, p.otherReadAt), otherDeliveredAt: later(s.otherDeliveredAt, p.otherDeliveredAt) };
      const pending = s.messages.filter((m) => m.local);
      if (a.mode === "latest") return { ...s, ...marks, loading: false, error: null, messages: merge(pending, p.messages), hasOlder: p.hasOlder, hasNewer: false, windowed: false, newWhileAway: 0 };
      if (a.mode === "around") return { ...s, ...marks, loading: false, messages: merge(pending, p.messages), hasOlder: p.hasOlder, hasNewer: p.hasNewer, windowed: p.hasNewer };
      if (a.mode === "older") return { ...s, ...marks, loadingOlder: false, messages: merge(s.messages, p.messages), hasOlder: p.hasOlder };
      return { ...s, ...marks, messages: merge(s.messages, p.messages), hasNewer: p.hasNewer, windowed: p.hasNewer && s.windowed };
    }
    case "upsert": {
      const exists = s.messages.some((x) => x.id === a.message.id || (!!a.message.clientId && x.clientId === a.message.clientId));
      if (!exists && s.windowed) return { ...s, newWhileAway: s.newWhileAway + 1, hasNewer: true };
      return { ...s, messages: merge(s.messages, [a.message]) };
    }
    case "local":
      return { ...s, messages: s.messages.map((m) => (m.local && m.clientId === a.clientId ? { ...m, ...a.patch } : m)) };
    case "remove":
      return { ...s, messages: s.messages.filter((m) => !(m.local && m.clientId === a.clientId)) };
    case "marks":
      return { ...s, otherReadAt: later(s.otherReadAt, a.readAt), otherDeliveredAt: later(s.otherDeliveredAt, a.deliveredAt ?? a.readAt) };
  }
}

const initial: ThreadState = {
  messages: [], loading: true, loadingOlder: false, error: null, hasOlder: false, hasNewer: false,
  otherReadAt: null, otherDeliveredAt: null, windowed: false, newWhileAway: 0,
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * Messages for one chat: newest page first, older pages on scroll, a window
 * around an older message when jumping to a reply, live updates (or polling),
 * and sends that show instantly and can be retried.
 */
export function useThread(
  conversationId: string,
  me: { id: string; name: string; role: string },
  side: {
    /** Messages shown on my side (mine, or my HR colleagues' in an intern chat). */
    isOurSide: (m: ChatMessage) => boolean;
    /** Whose reading turns my ticks blue. */
    isOtherSideUser: (userId: string) => boolean;
  },
) {
  const { isOurSide } = side;
  const [s, dispatch] = useReducer(reducer, initial);
  const [typing, setTyping] = useState<string | null>(null);
  const live = useLive();
  const qc = useQueryClient();
  const stateRef = useRef(s);
  stateRef.current = s;
  const ourSideRef = useRef(isOurSide);
  ourSideRef.current = isOurSide;
  const otherUserRef = useRef(side.isOtherSideUser);
  otherUserRef.current = side.isOtherSideUser;

  const loadLatest = useCallback(async () => {
    try {
      const page = await api.listMessages(conversationId, { limit: 40 });
      dispatch({ type: "page", page, mode: "latest" });
    } catch (e) {
      dispatch({ type: "error", error: (e as Error).message || "Couldn't load messages." });
    }
  }, [conversationId]);

  useEffect(() => {
    dispatch({ type: "loading" });
    void loadLatest();
  }, [loadLatest]);

  const loadOlder = useCallback(async () => {
    const cur = stateRef.current;
    const oldest = cur.messages.find((m) => !m.local);
    if (!cur.hasOlder || cur.loadingOlder || !oldest) return;
    dispatch({ type: "olderLoading" });
    try {
      dispatch({ type: "page", page: await api.listMessages(conversationId, { before: oldest.id, limit: 40 }), mode: "older" });
    } catch {
      dispatch({ type: "error", error: "Couldn't load older messages." });
    }
  }, [conversationId]);

  /** Makes sure a message is loaded (fetching the page around it if needed). */
  const ensureLoaded = useCallback(async (messageId: string) => {
    if (stateRef.current.messages.some((m) => m.id === messageId)) return true;
    try {
      dispatch({ type: "page", page: await api.listMessages(conversationId, { around: messageId, limit: 40 }), mode: "around" });
      return true;
    } catch (e) {
      toast.error((e as Error).message || "That message is no longer here.");
      return false;
    }
  }, [conversationId]);

  // Live events for this chat
  useEffect(() => {
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    const off = onChatEvent((e) => {
      if (e.name === "message" && e.data.message.conversationId === conversationId) {
        dispatch({ type: "upsert", message: e.data.message, fromLive: true });
        if (!ourSideRef.current(e.data.message)) setTyping(null);
      } else if (e.name === "state" && e.data.conversationId === conversationId && otherUserRef.current(e.data.userId)) {
        dispatch({ type: "marks", readAt: e.data.readAt, deliveredAt: e.data.deliveredAt });
        void qc.invalidateQueries({ queryKey: chatKeys.conversation(conversationId) });
      } else if (e.name === "typing" && e.data.conversationId === conversationId && e.data.userId !== me.id) {
        setTyping(e.data.name);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => setTyping(null), 4000);
      }
    });
    return () => { off(); clearTimeout(typingTimer); };
  }, [conversationId, me.id, qc]);

  // No live connection: check for new messages every few seconds.
  useEffect(() => {
    if (live) return;
    const t = setInterval(async () => {
      const cur = stateRef.current;
      if (cur.loading || cur.windowed || document.visibilityState !== "visible") return;
      const newest = [...cur.messages].reverse().find((m) => !m.local);
      try {
        const page = newest ? await api.listMessages(conversationId, { after: newest.id, limit: 50 }) : await api.listMessages(conversationId, { limit: 40 });
        dispatch({ type: "page", page, mode: newest ? "newer" : "latest" });
      } catch { /* try again next tick */ }
    }, 5000);
    return () => clearInterval(t);
  }, [live, conversationId]);

  const deliver = useCallback(async (clientId: string, text: string, files: File[], replyToId?: string) => {
    dispatch({ type: "local", clientId, patch: { local: { status: "sending", files, replyToId } } });
    try {
      const uploads: string[] = [];
      for (const f of files) uploads.push((await api.uploadChatFile(f, f.name)).id);
      const saved = await api.sendMessage(conversationId, { text, replyTo: replyToId, uploads, clientId });
      dispatch({ type: "upsert", message: saved });
      void qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    } catch (e) {
      dispatch({ type: "local", clientId, patch: { local: { status: "failed", files, replyToId } } });
      const msg = (e as Error).message;
      if (msg && !/fetch|network/i.test(msg)) toast.error(msg);
    }
  }, [conversationId, qc]);

  const send = useCallback((text: string, files: File[], replyTo: ChatMessage | null) => {
    const clientId = uid();
    const optimistic: ThreadMessage = {
      id: `local-${clientId}`,
      conversationId,
      sender: { id: me.id, name: me.name, role: me.role },
      text,
      attachments: files.map((f, index) => ({ index, name: f.name, mime: f.type, size: f.size })),
      replyTo: replyTo ? { id: replyTo.id, senderName: replyTo.sender.name, text: replyTo.text || (replyTo.attachments[0]?.mime.startsWith("image/") ? "📷 Photo" : "📄 Document"), deleted: false } : null,
      clientId,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      local: { status: "sending", files, replyToId: replyTo?.id },
    };
    if (stateRef.current.windowed) void loadLatest();
    dispatch({ type: "upsert", message: optimistic });
    void deliver(clientId, text, files, replyTo?.id);
  }, [conversationId, me, deliver, loadLatest]);

  const retry = useCallback((m: ThreadMessage) => {
    if (m.local && m.clientId) void deliver(m.clientId, m.text, m.local.files, m.local.replyToId);
  }, [deliver]);

  const discard = useCallback((m: ThreadMessage) => m.clientId && dispatch({ type: "remove", clientId: m.clientId }), []);

  const edit = useCallback(async (m: ChatMessage, text: string) => {
    try {
      dispatch({ type: "upsert", message: await api.editMessage(m.id, text) });
    } catch (e) {
      toast.error((e as Error).message || "Couldn't edit the message.");
    }
  }, []);

  const remove = useCallback(async (m: ChatMessage) => {
    try {
      dispatch({ type: "upsert", message: await api.deleteMessage(m.id) });
      void qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    } catch (e) {
      toast.error((e as Error).message || "Couldn't delete the message.");
    }
  }, [qc]);

  const lastTypingSent = useRef(0);
  const notifyTyping = useCallback(() => {
    if (Date.now() - lastTypingSent.current < 3000) return;
    lastTypingSent.current = Date.now();
    void api.sendTyping(conversationId).catch(() => undefined);
  }, [conversationId]);

  const readInFlight = useRef<string | null>(null);
  const markRead = useCallback(async () => {
    const cur = stateRef.current;
    const newestOther = [...cur.messages].reverse().find((m) => !m.local && !ourSideRef.current(m));
    if (!newestOther || readInFlight.current === newestOther.id) return;
    readInFlight.current = newestOther.id;
    try {
      await api.markRead(conversationId);
      void qc.invalidateQueries({ queryKey: chatKeys.unread });
      void qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    } catch {
      readInFlight.current = null;
    }
  }, [conversationId, qc]);

  return useMemo(() => ({
    ...s, typing, live, loadLatest, loadOlder, ensureLoaded, send, retry, discard, edit, remove, notifyTyping, markRead,
  }), [s, typing, live, loadLatest, loadOlder, ensureLoaded, send, retry, discard, edit, remove, notifyTyping, markRead]);
}

export function useOpenConversation() {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const open = useCallback(async (body: { internId?: string; userId?: string }) => {
    setPending(true);
    try {
      const c = await api.openConversation(body);
      void qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
      return c;
    } catch (e) {
      toast.error((e as Error).message || "Couldn't open the chat.");
      return null;
    } finally {
      setPending(false);
    }
  }, [qc]);
  return { open, pending };
}
