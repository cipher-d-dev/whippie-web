"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useReport } from "@/features/reports/hooks";
import { ReportReader } from "@/features/reports/components/ReportReader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useReport(id);
  const report = data?.data?.report;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Reports
      </Link>
      {isLoading ? (
        <Skeleton className="h-[480px] w-full rounded-xl" />
      ) : isError || !report ? (
        <div className="py-24 text-center">
          <p className="text-lg font-semibold">We couldn&apos;t find that report</p>
          <Button variant="outline" size="sm" asChild className="mt-5"><Link href="/reports">Back to reports</Link></Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <ReportReader report={report} />
        </div>
      )}
    </div>
  );
}
