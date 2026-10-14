import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTaskSubmissions, reviewSubmission } from "./api";
import { taskKeys } from "@/features/tasks/hooks";

export const submissionKeys = {
  forTask: (taskId: string) => ["submissions", "task", taskId] as const,
};

export function useTaskSubmissions(taskId: string) {
  return useQuery({
    queryKey: submissionKeys.forTask(taskId),
    queryFn:  () => getTaskSubmissions(taskId),
    enabled:  Boolean(taskId),
  });
}

export function useReviewSubmission(submissionId: string, taskId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { status: "APPROVED" | "CHANGES_REQUESTED"; feedback?: string }) =>
      reviewSubmission(submissionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: submissionKeys.forTask(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all() });
      toast.success("Submission reviewed.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to review submission."),
  });
}
