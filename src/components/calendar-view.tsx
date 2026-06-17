"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Month grid showing scheduled/published posts on their dates. */
export function CalendarView({ posts }: { posts: Post[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Map ISO date (yyyy-mm-dd) → posts on that day.
  const byDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const iso = (p.scheduled_at ?? p.published_at)?.slice(0, 10);
      if (!iso) continue;
      const arr = map.get(iso) ?? [];
      arr.push(p);
      map.set(iso, arr);
    }
    return map;
  }, [posts]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  // Build the cell array: leading blanks + days.
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
              day
            ).padStart(2, "0")}`;
            const dayPosts = byDate.get(iso) ?? [];
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={cn(
                  "min-h-[84px] rounded-lg border p-1.5",
                  isToday ? "border-primary bg-accent/40" : "border-border"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1 truncate rounded bg-secondary px-1 py-0.5 text-[10px]"
                      title={p.content}
                    >
                      {p.targets[0] && (
                        <PlatformIcon
                          platform={p.targets[0].platform}
                          brandColor
                          className="h-3 w-3 shrink-0"
                        />
                      )}
                      <span className="truncate">{p.content}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
