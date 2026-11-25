"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImageOff, Loader2, Pause, Play } from "lucide-react";
import { apiGetBlob } from "@/features/chat/api";
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
        a.mime.startsWith("audio/") ? (
          <VoicePlayer key={a.index} messageId={messageId} a={a} local={localFiles?.[a.index]} mine={mine} />
        ) : a.mime.startsWith("image/") ? (
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

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const SPEEDS = [1, 1.5, 2];

/** A voice note: play/pause, a seek bar, time, and 1× / 1.5× / 2× speed. Loads only when played. */
export function VoicePlayer({ messageId, a, local, mine }: { messageId: string; a: ChatAttachment; local?: File; mine: boolean }) {
  const [want, setWant] = useState(!!local);
  const { url, failed } = useBlobUrl(want && !local ? attachmentPath(messageId, a.index) : null, local);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(a.duration ?? 0);
  const [speed, setSpeed] = useState(1);
  const pendingPlay = useRef(false);

  useEffect(() => {
    if (url && pendingPlay.current && audio.current) { pendingPlay.current = false; void audio.current.play(); }
  }, [url]);

  const toggle = () => {
    const el = audio.current;
    if (!url) { pendingPlay.current = true; setWant(true); return; }
    if (!el) return;
    if (el.paused) void el.play(); else el.pause();
  };
  const loading = want && !url && !failed;

  return (
    <div className={cn("flex w-64 max-w-full items-center gap-2.5 py-0.5", failed && "opacity-60")}>
      <button
        type="button"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", mine ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 text-primary hover:bg-primary/15")}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={0}
          max={dur || 1}
          step={0.1}
          value={Math.min(pos, dur || 1)}
          onChange={(e) => { const v = Number(e.target.value); setPos(v); if (audio.current) audio.current.currentTime = v; }}
          aria-label="Position in voice message"
          className={cn("h-1.5 w-full cursor-pointer appearance-none rounded-full", mine ? "accent-white bg-white/30" : "accent-[hsl(var(--primary))] bg-primary/15")}
        />
        <div className={cn("mt-1 flex justify-between text-[11px]", mine ? "text-white/75" : "text-muted-foreground")}>
          <span className="font-mono tabular-nums">{failed ? "Unavailable" : mmss(playing || pos ? pos : dur)}</span>
          <button
            type="button"
            onClick={() => { const n = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; setSpeed(n); if (audio.current) audio.current.playbackRate = n; }}
            className={cn("rounded-full px-1.5 font-semibold", mine ? "bg-white/20" : "bg-muted")}
            aria-label={`Playback speed ${speed} times`}
          >
            {speed}×
          </button>
        </div>
      </div>
      {url && (
        <audio
          ref={audio}
          src={url}
          preload="metadata"
          onPlay={() => { setPlaying(true); if (audio.current) audio.current.playbackRate = speed; }}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setPos(0); }}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setDur(d); }}
        />
      )}
    </div>
  );
}

/** Just the private image (for grids and viewers). */
export function PrivateImage({ messageId, index, alt, className }: { messageId: string; index: number; alt: string; className?: string }) {
  const { url, failed } = useBlobUrl(attachmentPath(messageId, index));
  if (failed) return <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}><ImageOff className="h-5 w-5" /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={alt} className={className} /> : <div className={cn("animate-pulse bg-muted", className)} />;
}
