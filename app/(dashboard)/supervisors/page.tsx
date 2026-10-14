"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, UserCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupervisors, useCreateSupervisor } from "@/features/supervisors/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Create form schema ───────────────────────────────────────────────────────

const schema = z.object({
  userId:     z.string().min(1, "User ID is required"),
  firstName:  z.string().min(1, "First name is required"),
  lastName:   z.string().min(1, "Last name is required"),
  phone:      z.string().optional(),
  department: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SupervisorsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useSupervisors({ limit: 100 });
  const { data: deptData } = useDepartments({ limit: 100 });
  const supervisors = data?.data ?? [];
  const departments = deptData?.data ?? [];

  const createMut = useCreateSupervisor(() => setCreateOpen(false));

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as FormValues;
    createMut.mutate(cleaned);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Supervisors</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {supervisors.length} supervisor{supervisors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add supervisor
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : supervisors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <UserCog className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No supervisors yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add supervisor profiles to start assigning interns.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisors.map((sv) => (
                <TableRow key={sv._id}>
                  <TableCell>
                    <Link
                      href={`/supervisors/${sv._id}`}
                      className="font-medium hover:underline"
                    >
                      {sv.firstName} {sv.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sv.department
                      ? `${sv.department.name}${sv.department.subsidiary ? ` · ${sv.department.subsidiary}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sv.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sv.isActive ? "default" : "outline"}>
                      {sv.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/supervisors/${sv._id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add supervisor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="User ID" required error={errors.userId?.message}>
              <Input placeholder="Paste active SUPERVISOR account ID" {...register("userId")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" required error={errors.firstName?.message}>
                <Input placeholder="Emeka" {...register("firstName")} />
              </Field>
              <Field label="Last name" required error={errors.lastName?.message}>
                <Input placeholder="Eze" {...register("lastName")} />
              </Field>
            </div>
            <Field label="Phone" error={errors.phone?.message}>
              <Input placeholder="08098765432" {...register("phone")} />
            </Field>
            <Field label="Department" error={errors.department?.message}>
              <Select
                value={watch("department") ?? ""}
                onValueChange={(v) => setValue("department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}{d.subsidiary ? ` — ${d.subsidiary}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating…" : "Create supervisor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
