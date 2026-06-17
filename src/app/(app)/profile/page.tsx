import Image from "next/image";
import { redirect } from "next/navigation";
import { Mail, User as UserIcon, LogOut } from "lucide-react";
import { getSessionUser } from "@/lib/demo-session";
import { getStats } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const stats = await getStats(user.id);

  const summary = [
    { label: "Connected", value: stats.connectedAccounts },
    { label: "Published", value: stats.publishedPosts },
    { label: "Scheduled", value: stats.scheduledPosts },
    { label: "Drafts", value: stats.draftPosts },
  ];

  return (
    <>
      <Topbar title="Profile" />
      <div className="max-w-2xl space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={72}
                height={72}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground">
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{user.name ?? "Unnamed user"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Name</span>
              <span className="ml-auto font-medium">{user.name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-medium">{user.email ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {summary.map((s) => (
                <div key={s.label} className="rounded-lg bg-secondary p-4 text-center">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <form
          action={async () => {
            "use server";
            try {
              const { signOut } = await import("@/lib/auth");
              await signOut({ redirectTo: "/" });
            } catch {
              // No active session (demo mode) — just go home.
              redirect("/");
            }
          }}
        >
          <Button type="submit" variant="destructive">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </form>
      </div>
    </>
  );
}
