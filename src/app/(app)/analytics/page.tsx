import { CheckCircle2, XCircle, TrendingUp, Hash } from "lucide-react";
import { getSessionUser } from "@/lib/demo-session";
import { getAnalytics } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/platform-icon";

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  const a = await getAnalytics(user.id, 14);

  const maxDay = Math.max(1, ...a.perDay.map((d) => d.count));
  const maxPlatform = Math.max(1, ...a.perPlatform.map((p) => p.count));

  return (
    <>
      <Topbar title="Analytics" />
      <div className="space-y-6 p-6">
        {/* Top stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="mt-1 text-3xl font-bold">{a.totalPublished}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="mt-1 text-3xl font-bold">{a.totalFailed}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-muted-foreground">Success rate</p>
                <p className="mt-1 text-3xl font-bold">{a.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Posts per day */}
          <Card>
            <CardHeader>
              <CardTitle>Posts published (last 14 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-end gap-1">
                {a.perDay.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary transition-all"
                      style={{
                        height: `${(d.count / maxDay) * 100}%`,
                        minHeight: d.count > 0 ? "4px" : "0",
                      }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {d.date.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per platform */}
          <Card>
            <CardHeader>
              <CardTitle>By platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.perPlatform.length === 0 && (
                <p className="text-sm text-muted-foreground">No published posts yet.</p>
              )}
              {a.perPlatform.map((p) => (
                <div key={p.platform} className="flex items-center gap-3">
                  <PlatformIcon platform={p.platform} brandColor className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(p.count / maxPlatform) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right text-sm font-medium">{p.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Top hashtags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-4 w-4" /> Top hashtags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {a.topHashtags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hashtags used yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {a.topHashtags.map((h) => (
                  <span
                    key={h.tag}
                    className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground"
                  >
                    #{h.tag} <span className="text-muted-foreground">×{h.count}</span>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
