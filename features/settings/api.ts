import { apiGet, apiPatch } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export interface StipendRule { days: number; amount: number }

export interface AppSettings {
  labels: { INTERNSHIP: string; NYSC_IT: string };
  stations: string[];
  stipend: { INTERNSHIP: StipendRule; NYSC_IT: StipendRule };
  updatedAt: string | null;
}

export type UpdateSettingsInput = {
  labels?: Partial<AppSettings["labels"]>;
  stations?: string[];
  stipend?: { INTERNSHIP?: Partial<StipendRule>; NYSC_IT?: Partial<StipendRule> };
};

export function getSettings() {
  return apiGet<ApiResponse<{ settings: AppSettings }>>("/api/v1/settings");
}

export function updateSettings(input: UpdateSettingsInput) {
  return apiPatch<ApiResponse<{ settings: AppSettings }>>("/api/v1/settings", input);
}
