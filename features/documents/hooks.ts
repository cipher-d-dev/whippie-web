import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listRequirements,
  createRequirement,
  getChecklist,
  listDocuments,
  getDocument,
  createDocument,
  markPhysical,
  reviewDocument,
} from "./api";
import type { DocumentStatus, DocumentType } from "@/types";

export const documentKeys = {
  all:          () => ["documents"] as const,
  list:         (p?: object) => ["documents", "list", p ?? {}] as const,
  detail:       (id: string) => ["documents", "detail", id] as const,
  checklist:    (internId: string) => ["documents", "checklist", internId] as const,
  requirements: () => ["documents", "requirements"] as const,
};

export function useRequirements() {
  return useQuery({
    queryKey: documentKeys.requirements(),
    queryFn:  listRequirements,
  });
}

export function useCreateRequirement(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRequirement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.requirements() });
      toast.success("Requirement created.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create requirement."),
  });
}

export function useChecklist(internId: string) {
  return useQuery({
    queryKey: documentKeys.checklist(internId),
    queryFn:  () => getChecklist(internId),
    enabled:  Boolean(internId),
  });
}

export function useDocuments(params?: {
  page?: number;
  limit?: number;
  intern?: string;
  status?: DocumentStatus;
  type?: DocumentType;
}) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn:  () => listDocuments(params),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn:  () => getDocument(id),
    enabled:  Boolean(id),
  });
}

export function useCreateDocument(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all() });
      toast.success("Document record created.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create document record."),
  });
}

export function useMarkPhysical(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => markPhysical(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all() });
      qc.invalidateQueries({ queryKey: documentKeys.detail(id) });
      toast.success("Marked as physically received.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update status."),
  });
}

export function useReviewDocument(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewDocument.bind(null, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all() });
      qc.invalidateQueries({ queryKey: documentKeys.detail(id) });
      toast.success("Document reviewed.");
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to review document."),
  });
}
