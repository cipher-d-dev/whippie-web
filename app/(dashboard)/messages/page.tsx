"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Flag, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useChatModeration, useConversation, useConversations, useOpenConversation } from "@/features/chat/hooks";
import type { ConversationSummary } from "@/features/chat/api";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatThread } from "@/components/chat/ChatThread";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function MessagesInner() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("c");
  const { data: list } = useConversations();
  const fromList = list?.find((c) => c.id === selectedId);
  const { data: fetched, isError } = useConversation(selectedId && !fromList ? selectedId : null);
  const selected = fromList ?? fetched ?? null;
  const { open, pending } = useOpenConversation();

  const select = (id: string | null) => router.replace(id ? `/messages?c=${id}` : "/messages", { scroll: false });

  useEffect(() => {
    document.title = "Messages · Whippie";
  }, []);

  if (!user) return null;
  const me = { id: user.id, name: `${user.firstName} ${user.lastName}`, role: user.role };
  const internProfile = selected?.with.kind === "INTERN" && selected.with.internId ? `/interns/${selected.with.internId}` : null;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] overflow-hidden lg:-mx-8 lg:-my-7 lg:h-[calc(100dvh-4.5rem-2px)] lg:rounded-b-2xl">
      <aside className={cn("w-full shrink-0 border-r bg-background md:w-[340px] lg:w-[360px]", selectedId ? "hidden md:block" : "block")} aria-label="Chats">
        <ConversationList
          meId={me.id}
          selectedId={selectedId}
          onSelect={(c) => select(c.id)}
          canStart={user.role === "HR" || user.role === "SUPERVISOR"}
          starting={pending}
          onStart={async (body) => {
            const c = await open(body);
            if (c) select(c.id);
          }}
        />
      </aside>
      <section className={cn("min-w-0 flex-1", selectedId ? "block" : "hidden md:block")}>
        {selected && selected.with.kind === "INTERN_PAIR" ? (
          <ReportedChat key={selected.id} conversation={selected} me={me} onBack={() => select(null)} />
        ) : selected ? (
          <ChatThread
            key={selected.id}
            conversation={selected}
            me={me}
            onBack={() => select(null)}
            headerExtra={internProfile && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href={internProfile}>View profile</Link></Button>
            )}
          />
        ) : selectedId && isError ? (
          <Empty title="This chat isn't available" body="It may have been removed, or you don't have access." />
        ) : selectedId ? (
          <div className="h-full bg-canvas" />
        ) : (
          <Empty title="Your messages" body={user.role === "HR" ? "Pick a chat, or start one with an intern or a supervisor. Interns' chats are shared by the whole HR team." : "Pick a chat, or start one with someone in HR."} />
        )}
      </section>
    </div>
  );
}

/** HR reading a private intern chat that one of them reported: read only, with the reports on top. */
function ReportedChat({ conversation, me, onBack }: { conversation: ConversationSummary; me: { id: string; name: string; role: string }; onBack: () => void }) {
  const [focus, setFocus] = useState<string | null>(null);
  const mod = useChatModeration(conversation.id);
  const reports = conversation.reports ?? [];
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-danger-soft/50 px-4 py-3 text-[13px]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 font-semibold text-danger-foreground"><Flag className="h-4 w-4" /> Reported private chat</p>
          {conversation.reportResolvedAt ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5" /> Reviewed {new Date(conversation.reportResolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          ) : (
            <Button size="sm" variant="outline" onClick={() => void mod.resolve()} disabled={mod.pending}><Check /> Mark as reviewed</Button>
          )}
        </div>
        <ul className="mt-2 space-y-1.5">
          {reports.map((r, i) => (
            <li key={i} className="text-secondary-foreground">
              <span className="font-medium text-foreground">{r.byName}</span>{" "}
              <span className="text-muted-foreground">· {new Date(r.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              <span className="block">&ldquo;{r.reason}&rdquo;</span>
              {r.messageId && <button type="button" onClick={() => setFocus(r.messageId)} className="text-xs font-medium text-primary hover:underline">Show the reported message</button>}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Only the two interns can write here. You can read it because it was reported; they don&apos;t see that you&apos;ve opened it.</p>
      </div>
      <div className="min-h-0 flex-1">
        <ChatThread conversation={conversation} me={me} onBack={onBack} focusMessageId={focus} footer="Read only: this is a private chat between two interns." />
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="h-6 w-6" /></span>
      <p className="mt-4 text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
