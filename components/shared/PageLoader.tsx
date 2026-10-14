import { Skeleton } from "@/components/ui/skeleton";

/** Full-page centered spinner replacement — used in detail page loading states */
export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="space-y-3 w-full max-w-sm">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    </div>
  );
}

export { TableSkeleton, DetailSkeleton, StatCardsSkeleton, CardGridSkeleton, ListSkeleton } from "./Skeletons";
