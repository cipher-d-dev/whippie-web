"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useInviteHr, useRemoveUser, useUsers } from "@/features/users/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate } from "@/lib/utils/format";

/** Everyone with an HR login. HR can add colleagues; there is no self sign-up for HR. */
export function HrTeam() {
  const { user } = useAuth();
  const { data, isLoading } = useUsers({ role: "HR", limit: 100 });
  const remove = useRemoveUser();
  const [open, setOpen] = useState(false);
  const team = data?.data ?? [];

  return (
    <Section
      title="HR team"
      description="People who can sign in here as HR. Each login has one role, so someone who is also a supervisor needs a second email for that."
      action={<Button size="sm" onClick={() => setOpen(true)}><UserPlus /> Add HR</Button>}
      bodyClassName="p-0"
    >
      {isLoading ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="divide-y">
          {team.map((m) => {
            const me = m._id === user?.id;
            return (
              <li key={m._id} className="flex items-center gap-3 px-5 py-3">
                <PersonAvatar firstName={m.firstName} lastName={m.lastName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.firstName} {m.lastName}{me && <span className="font-normal text-muted-foreground"> (you)</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:inline">Since {fmtDate(m.createdAt)}</span>
                {!me && (
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger-foreground"
                    disabled={remove.isPending}
                    onClick={() => { if (confirm(`Remove ${m.firstName} ${m.lastName}'s HR login? They won't be able to sign in.`)) remove.mutate(m._id); }}
                    aria-label={`Remove ${m.firstName} ${m.lastName}`} title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <InviteDialog open={open} onOpenChange={setOpen} />
    </Section>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const invite = useInviteHr(() => { onOpenChange(false); setForm({ firstName: "", lastName: "", email: "" }); });
  const valid = form.firstName.trim() && form.lastName.trim() && /^\S+@\S+\.\S+$/.test(form.email.trim());
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add someone to the HR team</DialogTitle>
          <DialogDescription>We&apos;ll email them a temporary password and a link to sign in here.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (valid) invite.mutate({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() }); }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="hr-first">First name</Label><Input id="hr-first" value={form.firstName} onChange={set("firstName")} autoComplete="off" /></div>
            <div className="space-y-1.5"><Label htmlFor="hr-last">Last name</Label><Input id="hr-last" value={form.lastName} onChange={set("lastName")} autoComplete="off" /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hr-email">Email</Label>
            <Input id="hr-email" type="email" value={form.email} onChange={set("email")} autoComplete="off" />
            <p className="text-xs text-muted-foreground">Must not already be used for a supervisor or intern login.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!valid || invite.isPending}>{invite.isPending ? "Sending…" : "Send invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
