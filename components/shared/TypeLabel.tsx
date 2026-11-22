"use client";

import { pluralLabel, useTypeLabel } from "@/features/settings/hooks";

/** What HR calls this kind of intern ("Intern", "Corps member"). Set on Configuration. */
export function TypeLabel({ type, plural }: { type?: string | null; plural?: boolean }) {
  const label = useTypeLabel()(type);
  return <>{plural ? pluralLabel(label) : label}</>;
}
