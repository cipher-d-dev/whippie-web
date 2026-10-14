import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listInterns, getIntern, createIntern, updateIntern } from "./api";
import type {
  InternsListParams,
  CreateInternInput,
  UpdateInternInput,
} from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const internKeys = {
  all:    () => ["interns"] as const,
  list:   (params: InternsListParams) => ["interns", "list", params] as const,
  detail: (id: string)                => ["interns", "detail", id] as const,
};

// ─── List ─────────────────────────────────────────────────────────────────────

export function useInterns(params: InternsListParams = {}) {
  return useQuery({
    queryKey: internKeys.list(params),
    queryFn:  () => listInterns(params),
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useIntern(id: string) {
  return useQuery({
    queryKey: internKeys.detail(id),
    queryFn:  () => getIntern(id),
    enabled:  Boolean(id),
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateIntern(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInternInput) => createIntern(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internKeys.all() });
      toast.success("Intern created successfully.");
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to create intern.");
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateIntern(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInternInput) => updateIntern(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internKeys.all() });
      qc.invalidateQueries({ queryKey: internKeys.detail(id) });
      toast.success("Intern updated successfully.");
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update intern.");
    },
  });
}
