import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "./api";

export const dashboardKeys = {
  stats: () => ["dashboard", "stats"] as const,
};

/** All HR dashboard figures in one request. Refreshes every minute. */
export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => (await getDashboardStats()).data ?? null,
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
