"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCreateIntern } from "@/features/interns/hooks";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:      z.string().min(1, "First name is required"),
  lastName:       z.string().min(1, "Last name is required"),
  institution:    z.string().min(1, "Institution is required"),
  course:         z.string().min(1, "Course is required"),
  internshipType: z.enum(["INTERNSHIP", "NYSC_IT"]),
  status:         z.enum(["SCREENED", "ONBOARDING", "ACTIVE", "COMPLETED"]).optional(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  level:          z.string().optional(),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
  userId:         z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewInternPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { internshipType: "INTERNSHIP", status: "SCREENED" },
  });

  const mutation = useCreateIntern(() => router.push("/interns"));

  const onSubmit = (values: FormValues) => {
    // Strip empty optional strings so the API doesn't receive ""
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as FormValues;
    mutation.mutate(cleaned);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back nav */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/interns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to interns
          </Link>
        </Button>
        <h2 className="mt-2 text-xl font-semibold">Add new intern</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Personal information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required error={errors.firstName?.message}>
              <Input placeholder="Ada" {...register("firstName")} />
            </Field>
            <Field label="Last name" required error={errors.lastName?.message}>
              <Input placeholder="Okafor" {...register("lastName")} />
            </Field>
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
            <Field label="Institution" required error={errors.institution?.message}>
              <Input placeholder="University of Lagos" {...register("institution")} />
            </Field>
            <Field label="Course" required error={errors.course?.message}>
              <Input placeholder="Computer Science" {...register("course")} />
            </Field>
            <Field label="Level / Year" error={errors.level?.message}>
              <Input placeholder="300L" {...register("level")} />
            </Field>
          </CardContent>
        </Card>

        {/* Internship info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Internship details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" required error={errors.internshipType?.message}>
              <Select
                value={watch("internshipType")}
                onValueChange={(v) =>
                  setValue("internshipType", v as "INTERNSHIP" | "NYSC_IT")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  <SelectItem value="NYSC_IT">NYSC IT</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Initial status" error={errors.status?.message}>
              <Select
                value={watch("status") ?? "SCREENED"}
                onValueChange={(v) =>
                  setValue(
                    "status",
                    v as "SCREENED" | "ONBOARDING" | "ACTIVE" | "COMPLETED"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCREENED">Screened</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
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

        {/* Linked account (optional) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Linked account (optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="User ID" error={errors.userId?.message}>
              <Input
                placeholder="Paste approved intern account ID"
                {...register("userId")}
              />
            </Field>
            <p className="mt-2 text-xs text-muted-foreground">
              Leave blank to create a standalone record without linking to a user account.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/interns">Cancel</Link>
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create intern
          </Button>
        </div>
      </form>
    </div>
  );
}
