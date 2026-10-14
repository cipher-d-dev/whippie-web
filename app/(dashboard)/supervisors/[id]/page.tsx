"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSupervisor,
  useSupervisorInterns,
  useUpdateSupervisor,
} from "@/features/supervisors/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

// ─── Edit schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:  z.string().min(1),
  lastName:   z.string().min(1),
  phone:      z.string().optional(),
  department: z.string().optional(),
  isActive:   z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupervisorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useSupervisor(id);
  const { data: internsData } = useSupervisorInterns(id);
  const { data: deptData } = useDepartments({ limit: 100 });

  const supervisor = data?.data?.supervisor;
  const interns    = internsData?.data?.interns ?? [];
  const departments = deptData?.data ?? [];

  const updateMut = useUpdateSupervisor(id, () => setEditOpen(false));

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const openEdit = () => {
    if (!supervisor) return;
    reset({
      firstName:  supervisor.firstName,
      lastName:   supervisor.lastName,
      phone:      supervisor.phone ?? "",
      department: supervisor.department?._id ?? "",
      isActive:   supervisor.isActive,
    });
    setEditOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as FormValues;
    updateMut.mutate(cleaned);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-destructive">Supervisor not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/supervisors">Back to supervisors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/supervisors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to supervisors
            </Link>
          </Button>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold">
              {supervisor.firstName} {supervisor.lastName}
            </h2>
            <Badge variant={supervisor.isActive ? "default" : "outline"}>
              {supervisor.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <Button size="sm" onClick={openEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Full name" value={`${supervisor.firstName} ${supervisor.lastName}`} />
          <Row label="Phone"     value={supervisor.phone} />
          <Row label="Department"
            value={
              supervisor.department
                ? `${supervisor.department.name}${supervisor.department.subsidiary ? ` · ${supervisor.department.subsidiary}` : ""}`
                : undefined
            }
          />
          <Row label="User account" value={supervisor.user?.email} />
        </CardContent>
      </Card>

      {/* Assigned interns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Assigned interns ({interns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interns.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No interns assigned yet.
            </p>
          ) : (
            <ul className="divide-y">
              {interns.map((intern) => (
                <li key={intern._id} className="flex items-center justify-between py-2.5">
                  <div>
                    <Link
                      href={`/interns/${intern._id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {intern.firstName} {intern.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{intern.institution} · {intern.course}</p>
                  </div>
                  <Badge variant={
                    intern.status === "ACTIVE" ? "default" :
                    intern.status === "ONBOARDING" ? "secondary" : "outline"
                  } className="text-xs">
                    {intern.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Created {fmt(supervisor.createdAt)} · Last updated {fmt(supervisor.updatedAt)}
      </p>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit supervisor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.firstName?.message}>
                <Input {...register("firstName")} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <Input {...register("lastName")} />
              </Field>
            </div>
            <Field label="Phone">
              <Input placeholder="08098765432" {...register("phone")} />
            </Field>
            <Field label="Department">
              <Select
                value={watch("department") ?? ""}
                onValueChange={(v) => setValue("department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
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
            <Field label="Status">
              <Select
                value={watch("isActive") === false ? "inactive" : "active"}
                onValueChange={(v) => setValue("isActive", v === "active")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={updateMut.isPending} className="w-full">
                {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
