"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { DepartmentsManager } from "@/features/configuration/DepartmentsManager";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description={<>Where interns and supervisors are placed. Station names and other wording are on <Link href="/configuration" className="font-medium text-primary hover:underline">Configuration</Link>.</>}
      />
      <DepartmentsManager />
    </div>
  );
}
