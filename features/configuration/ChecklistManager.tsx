"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCreateRequirement, useDeleteRequirement, useRequirements, useUpdateRequirement } from "@/features/documents/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentType, RequirementObject } from "@/types";

const TYPES: { value: DocumentType; label: string }[] = [
  { value: "ACCEPTANCE_LETTER", label: "Acceptance letter" },
  { value: "SCHOOL_LETTER", label: "School letter" },
  { value: "NYSC_CALL_UP", label: "NYSC posting / call-up" },
  { value: "IDENTIFICATION", label: "Identification" },
  { value: "GUARANTOR_FORM", label: "Guarantor form" },
  { value: "EXIT_DOCUMENT", label: "Exit document" },
  { value: "OTHER", label: "Something else" },
];

/** The documents interns hand in. HR can rename items and choose which are required. */
export function ChecklistManager() {
  const { data, isLoading } = useRequirements();
  const update = useUpdateRequirement();
  const remove = useDeleteRequirement();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const items = [...(data?.data?.requirements ?? [])].sort((a, b) => a.label.localeCompare(b.label));

  const save = (r: RequirementObject) => {
    const label = draft.trim();
    if (!label || label === r.label) return setEditing(null);
    update.mutate({ id: r._id, label }, { onSuccess: () => setEditing(null) });
  };

  return (
    <Section
      title="Document checklist"
      description="What interns must hand in. Interns see these names in their app."
      action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus /> Add item</Button>}
      bodyClassName="p-0"
    >
      {isLoading ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No checklist items yet.</p>
      ) : (
        <ul className="divide-y">
          {items.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              {editing === r._id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onSubmit={(e) => { e.preventDefault(); save(r); }}
                >
                  <Label htmlFor={`req-${r._id}`} className="sr-only">Name</Label>
                  <Input id={`req-${r._id}`} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus maxLength={200} className="h-8" />
                  <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={update.isPending} aria-label="Save name"><Check className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditing(null)} aria-label="Cancel"><X className="h-4 w-4" /></Button>
                </form>
              ) : (
                <>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{r.label}</p>
                  <Select
                    value={r.isRequired ? "required" : "optional"}
                    onValueChange={(v) => update.mutate({ id: r._id, isRequired: v === "required" })}
                  >
                    <SelectTrigger className="h-8 w-[130px]" aria-label={`Is ${r.label} required?`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r._id); setDraft(r.label); }} aria-label={`Rename ${r.label}`} title="Rename">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger-foreground"
                    onClick={() => { if (confirm(`Remove "${r.label}" from the checklist?`)) remove.mutate(r._id); }}
                    disabled={remove.isPending} aria-label={`Remove ${r.label}`} title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
    </Section>
  );
}

function AddItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<DocumentType>("OTHER");
  const [required, setRequired] = useState(true);
  const create = useCreateRequirement(() => { onOpenChange(false); setLabel(""); setType("OTHER"); setRequired(true); });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a checklist item</DialogTitle>
          <DialogDescription>Interns will see it in their documents list.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (label.trim()) create.mutate({ label: label.trim(), type, isRequired: required }); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-req">Name</Label>
            <Input id="new-req" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Medical certificate" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-req-type">Kind</Label>
              <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                <SelectTrigger id="new-req-type"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-req-required">Required?</Label>
              <Select value={required ? "yes" : "no"} onValueChange={(v) => setRequired(v === "yes")}>
                <SelectTrigger id="new-req-required"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Required</SelectItem>
                  <SelectItem value="no">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!label.trim() || create.isPending}>{create.isPending ? "Adding…" : "Add item"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
