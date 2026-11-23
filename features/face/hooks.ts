"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInternFace, listFacePhotos, reviewFace } from "./api";

export function useFacePhotos(status?: string) {
  return useQuery({
    queryKey: ["face", "list", status ?? "all"],
    queryFn: async () => (await listFacePhotos(status)).data?.photos ?? [],
    retry: 1,
  });
}

export function useInternFace(internId: string) {
  return useQuery({
    queryKey: ["face", "intern", internId],
    queryFn: async () => (await getInternFace(internId)).data?.face ?? { status: "NONE" as const },
    enabled: Boolean(internId),
    retry: 1,
  });
}

export function useReviewFace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ internId, ...body }: { internId: string } & ({ action: "APPROVE" } | { action: "REJECT"; reason: string })) =>
      reviewFace(internId, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["face"] });
      toast.success(v.action === "APPROVE" ? "Photo approved. Their check-ins will now be matched to it." : "Asked them for a new photo.");
    },
    onError: (err: Error) => toast.error(err.message || "Couldn't save. Try again."),
  });
}
