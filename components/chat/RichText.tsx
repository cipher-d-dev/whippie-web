"use client";

import { Fragment } from "react";
import { linkify } from "./format";

/**
 * WhatsApp-style formatting:
 *   *bold*  _italic_  ~strikethrough~  `inline code`  ```monospace block```
 * A marker only counts when it hugs the text (no space just inside) and isn't
 * in the middle of a word, so "2*3*4" or "snake_case_name" stay as typed.
 */
type Node = { t: "text"; v: string } | { t: "b" | "i" | "s"; c: Node[] } | { t: "code" | "pre"; v: string };

const MARK: Record<string, "b" | "i" | "s"> = { "*": "b", _: "i", "~": "s" };
const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

function parseInline(s: string): Node[] {
  const out: Node[] = [];
  let buf = "";
  let i = 0;
  const flush = () => { if (buf) { out.push({ t: "text", v: buf }); buf = ""; } };
  while (i < s.length) {
    const ch = s[i];
    if (ch === "`") {
      const end = s.indexOf("`", i + 1);
      if (end > i + 1 && !s.slice(i + 1, end).includes("\n")) {
        flush();
        out.push({ t: "code", v: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    const kind = MARK[ch];
    if (kind && !isWordChar(s[i - 1]) && s[i + 1] && !/\s/.test(s[i + 1])) {
      // find the closing marker on the same line
      let j = i + 1;
      let found = -1;
      while (j < s.length && s[j] !== "\n") {
        if (s[j] === ch && !/\s/.test(s[j - 1]) && !isWordChar(s[j + 1]) && j > i + 1) { found = j; break; }
        j++;
      }
      if (found > 0) {
        flush();
        out.push({ t: kind, c: parseInline(s.slice(i + 1, found)) });
        i = found + 1;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

export function parseRich(text: string): Node[] {
  const out: Node[] = [];
  const re = /```([\s\S]+?)```/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(...parseInline(text.slice(last, m.index)));
    out.push({ t: "pre", v: m[1].replace(/^\n|\n$/g, "") });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(...parseInline(text.slice(last)));
  return out;
}

function Linked({ text }: { text: string }) {
  return (
    <>
      {linkify(text).map((p, i) =>
        p.href ? <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{p.text}</a> : <Fragment key={i}>{p.text}</Fragment>,
      )}
    </>
  );
}

function render(nodes: Node[]): React.ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text": return <Linked key={i} text={n.v} />;
      case "b": return <strong key={i} className="font-semibold">{render(n.c)}</strong>;
      case "i": return <em key={i}>{render(n.c)}</em>;
      case "s": return <s key={i}>{render(n.c)}</s>;
      case "code": return <code key={i} className="rounded bg-black/10 px-1 py-px font-mono text-[0.9em] dark:bg-white/15">{n.v}</code>;
      case "pre": return <span key={i} className="my-1 block whitespace-pre-wrap rounded-md bg-black/10 px-2 py-1.5 font-mono text-[13px] dark:bg-white/10">{n.v}</span>;
    }
  });
}

export function RichText({ text }: { text: string }) {
  return <>{render(parseRich(text))}</>;
}

/** Plain text with the markers removed (for previews and quotes). */
export function stripFormatting(text: string): string {
  const flat = (nodes: Node[]): string => nodes.map((n) => ("c" in n ? flat(n.c) : n.v)).join("");
  return flat(parseRich(text));
}
