import { apiGet, apiPatch } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export type FaceStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface FacePhotoRow {
  internId: string;
  intern: { _id: string; firstName: string; lastName: string; internshipType?: string } | null;
  status: Exclude<FaceStatus, "NONE">;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface InternFace {
  status: FaceStatus;
  submittedAt?: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export const listFacePhotos = (status?: string) =>
  apiGet<ApiResponse<{ photos: FacePhotoRow[] }>>(`/api/v1/face${status ? `?status=${status}` : ""}`);

export const getInternFace = (internId: string) => apiGet<ApiResponse<{ face: InternFace }>>(`/api/v1/face/${internId}`);

export const reviewFace = (internId: string, body: { action: "APPROVE" } | { action: "REJECT"; reason: string }) =>
  apiPatch<ApiResponse<{ face: InternFace }>>(`/api/v1/face/${internId}`, body);

export interface MissingFace { _id: string; firstName: string; lastName: string; internshipType?: string; department?: { name: string } | null }
export const listMissingFaces = () => apiGet<ApiResponse<{ interns: MissingFace[] }>>("/api/v1/face/missing");
