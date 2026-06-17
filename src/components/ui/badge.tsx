import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-green-500/15 text-green-600 dark:text-green-400",
  scheduled: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  draft: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  failed: "bg-destructive/15 text-destructive",
  publishing: "bg-primary/15 text-primary",
};

/** Colored status pill for a post status. */
export function StatusBadge({
  status,
  className,
}: {
  status: PostStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLE[status],
        className
      )}
    >
      {status}
    </span>
  );
}
