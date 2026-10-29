"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Pencil, Eye } from "lucide-react";
import { useInterns } from "@/features/interns/hooks";
import { useSupervisorMe } from "@/features/supervisors/hooks";
import { useAuth } from "@/lib/auth/context";
import { EditInternSheet } from "@/features/interns/components/EditInternSheet";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Intern, InternshipStatus, InternshipType } from "@/types";

const STATUS_LABELS: Record<InternshipStatus, string> = {
  SCREENED: "Screened",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

const STATUS_VARIANT: Record<InternshipStatus, "default" | "secondary" | "outline"> = {
  SCREENED: "outline",
  ONBOARDING: "secondary",
  ACTIVE: "default",
  COMPLETED: "secondary",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InternsPage() {
  const { user } = useAuth();
  const isHR = user?.role === "HR";
  const { data: supervisorMeData } = useSupervisorMe();
  const supervisorId = !isHR ? supervisorMeData?.data?.supervisor?._id : undefined;

  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [status, setStatus]             = useState<InternshipStatus | "ALL">("ALL");
  const [internshipType, setType]       = useState<InternshipType | "ALL">("ALL");
  const [page, setPage]                 = useState(1);

  // Edit Sheet State
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [sheetOpen, setSheetOpen]         = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => setDebounced(value), 350);
  };

  const { data, isLoading, isError } = useInterns({
    page,
    limit: 20,
    ...(debouncedSearch          && { search: debouncedSearch }),
    ...(status !== "ALL"         && { status }),
    ...(internshipType !== "ALL" && { internshipType }),
    ...(!isHR && supervisorId    && { supervisor: supervisorId }),
  });

  const interns    = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total      = data?.total ?? 0;

  const handleOpenEdit = (intern: Intern) => {
    setEditingIntern(intern);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{isHR ? "Interns" : "My Interns"}</h2>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} record{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {isHR && (
          <Button asChild>
            <Link href="/interns/new">
              <Plus className="mr-2 h-4 w-4" />
              Add intern
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, institution or course…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            aria-label="Search interns"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as InternshipStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="SCREENED">Screened</SelectItem>
            <SelectItem value="ONBOARDING">Onboarding</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={internshipType}
          onValueChange={(v) => {
            setType(v as InternshipType | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="INTERNSHIP">Internship</SelectItem>
            <SelectItem value="NYSC_IT">NYSC IT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : isError ? (
        <p className="rounded-md border px-4 py-10 text-center text-sm text-destructive">
          Failed to load interns.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No interns found.
                  </TableCell>
                </TableRow>
              ) : (
                interns.map((intern) => (
                  <TableRow key={intern._id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/interns/${intern._id}`}
                        className="font-medium hover:underline"
                      >
                        {intern.firstName} {intern.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{intern.institution}</TableCell>
                    <TableCell className="text-sm">{intern.course}</TableCell>
                    <TableCell className="text-sm">
                      {intern.internshipType === "NYSC_IT" ? "NYSC IT" : "Internship"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[intern.status]}>
                        {STATUS_LABELS[intern.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(intern.startDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(intern.endDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {intern.supervisor && typeof intern.supervisor !== "string"
                        ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem asChild>
                            <Link href={`/interns/${intern._id}`} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                              View details
                            </Link>
                          </DropdownMenuItem>
                          {isHR && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(intern)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                              Quick Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Slide-over Quick Edit Drawer */}
      <EditInternSheet
        intern={editingIntern}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
