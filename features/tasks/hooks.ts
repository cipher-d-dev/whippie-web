import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listTasks, getTask, createTask, updateTask } from "./api";
import type { TaskStatus, CreateTaskInput, UpdateTaskInput } from "@/types";

export const taskKeys = {
  all:    () => ["tasks"] as const,
  list:   (p?: object) => ["tasks", "list", p ?? {}] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

export function useTasks(params?: {
  page?: number; limit?: number;
  status?: TaskStatus; intern?: string; supervisor?: string;
}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn:  () => listTasks(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn:  () => getTask(id),
    enabled:  Boolean(id),
  });
}

export function useCreateTask(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all() });
      toast.success("Task created.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create task."),
  });
}

export function useUpdateTask(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all() });
      qc.invalidateQueries({ queryKey: taskKeys.detail(id) });
      toast.success("Task updated.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update task."),
  });
}
