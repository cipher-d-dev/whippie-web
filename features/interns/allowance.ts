"use client";

import { useSettings, useTypeLabel } from "@/features/settings/hooks";

/** Is this intern on payroll? Their own setting, or the default for their type. */
export function useAllowance() {
  const { settings } = useSettings();
  const typeLabel = useTypeLabel();
  return (intern: { internshipType?: string; receivesAllowance?: boolean | null }) => {
    const type = (intern.internshipType === "NYSC_IT" ? "NYSC_IT" : "INTERNSHIP") as "NYSC_IT" | "INTERNSHIP";
    const byDefault = settings.allowance[type];
    const explicit = typeof intern.receivesAllowance === "boolean";
    const on = explicit ? (intern.receivesAllowance as boolean) : byDefault;
    return {
      on,
      explicit,
      label: on ? "On allowance" : "No allowance",
      detail: explicit ? "Set for this person" : `Default for ${typeLabel(type).toLowerCase()}s`,
    };
  };
}
