"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Webhook as WebhookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Webhook } from "@/lib/types";

/** Manage outbound webhooks fired on post events. */
export function WebhooksManager({ initial }: { initial: Webhook[] }) {
  const [hooks, setHooks] = useState(initial);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: ["post.published"] }),
      });
      if (!res.ok) throw new Error();
      const { webhook } = await res.json();
      setHooks((prev) => [webhook, ...prev]);
      setUrl("");
      toast.success("Webhook added");
    } catch {
      toast.error("Invalid webhook URL");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setHooks((prev) => prev.filter((w) => w.id !== id));
      toast.success("Webhook removed");
    } else {
      toast.error("Could not remove");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WebhookIcon className="h-4 w-4" /> Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          POST a JSON payload to these URLs when a post is published (Zapier,
          Make, your own endpoint).
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="https://hooks.example.com/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={add} disabled={busy || !url}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>

        {hooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No webhooks configured.</p>
        ) : (
          <div className="space-y-2">
            {hooks.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{w.url}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.events.join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => remove(w.id)}
                  className="rounded p-1.5 text-destructive hover:bg-accent"
                  aria-label="Remove webhook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
