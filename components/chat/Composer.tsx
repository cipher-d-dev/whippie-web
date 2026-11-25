"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FileText, Paperclip, Pencil, SendHorizonal, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/features/chat/api";
import { fileSize } from "./format";

const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
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

export const Composer = forwardRef<ComposerHandle, {
  replyTo: ChatMessage | null;
  editing: ChatMessage | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSend: (text: string, files: File[]) => void;
  onSaveEdit: (m: ChatMessage, text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}>(function Composer(p, ref) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }), []);

  // Grow with the text, up to about six lines.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [text]);

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

  const canSend = !!text.trim() || files.length > 0;
  const submit = () => {
    if (!canSend || p.disabled) return;
    if (p.editing) {
      if (text.trim() && text.trim() !== p.editing.text) p.onSaveEdit(p.editing, text.trim());
      p.onCancelEdit();
    } else {
      p.onSend(text.trim(), files);
    }
    setText("");
    setFiles([]);
    area.current?.focus();
  };

  const strip = p.editing ? (
    <Strip icon={<Pencil className="h-4 w-4 text-primary" />} title="Editing message" body={p.editing.text} onClose={() => { p.onCancelEdit(); setText(""); }} />
  ) : p.replyTo ? (
    <Strip
      title={`Replying to ${p.replyTo.sender.name}`}
      body={p.replyTo.text || (p.replyTo.attachments[0]?.mime.startsWith("image/") ? "📷 Photo" : "📄 Document")}
      onClose={p.onCancelReply}
    />
  ) : null;

  return (
    <div
      className="border-t bg-background px-3 pb-3 pt-2 sm:px-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (!p.editing && e.dataTransfer.files.length) void addFiles(e.dataTransfer.files); }}
    >
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
      <div className="flex items-end gap-2">
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
          onChange={(e) => { setText(e.target.value); if (e.target.value) p.onTyping(); }}
          onPaste={(e) => { if (e.clipboardData.files.length && !p.editing) { e.preventDefault(); void addFiles(e.clipboardData.files); } }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !touchFirst()) { e.preventDefault(); submit(); }
            if (e.key === "Escape") { if (p.editing) { p.onCancelEdit(); setText(""); } else if (p.replyTo) p.onCancelReply(); }
          }}
          className="max-h-[148px] min-h-[40px] flex-1 resize-none rounded-[20px] border bg-card px-4 py-2.5 text-[15px] leading-5 outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-[3px] focus:ring-ring/15"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend || p.disabled}
          aria-label={p.editing ? "Save edit" : "Send"}
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors", canSend ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "bg-muted text-muted-foreground")}
        >
          <SendHorizonal className="h-[18px] w-[18px]" />
        </button>
      </div>
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
