import { apiGet, apiPatch } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export interface AppSettings {
  labels: { INTERNSHIP: string; NYSC_IT: string };
  stations: string[];
  updatedAt: string | null;
}

export type UpdateSettingsInput = {
  labels?: Partial<AppSettings["labels"]>;
  stations?: string[];
};

export function getSettings() {
  return apiGet<ApiResponse<{ settings: AppSettings }>>("/api/v1/settings");
}

export function updateSettings(input: UpdateSettingsInput) {
  return apiPatch<ApiResponse<{ settings: AppSettings }>>("/api/v1/settings", input);
}
