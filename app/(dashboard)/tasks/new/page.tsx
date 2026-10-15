"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTask } from "@/features/tasks/hooks";
import { useInterns } from "@/features/interns/hooks";
import { useSupervisorMe, useSupervisorInterns } from "@/features/supervisors/hooks";
import { useAuth } from "@/lib/auth/context";
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
  title:       z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  internId:    z.string().min(1, "Assign to an intern"),
  deadline:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
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

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();

  // HR sees all active interns; supervisor sees only their assigned interns
  const isHR = user?.role === "HR";
  const { data: meData } = useSupervisorMe();
  const supervisorId = meData?.data?.supervisor?._id ?? "";

  const { data: allInternsData }  = useInterns({ status: "ACTIVE", limit: 100 });
  const { data: myInternsData }   = useSupervisorInterns(supervisorId);

  const interns = isHR
    ? (allInternsData?.data ?? [])
    : (myInternsData?.data?.interns ?? []);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useCreateTask(() => router.push("/tasks"), setError as (field: string, error: { type: string; message: string }) => void);

  const onSubmit = (values: FormValues) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as FormValues;
    mutation.mutate(cleaned);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tasks
          </Link>
        </Button>
        <h2 className="mt-2 text-xl font-semibold">Create task</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Task details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title" required error={errors.title?.message}>
              <Input placeholder="e.g. Write news script for Lagos flood story" {...register("title")} />
            </Field>

            <Field label="Description" required error={errors.description?.message}>
              <Textarea
                placeholder="Describe what the intern needs to do, any references, expected output…"
                rows={4}
                className="resize-none"
                {...register("description")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assign to intern" required error={errors.internId?.message}>
                <Select
                  value={watch("internId") ?? ""}
                  onValueChange={(v) => setValue("internId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intern" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.length === 0 && (
                      <SelectItem value="" disabled>
                        {isHR ? "No active interns" : "No interns assigned to you"}
                      </SelectItem>
                    )}
                    {interns.map((i) => (
                      <SelectItem key={i._id} value={i._id}>
                        {i.firstName} {i.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Deadline (optional)" error={errors.deadline?.message}>
                <Input type="datetime-local" {...register("deadline")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/tasks">Cancel</Link>
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create task
          </Button>
        </div>
      </form>
    </div>
  );
}
