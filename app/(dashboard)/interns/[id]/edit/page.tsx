"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useIntern, useUpdateIntern } from "@/features/interns/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  // HR fields
  status:         z.enum(["SCREENED", "ONBOARDING", "ACTIVE", "COMPLETED"]).optional(),
  internshipType: z.enum(["INTERNSHIP", "NYSC_IT"]).optional(),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
  // Shared fields
  phone:          z.string().optional(),
  address:        z.string().optional(),
  institution:    z.string().optional(),
  course:         z.string().optional(),
  level:          z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditInternPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router  = useRouter();

  const { data, isLoading } = useIntern(id);
  const intern = data?.data?.intern;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Pre-fill once the intern loads
  useEffect(() => {
    if (!intern) return;
    reset({
      status:         intern.status,
      internshipType: intern.internshipType,
      startDate:      intern.startDate?.slice(0, 10) ?? "",
      endDate:        intern.endDate?.slice(0, 10) ?? "",
      phone:          intern.phone ?? "",
      address:        intern.address ?? "",
      institution:    intern.institution,
      course:         intern.course,
      level:          intern.level ?? "",
    });
  }, [intern, reset]);

  const mutation = useUpdateIntern(id, () =>
    router.push(`/interns/${id}`), setError as (field: string, error: { type: string; message: string }) => void
  );

  const onSubmit = (values: FormValues) => {
    // Only send fields that have a value
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as FormValues;
    mutation.mutate(cleaned);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-destructive">Intern not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/interns">Back to interns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/interns/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to intern
          </Link>
        </Button>
        <h2 className="mt-2 text-xl font-semibold">
          Edit — {intern.firstName} {intern.lastName}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* HR-only fields */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Internship details (HR)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" error={errors.status?.message}>
              <Select
                value={watch("status") ?? ""}
                onValueChange={(v) =>
                  setValue("status", v as FormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCREENED">Screened</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Type" error={errors.internshipType?.message}>
              <Select
                value={watch("internshipType") ?? ""}
                onValueChange={(v) =>
                  setValue("internshipType", v as FormValues["internshipType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  <SelectItem value="NYSC_IT">NYSC IT</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Start date" error={errors.startDate?.message}>
              <Input type="date" {...register("startDate")} />
            </Field>
            <Field label="End date" error={errors.endDate?.message}>
              <Input type="date" {...register("endDate")} />
            </Field>
          </CardContent>
        </Card>

        {/* Personal info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Personal information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone?.message}>
              <Input placeholder="08012345678" {...register("phone")} />
            </Field>
            <Field label="Address" error={errors.address?.message}>
              <Textarea
                placeholder="12 Marina, Lagos"
                className="resize-none"
                rows={2}
                {...register("address")}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Academic info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Academic information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Institution" error={errors.institution?.message}>
              <Input {...register("institution")} />
            </Field>
            <Field label="Course" error={errors.course?.message}>
              <Input {...register("course")} />
            </Field>
            <Field label="Level / Year" error={errors.level?.message}>
              <Input placeholder="300L" {...register("level")} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/interns/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
