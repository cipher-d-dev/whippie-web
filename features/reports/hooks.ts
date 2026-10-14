import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listReports, getReport, reviewReport } from "./api";
import type { ReportStatus, ReportType } from "@/types";

export const reportKeys = {
  all:    () => ["reports"] as const,
  list:   (p?: object) => ["reports", "list", p ?? {}] as const,
  detail: (id: string) => ["reports", "detail", id] as const,
};

export function useReports(params?: { page?: number; limit?: number; status?: ReportStatus; type?: ReportType; intern?: string }) {
  return useQuery({ queryKey: reportKeys.list(params), queryFn: () => listReports(params) });
}

export function useReport(id: string) {
  return useQuery({ queryKey: reportKeys.detail(id), queryFn: () => getReport(id), enabled: Boolean(id) });
}

export function useReviewReport(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feedback: string) => reviewReport(id, feedback),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.all() });
      qc.invalidateQueries({ queryKey: reportKeys.detail(id) });
      toast.success("Report reviewed.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to review report."),
  });
}
