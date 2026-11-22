"use client";

import { useQuery } from "@tanstack/react-query";
import { getStipendReport } from "./api";

export function useStipendReport(from: string, to: string) {
  return useQuery({
    queryKey: ["stipends", from, to],
    queryFn: async () => (await getStipendReport(from, to)).data?.report,
    enabled: Boolean(from && to && from <= to),
  });
}
