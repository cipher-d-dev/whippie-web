"use client";

/**
 * One live connection per signed-in person, to their private Ably channel.
 * Chat screens subscribe to events here; if live updates aren't available
 * (no Ably key on the server, or the connection drops) `isLive()` is false and
 * the screens fall back to checking every few seconds.
 */
import type * as AblyTypes from "ably";
import { getRealtimeToken, type ChatMessage } from "./api";

export type ChatEvent =
  | { name: "message"; data: { type: "new" | "update"; message: ChatMessage } }
  | { name: "state"; data: { conversationId: string; userId: string; readAt: string | null; deliveredAt: string | null } }
  | { name: "typing"; data: { conversationId: string; userId: string; name: string } };

type Listener = (e: ChatEvent) => void;

const listeners = new Set<Listener>();
const liveListeners = new Set<(live: boolean) => void>();
let client: AblyTypes.Realtime | null = null;
let userId: string | null = null;
let live = false;

function setLive(v: boolean) {
  if (live === v) return;
  live = v;
  liveListeners.forEach((l) => l(v));
}

export function isLive() {
  return live;
}

export function onLiveChange(l: (live: boolean) => void) {
  liveListeners.add(l);
  return () => void liveListeners.delete(l);
}

export function onChatEvent(l: Listener) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

export async function connectChat(forUserId: string) {
  if (client && userId === forUserId) return;
  disconnectChat();
  userId = forUserId;

  let first: Awaited<ReturnType<typeof getRealtimeToken>>;
  try {
    first = await getRealtimeToken();
  } catch {
    return; // server asleep or offline: polling covers it
  }
  if (!first.enabled || userId !== forUserId) return;

  const Ably = await import("ably");
  let pending: unknown = first.tokenRequest;
  client = new Ably.Realtime({
    authCallback: (_params, cb) => {
      const use = pending;
      pending = null;
      if (use) return cb(null, use as AblyTypes.TokenRequest);
      getRealtimeToken()
        .then((r) => cb(null, r.tokenRequest as AblyTypes.TokenRequest))
        .catch((e: Error) => cb(e.message, null));
    },
    closeOnUnload: true,
  });
  client.connection.on((change) => setLive(change.current === "connected"));
  const channel = client.channels.get(`user:${forUserId}`);
  await channel.subscribe((msg) => {
    const event = { name: msg.name, data: msg.data } as ChatEvent;
    listeners.forEach((l) => l(event));
  });
}

export function disconnectChat() {
  client?.close();
  client = null;
  userId = null;
  setLive(false);
}
