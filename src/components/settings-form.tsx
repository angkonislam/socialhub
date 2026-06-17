"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserSettings } from "@/lib/types";

const TIMEZONES = [
  "UTC",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Australia/Sydney",
];

/** Edit user preferences: timezone, theme, notifications. */
export function SettingsForm({ initial }: { initial: UserSettings }) {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setTheme(settings.theme);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Timezone */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Timezone</p>
            <p className="text-xs text-muted-foreground">
              Used when scheduling posts.
            </p>
          </div>
          <select
            value={settings.timezone}
            onChange={(e) => set("timezone", e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Light, dark, or system.</p>
          </div>
          <select
            value={settings.theme}
            onChange={(e) =>
              set("theme", e.target.value as UserSettings["theme"])
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Notifications */}
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive a summary by email.
            </p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[hsl(var(--primary))]"
            checked={settings.notify_email}
            onChange={(e) => set("notify_email", e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Publish alerts</p>
            <p className="text-xs text-muted-foreground">
              Notify me when a scheduled post publishes.
            </p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[hsl(var(--primary))]"
            checked={settings.notify_publish}
            onChange={(e) => set("notify_publish", e.target.checked)}
          />
        </label>

        <div className="flex justify-end">
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
