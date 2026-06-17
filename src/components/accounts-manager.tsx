"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlatformIcon } from "@/components/platform-icon";
import type { ConnectedAccount, Platform } from "@/lib/types";

const OAUTH_ERRORS: Record<string, string> = {
  fb_not_configured: "Facebook is not configured.",
  fb_denied: "Facebook connection was cancelled.",
  fb_missing_code: "Facebook returned no authorization code.",
  fb_bad_state: "Security check failed. Please try again.",
  fb_token_failed: "Could not get a Facebook access token.",
  fb_pages_failed: "Could not load your Facebook Pages.",
  fb_no_pages: "No Facebook Pages found on your account.",
  fb_unexpected: "Unexpected error connecting to Facebook.",
  yt_not_configured: "YouTube (Google) is not configured.",
  yt_denied: "YouTube connection was cancelled.",
  yt_missing_code: "YouTube returned no authorization code.",
  yt_bad_state: "Security check failed. Please try again.",
  yt_token_failed: "Could not get a YouTube access token.",
  yt_unexpected: "Unexpected error connecting to YouTube.",
};

const CONNECTABLE: { platform: Platform; label: string }[] = [
  { platform: "facebook", label: "Facebook Page" },
  { platform: "youtube", label: "YouTube Channel" },
  { platform: "instagram", label: "Instagram Business" },
  { platform: "telegram", label: "Telegram Channel" },
  { platform: "tiktok", label: "TikTok Account" },
];

/** Connect/disconnect UI for social accounts. Talks to /api/accounts. */
export function AccountsManager({
  initialAccounts,
  facebookLive = false,
  youtubeLive = false,
  instagramLive = false,
}: {
  initialAccounts: ConnectedAccount[];
  facebookLive?: boolean;
  youtubeLive?: boolean;
  instagramLive?: boolean;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDisconnect, setPendingDisconnect] =
    useState<ConnectedAccount | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    const count = params.get("count");
    if (connected === "facebook") {
      const ig = params.get("ig");
      const fbCount = count ? parseInt(count) - (ig ? parseInt(ig) : 0) : 0;
      const parts = [];
      if (fbCount > 0) parts.push(`${fbCount} Facebook Page(s)`);
      if (ig && parseInt(ig) > 0) parts.push(`${ig} Instagram account(s)`);
      toast.success(parts.length ? `Connected: ${parts.join(" + ")}` : "Already connected");
    } else if (connected === "youtube") {
      toast.success(count && count !== "0" ? `Connected ${count} YouTube Channel(s)` : "YouTube already connected");
    } else if (error) {
      toast.error(OAUTH_ERRORS[error] ?? "Could not connect.");
    }
    if (connected || error) {
      window.history.replaceState({}, "", "/accounts");
    }
  }, []);

  async function connect(platform: Platform) {
    if (platform === "facebook" && facebookLive) {
      window.location.href = "/api/connect/facebook";
      return;
    }
    if (platform === "instagram" && instagramLive) {
      // Instagram Business accounts are fetched via the Facebook OAuth flow
      window.location.href = "/api/connect/facebook";
      return;
    }
    if (platform === "youtube" && youtubeLive) {
      window.location.href = "/api/connect/youtube";
      return;
    }
    setBusy(platform);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        const { account } = await res.json();
        setAccounts((prev) => [account, ...prev]);
        toast.success(`Connected ${account.display_name}`);
      } else {
        toast.error("Could not connect account");
      }
    } catch {
      toast.error("Network error while connecting");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!pendingDisconnect) return;
    const id = pendingDisconnect.id;
    setBusy(id);
    try {
      const res = await fetch(`/api/accounts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        toast.success("Account disconnected");
      } else {
        toast.error("Could not disconnect");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(null);
      setPendingDisconnect(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Available to connect */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Connect an account
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTABLE.map(({ platform, label }) => (
            <Card key={platform}>
              <CardContent className="flex items-center justify-between pt-5">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={platform} brandColor className="h-7 w-7" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === platform}
                  onClick={() => connect(platform)}
                >
                  {busy === platform ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Connected list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Connected accounts ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No accounts connected yet. Connect one above to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between pt-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {a.avatar_url ? (
                        <Image
                          src={a.avatar_url}
                          alt={a.display_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-accent" />
                      )}
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                        <PlatformIcon platform={a.platform} brandColor className="h-4 w-4" />
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.display_name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {a.account_type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === a.id}
                    onClick={() => setPendingDisconnect(a)}
                    aria-label="Disconnect"
                  >
                    {busy === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingDisconnect}
        title="Disconnect account?"
        message={`“${pendingDisconnect?.display_name}” will be removed. You can reconnect it anytime.`}
        confirmLabel="Disconnect"
        loading={busy === pendingDisconnect?.id}
        onConfirm={disconnect}
        onClose={() => setPendingDisconnect(null)}
      />
    </div>
  );
}
