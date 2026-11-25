"use client";

import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenConversation } from "@/features/chat/hooks";

/** Opens (or starts) a chat and goes to it. */
export function MessageButton({ internId, userId, size, variant = "outline" }: {
  internId?: string;
  userId?: string;
  size?: "sm" | "default";
  variant?: "outline" | "default";
}) {
  const router = useRouter();
  const { open, pending } = useOpenConversation();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={pending}
      onClick={async () => {
        const c = await open({ internId, userId });
        if (c) router.push(`/messages?c=${c.id}`);
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <MessageCircle />} Message
    </Button>
  );
}
