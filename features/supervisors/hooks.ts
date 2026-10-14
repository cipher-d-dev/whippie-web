import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listSupervisors,
  getSupervisor,
  getSupervisorInterns,
  createSupervisor,
  updateSupervisor,
  assignSupervisor,
  removeSupervisor,
  assignDepartment,
  removeDepartment,
} from "./api";
import { internKeys } from "@/features/interns/hooks";
import type { CreateSupervisorInput, UpdateSupervisorInput } from "@/types";

export const supervisorKeys = {
  all:    () => ["supervisors"] as const,
  list:   (p?: object) => ["supervisors", "list", p ?? {}] as const,
  detail: (id: string) => ["supervisors", "detail", id] as const,
  interns:(id: string) => ["supervisors", "interns", id] as const,
};

export function useSupervisors(params?: {
  page?: number;
  limit?: number;
  department?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: supervisorKeys.list(params),
    queryFn:  () => listSupervisors(params),
  });
}

export function useSupervisor(id: string) {
  return useQuery({
    queryKey: supervisorKeys.detail(id),
    queryFn:  () => getSupervisor(id),
    enabled:  Boolean(id),
  });
}

export function useSupervisorInterns(id: string) {
  return useQuery({
    queryKey: supervisorKeys.interns(id),
    queryFn:  () => getSupervisorInterns(id),
    enabled:  Boolean(id),
  });
}

export function useCreateSupervisor(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupervisorInput) => createSupervisor(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.all() });
      toast.success("Supervisor created.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create supervisor."),
  });
}

export function useUpdateSupervisor(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSupervisorInput) => updateSupervisor(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.all() });
      qc.invalidateQueries({ queryKey: supervisorKeys.detail(id) });
      toast.success("Supervisor updated.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update supervisor."),
  });
}

export function useAssignSupervisor(internId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (supervisorId: string) => assignSupervisor(internId, supervisorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internKeys.detail(internId) });
      qc.invalidateQueries({ queryKey: supervisorKeys.all() });
      toast.success("Supervisor assigned.");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to assign supervisor."),
  });
}

export function useRemoveSupervisor(internId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeSupervisor(internId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internKeys.detail(internId) });
      qc.invalidateQueries({ queryKey: supervisorKeys.all() });
      toast.success("Supervisor removed.");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove supervisor."),
  });
}

export function useAssignDepartment(internId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => assignDepartment(internId, departmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internKeys.detail(internId) });
      toast.success("Department assigned.");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to assign department."),
  });
}

export function useRemoveDepartment(internId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeDepartment(internId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internKeys.detail(internId) });
      toast.success("Department removed.");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove department."),
  });
}
