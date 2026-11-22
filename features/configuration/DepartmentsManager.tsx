"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/features/departments/hooks";
import { useSettings } from "@/features/settings/hooks";
import { ApiError, applyApiErrors } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section } from "@/components/shared/PageHeader";
import type { DepartmentObject } from "@/types";

// Station is free text: the list comes from Configuration > Labels & stations.
const schema = z.object({
  name:        z.string().trim().min(1, "Give the department a name"),
  subsidiary:  z.string().optional(),
  description: z.string().optional(),
  isActive:    z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;
type SetError = (field: string, error: { type: string; message: string }) => void;

const NONE = "__none";

function DepartmentForm({
  defaultValues, stations, onSubmit, isPending, isEdit,
}: {
  defaultValues?: Partial<FormValues>;
  stations: string[];
  onSubmit: (v: FormValues, setError: SetError) => void;
  isPending: boolean;
  isEdit?: boolean;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, ...defaultValues },
  });
  const current = watch("subsidiary");
  // Keep an older station name selectable even if it's no longer in the list.
  const options = current && !stations.includes(current) ? [...stations, current] : stations;

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, description: v.description?.trim() || undefined }, setError as SetError))}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="dept-name">Name</Label>
        <Input id="dept-name" placeholder="e.g. Corporate Communications" {...register("name")} />
        {errors.name && <p className="text-xs text-danger-foreground">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dept-station">Station</Label>
        <Select value={current || NONE} onValueChange={(v) => setValue("subsidiary", v === NONE ? undefined : v)}>
          <SelectTrigger id="dept-station"><SelectValue placeholder="Choose a station" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No station</SelectItem>
            {options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dept-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea id="dept-desc" rows={2} className="resize-none" placeholder="Units in this department, e.g. Camera and Editing" {...register("description")} />
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="dept-status">Status</Label>
          <Select value={watch("isActive") === false ? "inactive" : "active"} onValueChange={(v) => setValue("isActive", v === "active")}>
            <SelectTrigger id="dept-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active, can take interns</SelectItem>
              <SelectItem value="inactive">Retired, hidden when placing interns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add department"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Add, rename and retire departments. Used on /departments and on Configuration. */
export function DepartmentsManager({ showHeaderAction = true }: { showHeaderAction?: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DepartmentObject | null>(null);
  const { settings } = useSettings();
  const { data, isLoading } = useDepartments({ limit: 100 });
  const createMut = useCreateDepartment(() => setCreateOpen(false));
  const editMut = useUpdateDepartment(editTarget?._id ?? "", () => setEditTarget(null));
  const deleteMut = useDeleteDepartment();

  // Group by station, in the order HR set the stations.
  const groups = useMemo(() => {
    const depts = [...(data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const order = [...settings.stations, ...new Set(depts.map((d) => d.subsidiary || "").filter((s) => s && !settings.stations.includes(s)))];
    const out = order.map((s) => ({ station: s, items: depts.filter((d) => d.subsidiary === s) })).filter((g) => g.items.length);
    const none = depts.filter((d) => !d.subsidiary);
    if (none.length) out.push({ station: "No station", items: none });
    return out;
  }, [data, settings.stations]);
  const total = data?.data?.length ?? 0;

  const remove = (d: DepartmentObject) => {
    if (confirm(`Delete "${d.name}"? Interns and supervisors in it will have no department. To keep history, set it to Retired instead.`)) {
      deleteMut.mutate(d._id);
    }
  };

  return (
    <Section
      title="Departments & units"
      description={`${total} department${total === 1 ? "" : "s"}. Rename one with the pencil; the new name shows everywhere, including on letters.`}
      action={showHeaderAction && <Button size="sm" onClick={() => setCreateOpen(true)}><Plus /> Add department</Button>}
      bodyClassName="p-0"
    >
      {isLoading ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : total === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No departments yet.</p>
      ) : (
        <div className="divide-y">
          {groups.map((g) => (
            <div key={g.station}>
              <p className="bg-muted/50 px-5 py-2 text-xs font-medium text-muted-foreground">{g.station}</p>
              <ul className="divide-y">
                {g.items.map((d) => (
                  <li key={d._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      {d.description && <p className="truncate text-xs text-muted-foreground">{d.description}</p>}
                    </div>
                    {!d.isActive && <Badge variant="neutral">Retired</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTarget(d)} aria-label={`Edit ${d.name}`} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger-foreground" onClick={() => remove(d)} disabled={deleteMut.isPending} aria-label={`Delete ${d.name}`} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
            <DialogDescription>Supervisors and interns can be placed in it straight away.</DialogDescription>
          </DialogHeader>
          <DepartmentForm
            stations={settings.stations}
            onSubmit={(v, se) => createMut.mutate(v, { onError: (err) => { if (err instanceof ApiError) applyApiErrors(err, se); } })}
            isPending={createMut.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit department</DialogTitle>
            <DialogDescription>{editTarget?.name}</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <DepartmentForm
              isEdit
              stations={settings.stations}
              defaultValues={{ name: editTarget.name, subsidiary: editTarget.subsidiary, description: editTarget.description, isActive: editTarget.isActive }}
              onSubmit={(v, se) => editMut.mutate(v, { onError: (err) => { if (err instanceof ApiError) applyApiErrors(err, se); } })}
              isPending={editMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {!showHeaderAction && (
        <div className="border-t px-5 py-3">
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}><Plus /> Add department</Button>
        </div>
      )}
    </Section>
  );
}
