"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Bold, Code, FileText, Italic, Keyboard, Mic, Paperclip, Pencil, SendHorizonal, Smile, Strikethrough, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/features/chat/api";
import type { Outgoing } from "@/features/chat/hooks";
import { EmojiPanel } from "./EmojiPanel";
import { stripFormatting } from "./RichText";
import { fileSize } from "./format";

const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_VOICE_SECONDS = 15 * 60;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf";

export interface ComposerHandle { focus: () => void }

/** Phones: Enter is a new line. Keyboards: Enter sends, Shift+Enter is a new line. */
const touchFirst = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

/** Photos are shrunk before sending: quicker on mobile data, and well under the size limit. */
async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// ─── Drafts: an unsent message waits in the box for next time ────────────────
const draftKey = (id: string) => `whippie-chat-draft:${id}`;
const loadDraft = (id: string) => { try { return localStorage.getItem(draftKey(id)) ?? ""; } catch { return ""; } };
const saveDraft = (id: string, text: string) => {
  try { if (text.trim()) localStorage.setItem(draftKey(id), text); else localStorage.removeItem(draftKey(id)); } catch { /* storage blocked */ }
};

// ─── Voice notes ─────────────────────────────────────────────────────────────
function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return "";
}

function useVoiceRecorder(onDone: (file: File, seconds: number) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const stopTracks = () => rec.current?.stream.getTracks().forEach((t) => t.stop());

  const start = useCallback(async () => {
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) {
      toast.error("This browser can't record voice messages.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      toast.error((e as DOMException)?.name === "NotAllowedError" ? "Allow the microphone for this site to record voice messages." : "Couldn't use the microphone.");
      return;
    }
    const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32_000 } : undefined);
    chunks.current = [];
    cancelled.current = false;
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      clearInterval(timer.current);
      stopTracks();
      setRecording(false);
      const secs = (Date.now() - started.current) / 1000;
      if (cancelled.current || secs < 0.8) return;
      const type = (r.mimeType || mime || "audio/webm").split(";")[0];
      const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
      doneRef.current(new File(chunks.current, `voice-${Date.now()}.${ext}`, { type }), secs);
    };
    rec.current = r;
    r.start(250);
    started.current = Date.now();
    setSeconds(0);
    setRecording(true);
    navigator.vibrate?.(20);
    timer.current = setInterval(() => {
      const s = (Date.now() - started.current) / 1000;
      setSeconds(s);
      if (s >= MAX_VOICE_SECONDS) r.stop();
    }, 200);
  }, []);

  const stop = useCallback(() => rec.current?.state === "recording" && rec.current.stop(), []);
  const cancel = useCallback(() => { cancelled.current = true; stop(); }, [stop]);
  useEffect(() => () => { cancelled.current = true; clearInterval(timer.current); if (rec.current?.state === "recording") rec.current.stop(); stopTracks(); }, []);

  return { recording, seconds, start, stop, cancel };
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ─── Composer ────────────────────────────────────────────────────────────────
export const Composer = forwardRef<ComposerHandle, {
  conversationId: string;
  replyTo: ChatMessage | null;
  editing: ChatMessage | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSend: (out: Outgoing) => void;
  onSaveEdit: (m: ChatMessage, text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}>(function Composer(p, ref) {
  const [text, setText] = useState(() => (typeof window === "undefined" ? "" : loadDraft(p.conversationId)));
  const [files, setFiles] = useState<File[]>([]);
  const [panel, setPanel] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecorder((file, secs) => p.onSend({ text: "", files: [], voice: { file, duration: secs } }));

  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }), []);

  // Grow with the text, up to about six lines.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [text]);

  // Keep the draft (not while editing an old message).
  useEffect(() => {
    if (p.editing) return;
    const t = setTimeout(() => saveDraft(p.conversationId, text), 300);
    return () => clearTimeout(t);
  }, [text, p.conversationId, p.editing]);

  useEffect(() => {
    if (p.editing) {
      setText(p.editing.text);
      setFiles([]);
      requestAnimationFrame(() => area.current?.focus());
    }
  }, [p.editing]);

  useEffect(() => {
    if (p.replyTo) requestAnimationFrame(() => area.current?.focus());
  }, [p.replyTo]);

  const addFiles = async (list: FileList | File[]) => {
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) { toast.error(`Up to ${MAX_FILES} files at a time.`); break; }
      if (!ACCEPT.split(",").includes(f.type)) { toast.error(`${f.name}: you can send photos and PDFs.`); continue; }
      const small = await shrinkImage(f);
      if (small.size > MAX_BYTES) { toast.error(`${f.name} is over 8 MB.`); continue; }
      next.push(small);
    }
    setFiles(next);
  };

  /** Puts text at the cursor (emoji) and keeps the cursor after it. */
  const insert = (s: string) => {
    const el = area.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => { if (el) { el.selectionStart = el.selectionEnd = start + s.length; } });
  };

  /** Wraps the selection in WhatsApp markers (*bold*, _italic_, ~strike~, ```mono```). */
  const wrap = (marker: string) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = text.slice(a, b);
    // Toggle off if it's already wrapped
    if (text.slice(a - marker.length, a) === marker && text.slice(b, b + marker.length) === marker) {
      setText(text.slice(0, a - marker.length) + sel + text.slice(b + marker.length));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a - marker.length, b - marker.length); });
      return;
    }
    const next = text.slice(0, a) + marker + (sel || "") + marker + text.slice(b);
    setText(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + marker.length, b + marker.length); });
  };

  const canSend = !!text.trim() || files.length > 0;
  const submit = () => {
    if (!canSend || p.disabled) return;
    if (p.editing) {
      if (text.trim() && text.trim() !== p.editing.text) p.onSaveEdit(p.editing, text.trim());
      p.onCancelEdit();
    } else {
      p.onSend({ text: text.trim(), files });
      saveDraft(p.conversationId, "");
    }
    setText("");
    setFiles([]);
    setPanel(false);
    area.current?.focus();
  };

  const strip = p.editing ? (
    <Strip icon={<Pencil className="h-4 w-4 text-primary" />} title="Editing message" body={stripFormatting(p.editing.text)} onClose={() => { p.onCancelEdit(); setText(""); }} />
  ) : p.replyTo ? (
    <Strip
      title={`Replying to ${p.replyTo.sender.name}`}
      body={p.replyTo.sticker ? "✨ Sticker" : stripFormatting(p.replyTo.text) || (p.replyTo.attachments[0]?.mime.startsWith("image/") ? "📷 Photo" : p.replyTo.attachments[0]?.mime.startsWith("audio/") ? "🎤 Voice message" : "📄 Document")}
      onClose={p.onCancelReply}
    />
  ) : null;

  const fmtBtn = "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <div
      className="border-t bg-background"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (!p.editing && e.dataTransfer.files.length) void addFiles(e.dataTransfer.files); }}
    >
      <div className="px-3 pb-3 pt-2 sm:px-4">
        {strip}
        {files.length > 0 && (
          <ul className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {files.map((f, i) => (
              <li key={i} className="relative shrink-0">
                {f.type.startsWith("image/") ? (
                  <Thumb file={f} />
                ) : (
                  <div className="flex h-16 w-40 items-center gap-2 rounded-lg border bg-card px-2">
                    <FileText className="h-5 w-5 shrink-0 text-danger-foreground" />
                    <span className="min-w-0 text-xs"><span className="block truncate font-medium">{f.name}</span><span className="text-muted-foreground">{fileSize(f.size)}</span></span>
                  </div>
                )}
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Formatting: shown while text is selected */}
        {hasSelection && !voice.recording && (
          <div className="mb-1.5 flex items-center gap-0.5" role="toolbar" aria-label="Formatting">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap("*")} className={fmtBtn} aria-label="Bold (Ctrl+B)" title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap("_")} className={fmtBtn} aria-label="Italic (Ctrl+I)" title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap("~")} className={fmtBtn} aria-label="Strikethrough (Ctrl+Shift+X)" title="Strikethrough (Ctrl+Shift+X)"><Strikethrough className="h-4 w-4" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap("```")} className={fmtBtn} aria-label="Monospace" title="Monospace"><Code className="h-4 w-4" /></button>
          </div>
        )}

        {voice.recording ? (
          <div className="flex items-center gap-2" aria-live="polite">
            <button type="button" onClick={voice.cancel} aria-label="Delete recording" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-danger-foreground hover:bg-danger-soft">
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border bg-card px-4">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
              <span className="shrink-0 font-mono text-[15px] tabular-nums">{mmss(voice.seconds)}</span>
              <span className="min-w-0 truncate text-[13px] text-muted-foreground">Recording…</span>
            </div>
            <button type="button" onClick={voice.stop} aria-label="Send voice message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover">
              <SendHorizonal className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5">
            <button
              type="button"
              onClick={() => { setPanel((v) => !v); if (panel) area.current?.focus(); }}
              aria-label={panel ? "Show keyboard" : "Emoji and stickers"}
              aria-expanded={panel}
              className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-muted", panel ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {panel ? <Keyboard className="h-5 w-5" /> : <Smile className="h-5 w-5" />}
            </button>
            {!p.editing && (
              <>
                <button type="button" onClick={() => picker.current?.click()} aria-label="Attach a photo or PDF" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input ref={picker} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ""; }} />
              </>
            )}
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <textarea
              id="chat-input"
              ref={area}
              rows={1}
              value={text}
              maxLength={4000}
              placeholder="Message"
              onFocus={() => touchFirst() && setPanel(false)}
              onSelect={(e) => setHasSelection(e.currentTarget.selectionEnd > e.currentTarget.selectionStart)}
              onBlur={() => setTimeout(() => setHasSelection(false), 150)}
              onChange={(e) => { setText(e.target.value); if (e.target.value) p.onTyping(); }}
              onPaste={(e) => { if (e.clipboardData.files.length && !p.editing) { e.preventDefault(); void addFiles(e.clipboardData.files); } }}
              onKeyDown={(e) => {
                const mod = e.ctrlKey || e.metaKey;
                if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); wrap("*"); return; }
                if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); wrap("_"); return; }
                if (mod && e.shiftKey && e.key.toLowerCase() === "x") { e.preventDefault(); wrap("~"); return; }
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !touchFirst()) { e.preventDefault(); submit(); }
                if (e.key === "Escape") { if (panel) setPanel(false); else if (p.editing) { p.onCancelEdit(); setText(""); } else if (p.replyTo) p.onCancelReply(); }
              }}
              className="max-h-[148px] min-h-[40px] flex-1 resize-none rounded-[20px] border bg-card px-4 py-2.5 text-[15px] leading-5 outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-[3px] focus:ring-ring/15"
            />
            {canSend || p.editing ? (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend || p.disabled}
                aria-label={p.editing ? "Save edit" : "Send"}
                className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors", canSend ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "bg-muted text-muted-foreground")}
              >
                <SendHorizonal className="h-[18px] w-[18px]" />
              </button>
            ) : (
              <button type="button" onClick={() => void voice.start()} aria-label="Record a voice message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover">
                <Mic className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}
      </div>

      {panel && !voice.recording && (
        <EmojiPanel
          onEmoji={insert}
          onSticker={p.editing ? undefined : (id) => { p.onSend({ text: "", files: [], sticker: id }); setPanel(false); }}
        />
      )}
    </div>
  );
});

function Strip({ title, body, onClose, icon }: { title: string; body: string; onClose: () => void; icon?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl border-l-[3px] border-primary bg-muted/60 py-1.5 pl-3 pr-1.5">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-primary">{title}</p>
        <p className="truncate text-[13px] text-muted-foreground">{body}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Thumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={file.name} className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-muted" />;
}
