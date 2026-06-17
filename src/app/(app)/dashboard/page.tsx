import Link from "next/link";
import { Link2, CheckCircle2, CalendarClock, FileText } from "lucide-react";
import { getSessionUser } from "@/lib/demo-session";
import { getStats, listActivity, listPosts } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-green-500/15 text-green-600 dark:text-green-400",
  scheduled: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  draft: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  failed: "bg-destructive/15 text-destructive",
  publishing: "bg-primary/15 text-primary",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  const userId = user.id;

  const [stats, activity, recentPosts] = await Promise.all([
    getStats(userId),
    listActivity(userId, 8),
    listPosts(userId),
  ]);

  const cards = [
    { label: "Connected accounts", value: stats.connectedAccounts, icon: Link2 },
    { label: "Published posts", value: stats.publishedPosts, icon: CheckCircle2 },
    { label: "Scheduled posts", value: stats.scheduledPosts, icon: CalendarClock },
    { label: "Draft posts", value: stats.draftPosts, icon: FileText },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="space-y-6 p-6">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-3xl font-bold">{c.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <c.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent posts */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent posts</CardTitle>
              <Link href="/posts">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPosts.length === 0 && (
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              )}
              {recentPosts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <p className="line-clamp-2 text-sm">{p.content}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[p.status]
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
              {activity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm">{a.detail}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
