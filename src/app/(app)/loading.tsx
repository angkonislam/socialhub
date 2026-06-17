import { Skeleton } from "@/components/ui/skeleton";

/** Shown in the content area while an authenticated page loads. */
export default function Loading() {
  return (
    <div>
      {/* Topbar placeholder */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
