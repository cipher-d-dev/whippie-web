"use client";

import { useState } from "react";
import { Plus, Pencil, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDepartments, useCreateDepartment, useUpdateDepartment } from "@/features/departments/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { DepartmentObject, Subsidiary } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:        z.string().min(1, "Department name is required"),
  subsidiary:  z.enum(["AIT", "Raypower", "Faaji", "Corporate"]).optional(),
  description: z.string().optional(),
  isActive:    z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const SUBSIDIARY_COLORS: Record<string, string> = {
  AIT:       "bg-blue-100 text-blue-700",
  Raypower:  "bg-purple-100 text-purple-700",
  Faaji:     "bg-orange-100 text-orange-700",
  Corporate: "bg-slate-100 text-slate-700",
};

// ─── Department form (shared for create + edit) ───────────────────────────────

function DepartmentForm({
  defaultValues,
  onSubmit,
  isPending,
  isEdit,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  isEdit?: boolean;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { isActive: true, ...defaultValues },
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Name" error={errors.name?.message}>
        <Input placeholder="e.g. News & Current Affairs" {...register("name")} />
      </Field>

      <Field label="Subsidiary" error={errors.subsidiary?.message}>
        <Select
          value={watch("subsidiary") ?? ""}
          onValueChange={(v) => setValue("subsidiary", v as Subsidiary)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subsidiary" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AIT">AIT</SelectItem>
            <SelectItem value="Raypower">Raypower</SelectItem>
            <SelectItem value="Faaji">Faaji</SelectItem>
            <SelectItem value="Corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <Textarea
          placeholder="Brief description of the department"
          className="resize-none"
          rows={2}
          {...register("description")}
        />
      </Field>

      {isEdit && (
        <Field label="Status">
          <Select
            value={watch("isActive") === false ? "inactive" : "active"}
            onValueChange={(v) => setValue("isActive", v === "active")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create department"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DepartmentObject | null>(null);

  const { data, isLoading } = useDepartments({ limit: 100 });
  const departments = data?.data ?? [];

  const createMut = useCreateDepartment(() => setCreateOpen(false));
  const editMut   = useUpdateDepartment(editTarget?._id ?? "", () => setEditTarget(null));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Departments</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {departments.length} department{departments.length !== 1 ? "s" : ""} across all subsidiaries
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New department
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Building2 className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No departments yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create the first one to start organising interns.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="group relative flex flex-col gap-2 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{dept.name}</p>
                  {dept.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {dept.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditTarget(dept)}
                  className="shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
                  aria-label="Edit department"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                {dept.subsidiary && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SUBSIDIARY_COLORS[dept.subsidiary] ?? "bg-muted text-muted-foreground"}`}>
                    {dept.subsidiary}
                  </span>
                )}
                <Badge variant={dept.isActive ? "default" : "outline"} className="text-xs">
                  {dept.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New department</DialogTitle>
          </DialogHeader>
          <DepartmentForm
            onSubmit={(v) => createMut.mutate(v)}
            isPending={createMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit — {editTarget?.name}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <DepartmentForm
              isEdit
              defaultValues={{
                name:        editTarget.name,
                subsidiary:  editTarget.subsidiary,
                description: editTarget.description,
                isActive:    editTarget.isActive,
              }}
              onSubmit={(v) => editMut.mutate(v)}
              isPending={editMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
