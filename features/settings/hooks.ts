"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSettings, updateSettings, type AppSettings, type UpdateSettingsInput } from "./api";

export const SETTINGS_KEY = ["settings"] as const;

/** Used until the API answers, or if it can't (older API without /settings). */
export const DEFAULT_SETTINGS: AppSettings = {
  labels: { INTERNSHIP: "Intern", NYSC_IT: "Corps member" },
  stations: ["AIT", "Raypower", "Faaji", "DAAR Corporate"],
  stipend: { INTERNSHIP: { days: 20, amount: 40_000 }, NYSC_IT: { days: 16, amount: 50_000 } },
  faceCheck: { enabled: true, threshold: 0.35 },
  allowance: { INTERNSHIP: false, NYSC_IT: true },
  lateAfter: "10:00",
  updatedAt: null,
};

export function useSettings() {
  const q = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const s = (await getSettings()).data?.settings;
      return s ? { ...DEFAULT_SETTINGS, ...s, stipend: s.stipend ?? DEFAULT_SETTINGS.stipend, faceCheck: s.faceCheck ?? DEFAULT_SETTINGS.faceCheck, allowance: s.allowance ?? DEFAULT_SETTINGS.allowance, lateAfter: s.lateAfter || DEFAULT_SETTINGS.lateAfter } : DEFAULT_SETTINGS;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  return { ...q, settings: q.data ?? DEFAULT_SETTINGS };
}

/** Label for an internship type, as HR has named it ("Intern", "Corps member"). */
export function useTypeLabel() {
  const { settings } = useSettings();
  return useCallback(
    (type?: string | null) =>
      type === "NYSC_IT" ? settings.labels.NYSC_IT : type === "INTERNSHIP" ? settings.labels.INTERNSHIP : "—",
    [settings],
  );
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => (await updateSettings(input)).data?.settings ?? DEFAULT_SETTINGS,
    onSuccess: (settings) => {
      qc.setQueryData(SETTINGS_KEY, settings);
      toast.success("Saved. The new wording shows everywhere straight away.");
    },
    onError: (err: Error) => toast.error(err.message || "Couldn't save. Try again."),
  });
}

/** Simple English plural for a label ("Corps member" → "Corps members"). */
export function pluralLabel(label: string) {
  return /s$/i.test(label) ? label : `${label}s`;
}
