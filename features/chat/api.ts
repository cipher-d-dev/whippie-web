import { apiGet, apiPost, apiPatch, apiDelete, apiUploadFile } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

const BASE = "/api/v1/chat";

export type ConversationKind = "INTERN_HR" | "STAFF_DM";

export interface ChatWith {
  kind: "HR" | "INTERN" | "HR_PERSON" | "SUPERVISOR";
  name: string;
  subtitle?: string | null;
  internId?: string;
  userId?: string;
  internshipType?: string | null;
  lastSeenAt?: string | null;
}

export interface ConversationSummary {
  id: string;
  kind: ConversationKind;
  with: ChatWith;
  lastMessage: { id: string; senderId: string; senderName: string | null; text: string; deleted: boolean; at: string } | null;
  lastMessageAt: string | null;
  unread: number;
  myReadAt: string | null;
  otherReadAt: string | null;
  otherDeliveredAt: string | null;
  createdAt: string;
}

export interface ChatAttachment { index: number; name: string; mime: string; size: number }

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: { id: string; name: string; role: string | null };
  text: string;
  attachments: ChatAttachment[];
  replyTo: { id: string; senderName: string; text: string; deleted: boolean } | null;
  clientId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface MessagePage {
  messages: ChatMessage[];
  hasOlder: boolean;
  hasNewer: boolean;
  myReadAt: string | null;
  otherReadAt: string | null;
  otherDeliveredAt: string | null;
}

export interface UploadedFile { id: string; name: string; mime: string; size: number }

const unwrap = <T,>(r: ApiResponse<T>) => r.data as T;

export const listConversations = (params: { search?: string; kind?: ConversationKind } = {}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.kind) qs.set("kind", params.kind);
  return apiGet<ApiResponse<{ conversations: ConversationSummary[] }>>(`${BASE}/conversations${qs.size ? `?${qs}` : ""}`).then((r) => unwrap(r).conversations);
};

export const openConversation = (body: { internId?: string; userId?: string } = {}) =>
  apiPost<ApiResponse<{ conversation: ConversationSummary }>>(`${BASE}/conversations`, body).then((r) => unwrap(r).conversation);

export const getConversation = (id: string) =>
  apiGet<ApiResponse<{ conversation: ConversationSummary }>>(`${BASE}/conversations/${id}`).then((r) => unwrap(r).conversation);

export const listMessages = (id: string, q: { before?: string; after?: string; around?: string; limit?: number } = {}) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined) qs.set(k, String(v));
  return apiGet<ApiResponse<MessagePage>>(`${BASE}/conversations/${id}/messages${qs.size ? `?${qs}` : ""}`).then(unwrap);
};

export const sendMessage = (id: string, body: { text: string; replyTo?: string; uploads?: string[]; clientId?: string }) =>
  apiPost<ApiResponse<{ message: ChatMessage }>>(`${BASE}/conversations/${id}/messages`, body).then((r) => unwrap(r).message);

export const editMessage = (messageId: string, text: string) =>
  apiPatch<ApiResponse<{ message: ChatMessage }>>(`${BASE}/messages/${messageId}`, { text }).then((r) => unwrap(r).message);

export const deleteMessage = (messageId: string) =>
  apiDelete<ApiResponse<{ message: ChatMessage }>>(`${BASE}/messages/${messageId}`).then((r) => unwrap(r).message);

export const markRead = (id: string) => apiPost<ApiResponse<{ readAt: string }>>(`${BASE}/conversations/${id}/read`);
export const markDelivered = () => apiPost<ApiResponse<{ updated: number }>>(`${BASE}/delivered`);
export const sendTyping = (id: string) => apiPost<ApiResponse<unknown>>(`${BASE}/conversations/${id}/typing`);
export const getUnread = () => apiGet<ApiResponse<{ chats: number }>>(`${BASE}/unread`).then((r) => unwrap(r).chats);
export const getRealtimeToken = () =>
  apiGet<ApiResponse<{ enabled: boolean; tokenRequest: unknown }>>(`${BASE}/realtime-token`).then(unwrap);

export const uploadChatFile = (file: Blob, name: string) =>
  apiUploadFile<ApiResponse<{ upload: UploadedFile }>>(`${BASE}/uploads?name=${encodeURIComponent(name)}`, file).then((r) => unwrap(r).upload);

export const attachmentPath = (messageId: string, index: number) => `${BASE}/messages/${messageId}/attachments/${index}`;

export interface ChatContacts {
  interns: { internId: string; name: string; subtitle: string | null; internshipType: string | null }[];
  people: { userId: string; name: string; subtitle: string; role: string }[];
}
export const listContacts = () => apiGet<ApiResponse<ChatContacts>>(`${BASE}/contacts`).then(unwrap);
