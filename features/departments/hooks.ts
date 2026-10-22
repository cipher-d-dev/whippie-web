import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./api";
import { ApiError, applyApiErrors } from "@/lib/api/client";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "@/types";

type SetError = (field: string, error: { type: string; message: string }) => void;

export const departmentKeys = {
  all:    () => ["departments"] as const,
  list:   (p?: object) => ["departments", "list", p ?? {}] as const,
  detail: (id: string) => ["departments", "detail", id] as const,
};

export function useDepartments(params?: { page?: number; limit?: number; isActive?: boolean }) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn:  () => listDepartments(params),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn:  () => getDepartment(id),
    enabled:  Boolean(id),
  });
}

export function useCreateDepartment(onSuccess?: () => void, setError?: SetError) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => createDepartment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all() });
      toast.success("Department created.");
      onSuccess?.();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && setError) {
        applyApiErrors(err, setError);
      }
      toast.error(err.message ?? "Failed to create department.");
    },
  });
}

export function useUpdateDepartment(id: string, onSuccess?: () => void, setError?: SetError) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDepartmentInput) => updateDepartment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all() });
      qc.invalidateQueries({ queryKey: departmentKeys.detail(id) });
      toast.success("Department updated.");
      onSuccess?.();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && setError) {
        applyApiErrors(err, setError);
      }
      toast.error(err.message ?? "Failed to update department.");
    },
  });
}

export function useDeleteDepartment(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all() });
      toast.success("Department deleted.");
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete department.");
    },
  });
}
