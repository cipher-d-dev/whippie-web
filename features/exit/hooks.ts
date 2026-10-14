import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getExitChecklist, completeInternship } from "./api";
import { internKeys } from "@/features/interns/hooks";

export const exitKeys = {
  checklist: (internId: string) => ["exit", "checklist", internId] as const,
};

export function useExitChecklist(internId: string) {
  return useQuery({
    queryKey: exitKeys.checklist(internId),
    queryFn:  () => getExitChecklist(internId),
    enabled:  Boolean(internId),
  });
}

export function useCompleteInternship(internId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (completionNote?: string) => completeInternship(internId, completionNote),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: internKeys.all() });
      qc.invalidateQueries({ queryKey: internKeys.detail(internId) });
      qc.invalidateQueries({ queryKey: exitKeys.checklist(internId) });
      toast.success(res.message ?? "Internship completed.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to complete internship."),
  });
}
