"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Sticker } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EMOJI_CATEGORIES, STICKERS, recentEmoji, rememberEmoji } from "./emoji-data";

/**
 * Emoji (by category, with recently used first) and the Whippie sticker pack.
 * Sits above the message box, like WhatsApp's keyboard panel.
 */
export function EmojiPanel({
  onEmoji,
  onSticker,
  compact,
}: {
  onEmoji: (e: string) => void;
  /** Leave out to hide the Stickers tab (e.g. picking a reaction) */
  onSticker?: (id: string) => void;
  compact?: boolean;
}) {
  const [tab, setTab] = useState<"emoji" | "stickers">("emoji");
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState("recent");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => setRecent(recentEmoji()), []);

  const sections = useMemo(
    () => [...(recent.length ? [{ id: "recent", label: "Recently used", icon: "🕘", emoji: recent }] : []), ...EMOJI_CATEGORIES],
    [recent],
  );

  const pick = (e: string) => {
    rememberEmoji(e);
    onEmoji(e);
  };

  const jump = (id: string) => {
    setActive(id);
    const el = scroller.current?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
    if (el && scroller.current) scroller.current.scrollTo({ top: el.offsetTop - 4, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const heads = [...el.querySelectorAll<HTMLElement>("[data-cat]")];
    const current = heads.filter((h) => h.offsetTop - 8 <= el.scrollTop).pop();
    if (current) setActive(current.dataset.cat!);
  };

  return (
    <div className={cn("flex flex-col border-t bg-card", compact ? "h-[300px]" : "h-[280px] sm:h-[320px]")}>
      {onSticker && (
        <div role="tablist" aria-label="Emoji or stickers" className="flex gap-1 border-b px-2 pt-1.5">
          {(["emoji", "stickers"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn("flex items-center gap-1.5 rounded-t-md border-b-2 px-3 pb-1.5 pt-1 text-[13px] font-medium", tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {k === "emoji" ? "😊 Emoji" : <><Sticker className="h-4 w-4" /> Stickers</>}
            </button>
          ))}
        </div>
      )}

      {tab === "stickers" && onSticker ? (
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-2 overflow-y-auto p-3 sm:grid-cols-6">
          {STICKERS.map((s) => (
            <button key={s.id} type="button" onClick={() => onSticker(s.id)} aria-label={`Send sticker: ${s.label}`} className="rounded-xl p-1.5 transition-transform hover:scale-105 hover:bg-muted active:scale-95">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/stickers/${s.id}.svg`} alt="" className="aspect-square w-full" loading="lazy" />
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-0.5 overflow-x-auto border-b px-1.5 py-1" role="toolbar" aria-label="Emoji categories">
            {sections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => jump(c.id)}
                aria-label={c.label}
                title={c.label}
                className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg", active === c.id ? "bg-primary/10" : "hover:bg-muted")}
              >
                {c.id === "recent" ? <Clock3 className="h-4 w-4 text-muted-foreground" /> : c.icon}
              </button>
            ))}
          </div>
          <div ref={scroller} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {sections.map((c) => (
              <section key={c.id} data-cat={c.id} aria-label={c.label}>
                <p className="sticky top-0 z-10 bg-card/95 px-1 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <div className="grid grid-cols-8 sm:grid-cols-10">
                  {c.emoji.map((e, i) => (
                    <button
                      key={`${c.id}-${i}`}
                      type="button"
                      onClick={() => pick(e)}
                      className="flex aspect-square items-center justify-center rounded-md text-[24px] leading-none hover:bg-muted active:scale-90"
                      aria-label={e}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
