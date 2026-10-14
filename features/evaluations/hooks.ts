import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listEvaluations, getEvaluation, createEvaluation, updateEvaluation, submitEvaluation } from "./api";
import type { EvaluationStatus, EvaluationScores } from "@/types";

export const evaluationKeys = {
  all:    () => ["evaluations"] as const,
  list:   (p?: object) => ["evaluations", "list", p ?? {}] as const,
  detail: (id: string) => ["evaluations", "detail", id] as const,
};

export function useEvaluations(params?: { page?: number; limit?: number; status?: EvaluationStatus; intern?: string; supervisor?: string }) {
  return useQuery({ queryKey: evaluationKeys.list(params), queryFn: () => listEvaluations(params) });
}

export function useEvaluation(id: string) {
  return useQuery({ queryKey: evaluationKeys.detail(id), queryFn: () => getEvaluation(id), enabled: Boolean(id) });
}

export function useCreateEvaluation(onSuccess?: (id: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvaluation,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: evaluationKeys.all() });
      toast.success("Evaluation saved as draft.");
      onSuccess?.(res.data?.evaluation._id ?? "");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create evaluation."),
  });
}

export function useUpdateEvaluation(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scores?: Partial<EvaluationScores>; comments?: string }) => updateEvaluation(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: evaluationKeys.detail(id) });
      toast.success("Evaluation updated.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update evaluation."),
  });
}

export function useSubmitEvaluation(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitEvaluation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: evaluationKeys.all() });
      qc.invalidateQueries({ queryKey: evaluationKeys.detail(id) });
      toast.success("Evaluation submitted.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to submit evaluation."),
  });
}
