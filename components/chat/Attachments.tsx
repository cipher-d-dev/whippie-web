"use client";

import { useEffect, useState } from "react";
import { FileText, ImageOff, Loader2 } from "lucide-react";
import { apiGetBlob } from "@/lib/api/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { attachmentPath, type ChatAttachment } from "@/features/chat/api";
import { fileSize } from "./format";

/** Files are private: fetched with the signed-in person's token, shown from memory. */
function useBlobUrl(path: string | null, local?: File) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let made: string | null = null;
    let cancelled = false;
    setFailed(false);
    if (local) {
      made = URL.createObjectURL(local);
      setUrl(made);
    } else if (path) {
      setUrl(null);
      apiGetBlob(path)
        .then((b) => { if (!cancelled) { made = URL.createObjectURL(b); setUrl(made); } })
        .catch(() => !cancelled && setFailed(true));
    }
    return () => { cancelled = true; if (made) URL.revokeObjectURL(made); };
  }, [path, local]);
  return { url, failed };
}

export function MessageAttachments({
  messageId,
  attachments,
  localFiles,
  mine,
}: {
  messageId: string;
  attachments: ChatAttachment[];
  localFiles?: File[];
  mine: boolean;
}) {
  return (
    <div className="space-y-1">
      {attachments.map((a) =>
        a.mime.startsWith("image/") ? (
          <ImageAttachment key={a.index} messageId={messageId} a={a} local={localFiles?.[a.index]} />
        ) : (
          <FileAttachment key={a.index} messageId={messageId} a={a} local={localFiles?.[a.index]} mine={mine} />
        ),
      )}
    </div>
  );
}

function ImageAttachment({ messageId, a, local }: { messageId: string; a: ChatAttachment; local?: File }) {
  const { url, failed } = useBlobUrl(local ? null : attachmentPath(messageId, a.index), local);
  const [open, setOpen] = useState(false);
  if (failed) {
    return <div className="flex h-32 w-56 items-center justify-center gap-1.5 rounded-lg bg-black/5 text-xs text-muted-foreground"><ImageOff className="h-4 w-4" /> Photo unavailable</div>;
  }
  return (
    <>
      <button type="button" onClick={() => url && setOpen(true)} className="block overflow-hidden rounded-lg" aria-label={`Open photo ${a.name}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={a.name} className="max-h-72 w-auto max-w-[260px] object-cover" />
        ) : (
          <div className="flex h-40 w-56 animate-pulse items-center justify-center bg-black/5"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(92vw,1000px)] border-0 bg-black p-2">
          <DialogTitle className="sr-only">{a.name}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url && <img src={url} alt={a.name} className="mx-auto max-h-[82vh] w-auto object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FileAttachment({ messageId, a, local, mine }: { messageId: string; a: ChatAttachment; local?: File; mine: boolean }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    if (local) return window.open(URL.createObjectURL(local), "_blank", "noopener");
    setBusy(true);
    try {
      const blob = await apiGetBlob(attachmentPath(messageId, a.index));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={open}
      className={cn("flex w-64 max-w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left", mine ? "bg-white/15 hover:bg-white/20" : "bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/5")}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", mine ? "bg-white/20" : "bg-danger-soft text-danger-foreground")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{a.name}</span>
        <span className={cn("block text-[11px]", mine ? "text-white/75" : "text-muted-foreground")}>PDF · {fileSize(a.size)}</span>
      </span>
    </button>
  );
}
