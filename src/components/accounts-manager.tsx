"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X } from "lucide-react";
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
  ig_not_configured: "Instagram is not configured.",
  ig_denied: "Instagram connection was cancelled.",
  ig_missing_code: "Instagram returned no authorization code.",
  ig_bad_state: "Security check failed. Please try again.",
  ig_token_failed: "Could not get an Instagram access token.",
  ig_profile_failed: "Could not load your Instagram profile.",
  ig_unexpected: "Unexpected error connecting to Instagram.",
  tt_not_configured: "TikTok is not configured.",
  tt_denied: "TikTok connection was cancelled.",
  tt_missing_code: "TikTok returned no authorization code.",
  tt_bad_state: "Security check failed. Please try again.",
  tt_token_failed: "Could not get a TikTok access token.",
  tt_profile_failed: "Could not load your TikTok profile.",
  tt_unexpected: "Unexpected error connecting to TikTok.",
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
  tiktokLive = false,
  telegramLive = false,
}: {
  initialAccounts: ConnectedAccount[];
  facebookLive?: boolean;
  youtubeLive?: boolean;
  instagramLive?: boolean;
  tiktokLive?: boolean;
  telegramLive?: boolean;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDisconnect, setPendingDisconnect] =
    useState<ConnectedAccount | null>(null);
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);

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
    } else if (connected === "instagram") {
      toast.success(count && count !== "0" ? `Connected ${count} Instagram account(s)` : "Instagram already connected");
    } else if (connected === "youtube") {
      toast.success(count && count !== "0" ? `Connected ${count} YouTube Channel(s)` : "YouTube already connected");
    } else if (connected === "tiktok") {
      toast.success(count && count !== "0" ? "TikTok account connected" : "TikTok already connected");
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
      window.location.href = "/api/connect/instagram";
      return;
    }
    if (platform === "youtube" && youtubeLive) {
      window.location.href = "/api/connect/youtube";
      return;
    }
    if (platform === "tiktok" && tiktokLive) {
      window.location.href = "/api/connect/tiktok";
      return;
    }
    if (platform === "telegram" && telegramLive) {
      setShowTelegramDialog(true);
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

  async function connectTelegram(botToken: string, channel: string) {
    setBusy("telegram");
    try {
      const res = await fetch("/api/connect/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken, channel }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not connect Telegram channel");
      } else if (json.already_connected) {
        toast.info("Telegram channel already connected");
      } else {
        setAccounts((prev) => [json.account, ...prev]);
        toast.success(`Connected ${json.account.display_name}`);
      }
    } catch {
      toast.error("Network error while connecting Telegram");
    } finally {
      setBusy(null);
      setShowTelegramDialog(false);
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
        message={`"${pendingDisconnect?.display_name}" will be removed. You can reconnect it anytime.`}
        confirmLabel="Disconnect"
        loading={busy === pendingDisconnect?.id}
        onConfirm={disconnect}
        onClose={() => setPendingDisconnect(null)}
      />

      {showTelegramDialog && (
        <TelegramConnectDialog
          loading={busy === "telegram"}
          onConnect={connectTelegram}
          onClose={() => setShowTelegramDialog(false)}
        />
      )}
    </div>
  );
}

function TelegramConnectDialog({
  loading,
  onConnect,
  onClose,
}: {
  loading: boolean;
  onConnect: (botToken: string, channel: string) => void;
  onClose: () => void;
}) {
  const botRef = useRef<HTMLInputElement>(null);
  const chanRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const bot = botRef.current?.value.trim() ?? "";
    const chan = chanRef.current?.value.trim() ?? "";
    if (!bot || !chan) return;
    onConnect(bot, chan);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Connect Telegram Channel</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mb-5 space-y-1 text-sm text-muted-foreground list-decimal list-inside">
          <li>Open Telegram, search <strong>@BotFather</strong>, send <code>/newbot</code></li>
          <li>Copy the bot token BotFather gives you</li>
          <li>Add the bot as an <strong>Admin</strong> of your channel</li>
          <li>Enter the bot token and channel username below</li>
        </ol>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Bot Token</label>
            <input
              ref={botRef}
              type="password"
              placeholder="123456:ABCdefGHI..."
              autoComplete="off"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Channel Username</label>
            <input
              ref={chanRef}
              type="text"
              placeholder="@mychannel"
              autoComplete="off"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">Include the @ prefix</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Connect
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
