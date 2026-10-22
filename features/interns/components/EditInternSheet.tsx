"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useUpdateIntern } from "@/features/interns/hooks";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Intern } from "@/types";

const schema = z.object({
  status: z.enum(["SCREENED", "ONBOARDING", "ACTIVE", "COMPLETED"]).optional(),
  internshipType: z.enum(["INTERNSHIP", "NYSC_IT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
  course: z.string().optional(),
  level: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

interface EditInternSheetProps {
  intern: Intern | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInternSheet({ intern, open, onOpenChange }: EditInternSheetProps) {
  const updateIntern = useUpdateIntern(intern?._id ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (intern) {
      reset({
        status: intern.status,
        internshipType: intern.internshipType,
        startDate: toInputDate(intern.startDate),
        endDate: toInputDate(intern.endDate),
        phone: intern.phone ?? "",
        address: intern.address ?? "",
        institution: intern.institution ?? "",
        course: intern.course ?? "",
        level: intern.level ?? "",
      });
    }
  }, [intern, reset]);

  const onSubmit = (values: FormValues) => {
    if (!intern) return;
    updateIntern.mutate(
      {
        ...(values.status && { status: values.status }),
        ...(values.internshipType && { internshipType: values.internshipType }),
        ...(values.startDate && { startDate: values.startDate }),
        ...(values.endDate && { endDate: values.endDate }),
        ...(values.phone !== undefined && { phone: values.phone }),
        ...(values.address !== undefined && { address: values.address }),
        ...(values.institution !== undefined && { institution: values.institution }),
        ...(values.course !== undefined && { course: values.course }),
        ...(values.level !== undefined && { level: values.level }),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const status = watch("status");
  const internshipType = watch("internshipType");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-lg w-full p-0">
        <SheetHeader className="px-6 pt-6 pb-2 border-b">
          <SheetTitle>Edit Intern Details</SheetTitle>
          <SheetDescription>
            Update status, academic details, and internship duration for{" "}
            <span className="font-semibold text-foreground">
              {intern?.firstName} {intern?.lastName}
            </span>.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <form id="edit-intern-sheet-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-4">
            {/* Program Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Program & Status
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) =>
                      setValue("status", val as FormValues["status"], { shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCREENED">Screened</SelectItem>
                      <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={internshipType}
                    onValueChange={(val) =>
                      setValue("internshipType", val as FormValues["internshipType"], {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      <SelectItem value="NYSC_IT">NYSC IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-start-date">Start Date</Label>
                  <Input id="sheet-start-date" type="date" {...register("startDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-end-date">End Date</Label>
                  <Input id="sheet-end-date" type="date" {...register("endDate")} />
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Academic Information
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-institution">Institution</Label>
                <Input
                  id="sheet-institution"
                  placeholder="e.g. University of Lagos"
                  {...register("institution")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-course">Course of Study</Label>
                  <Input
                    id="sheet-course"
                    placeholder="e.g. Mass Communication"
                    {...register("course")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-level">Level</Label>
                  <Input id="sheet-level" placeholder="e.g. 400L" {...register("level")} />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Contact Details
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-phone">Phone Number</Label>
                <Input id="sheet-phone" placeholder="08012345678" {...register("phone")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sheet-address">Residential Address</Label>
                <Textarea
                  id="sheet-address"
                  rows={2}
                  placeholder="Full residential address"
                  {...register("address")}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t gap-2 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateIntern.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-intern-sheet-form"
            disabled={!isDirty || updateIntern.isPending}
          >
            {updateIntern.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
