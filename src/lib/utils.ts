import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract `#hashtags` from a block of text. */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}0-9_]+/gu) ?? [];
  // De-dupe, drop the leading '#'.
  return Array.from(new Set(matches.map((m) => m.slice(1))));
}

/** True when mock platform APIs are enabled. */
export const USE_MOCK_APIS =
  process.env.NEXT_PUBLIC_USE_MOCK_APIS !== "false";

/** Per-platform character limits used by the composer counter. */
export const PLATFORM_LIMITS: Record<string, number> = {
  facebook: 63206,
  instagram: 2200,
  youtube: 5000,
  tiktok: 2200,
  telegram: 4096,
  linkedin: 3000,
};

/** Format an ISO timestamp for compact display. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Cheap unique id for client-side optimistic records. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
