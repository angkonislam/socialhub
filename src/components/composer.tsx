"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ImagePlus,
  Video,
  Smile,
  Send,
  Save,
  CalendarClock,
  Loader2,
  X,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "@/components/platform-icon";
import { cn, extractHashtags, PLATFORM_LIMITS } from "@/lib/utils";
import type {
  ConnectedAccount,
  Platform,
  PostTemplate,
  PublishResult,
} from "@/lib/types";

const EMOJIS = ["😀", "😂", "🔥", "🎉", "✨", "👍", "❤️", "☕", "📣", "🚀", "💡", "📷"];

// Upload size caps (bytes).
const MAX_IMAGE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB

type MediaItem = {
  /** Local object URL for instant preview. */
  previewUrl: string;
  /** Stored URL returned by the upload endpoint (used when publishing). */
  url: string;
  type: "image" | "video";
  name: string;
  uploading: boolean;
};

export function Composer({
  accounts,
  templates = [],
}: {
  accounts: ConnectedAccount[];
  templates?: PostTemplate[];
}) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState<null | "publish" | "schedule" | "draft">(null);
  const [results, setResults] = useState<PublishResult[] | null>(null);
  const [previewPlatform, setPreviewPlatform] = useState<Platform | null>(null);

  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const hashtags = useMemo(() => extractHashtags(content), [content]);

  // Minimum schedule time = now (local), formatted for datetime-local input.
  const nowLocal = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  const selectedAccounts = accounts.filter((a) => selected.includes(a.id));

  const limit = useMemo(() => {
    const platforms = selectedAccounts.map((a) => a.platform);
    if (platforms.length === 0) return 2200;
    return Math.min(...platforms.map((p) => PLATFORM_LIMITS[p] ?? 2200));
  }, [selectedAccounts]);

  const overLimit = content.length > limit;

  function toggleTarget(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function onFiles(files: FileList | null, type: "image" | "video") {
    if (!files) return;
    const cap = type === "image" ? MAX_IMAGE : MAX_VIDEO;
    for (const f of Array.from(files)) {
      if (f.size > cap) {
        toast.error(
          `${f.name} is too large (max ${type === "image" ? "10MB" : "100MB"})`
        );
        continue;
      }
      const previewUrl = URL.createObjectURL(f);
      // Optimistically add with the preview URL; replace once uploaded.
      setMedia((prev) => [
        ...prev,
        { previewUrl, url: previewUrl, type, name: f.name, uploading: true },
      ]);
      void uploadFile(f, previewUrl);
    }
  }

  async function uploadFile(file: File, previewUrl: string) {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setMedia((prev) =>
        prev.map((m) =>
          m.previewUrl === previewUrl ? { ...m, url, uploading: false } : m
        )
      );
    } catch {
      toast.error("Upload failed");
      setMedia((prev) => prev.filter((m) => m.previewUrl !== previewUrl));
    }
  }

  function removeMedia(previewUrl: string) {
    setMedia((prev) => prev.filter((m) => m.previewUrl !== previewUrl));
  }

  function reset() {
    setContent("");
    setMedia([]);
    setSelected([]);
    setScheduleAt("");
  }

  async function publish() {
    if (selected.length === 0) {
      toast.error("Select at least one account.");
      return;
    }
    setBusy("publish");
    setResults(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          media_urls: media.map((m) => m.url),
          account_ids: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      const r: PublishResult[] = data.results;
      setResults(r);
      const ok = r.filter((x) => x.ok).length;
      if (ok === r.length) toast.success(`Published to all ${r.length} platform(s)`);
      else if (ok > 0) toast.warning(`Published to ${ok}/${r.length} platform(s)`);
      else toast.error("Publish failed on all platforms");
      if (ok > 0) {
        setContent("");
        setMedia([]);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function save(status: "draft" | "scheduled") {
    if (status === "scheduled" && !scheduleAt) {
      toast.error("Pick a date and time to schedule.");
      return;
    }
    if (status === "scheduled" && new Date(scheduleAt) <= new Date()) {
      toast.error("Schedule time must be in the future.");
      return;
    }
    setBusy(status === "scheduled" ? "schedule" : "draft");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          media_urls: media.map((m) => m.url),
          status,
          scheduled_at:
            status === "scheduled" ? new Date(scheduleAt).toISOString() : null,
          targets: selectedAccounts.map((a) => ({
            platform: a.platform,
            account_id: a.id,
          })),
        }),
      });
      if (!res.ok) throw new Error("Could not save post");
      toast.success(status === "scheduled" ? "Post scheduled" : "Draft saved");
      reset();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Editor */}
      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-5">
          {/* Template dropdown */}
          {templates.length > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <select
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value);
                  if (t) setContent(t.content);
                  e.target.value = "";
                }}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Insert a template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to share?"
            rows={8}
            className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {/* Media previews */}
          {media.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {media.map((m) => (
                <div key={m.previewUrl} className="relative">
                  {m.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.previewUrl}
                      alt={m.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  ) : (
                    <video
                      src={m.previewUrl}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  )}
                  {m.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removeMedia(m.previewUrl)}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    aria-label="Remove media"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files, "image")}
            />
            <input
              ref={videoInput}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => onFiles(e.target.files, "video")}
            />
            <Button variant="outline" size="sm" onClick={() => imageInput.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => videoInput.current?.click()}>
              <Video className="h-4 w-4" /> Video
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowEmoji((s) => !s)}>
                <Smile className="h-4 w-4" /> Emoji
              </Button>
              {showEmoji && (
                <div className="absolute z-10 mt-2 grid w-56 grid-cols-6 gap-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setContent((c) => c + e);
                        setShowEmoji(false);
                      }}
                      className="rounded p-1 text-lg hover:bg-accent"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span
              className={cn(
                "ml-auto text-sm tabular-nums",
                overLimit ? "font-semibold text-destructive" : "text-muted-foreground"
              )}
            >
              {content.length} / {limit}
            </span>
          </div>

          {/* Detected hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                >
                  #{h}
                </span>
              ))}
            </div>
          )}

          {/* Publish results (per-platform) */}
          {results && (
            <div className="space-y-1.5 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Publish results
              </p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <PlatformIcon platform={r.platform} brandColor className="h-4 w-4" />
                  <span className="capitalize">{r.platform}</span>
                  {r.ok ? (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
                  ) : (
                    <span className="ml-auto flex items-center gap-1 text-destructive">
                      <span className="text-xs">{r.error ?? "Failed"}</span>
                      <XCircle className="h-4 w-4" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side panel */}
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-5">
            <h3 className="text-sm font-semibold">Publish to</h3>
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No connected accounts.{" "}
                <a href="/accounts" className="text-primary underline">
                  Connect one
                </a>
                .
              </p>
            )}
            {accounts.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors",
                  selected.includes(a.id)
                    ? "border-primary bg-accent"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <input
                  type="checkbox"
                  className="accent-[hsl(var(--primary))]"
                  checked={selected.includes(a.id)}
                  onChange={() => toggleTarget(a.id)}
                />
                <PlatformIcon platform={a.platform} brandColor className="h-5 w-5" />
                <span className="truncate text-sm">{a.display_name}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Platform preview */}
        {selectedAccounts.length > 0 && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Preview</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(selectedAccounts.map((a) => a.platform))).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPreviewPlatform(p)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs capitalize",
                        previewPlatform === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                      {p}
                    </button>
                  )
                )}
              </div>

              {previewPlatform && (
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-accent" />
                    <div>
                      <p className="text-xs font-semibold">Your Account</p>
                      <p className="text-[10px] capitalize text-muted-foreground">
                        {previewPlatform}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs">
                    {content || "Your post text will appear here…"}
                  </p>
                  {media[0] && (
                    <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-muted">
                      {media[0].type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media[0].previewUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={media[0].previewUrl}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Limit on {previewPlatform}: {PLATFORM_LIMITS[previewPlatform]} chars
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-3 pt-5">
            <label className="block text-sm font-semibold">Schedule for later</label>
            <input
              type="datetime-local"
              value={scheduleAt}
              min={nowLocal}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="grid gap-2 pt-1">
              <Button onClick={publish} disabled={!content || overLimit || busy !== null}>
                {busy === "publish" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publish now
              </Button>
              <Button
                variant="outline"
                onClick={() => save("scheduled")}
                disabled={!content || overLimit || busy !== null}
              >
                {busy === "schedule" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Schedule
              </Button>
              <Button
                variant="ghost"
                onClick={() => save("draft")}
                disabled={!content || busy !== null}
              >
                {busy === "draft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
