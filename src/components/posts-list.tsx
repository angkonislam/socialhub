"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Pencil,
  Trash2,
  CalendarClock,
  Loader2,
  Eye,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlatformIcon } from "@/components/platform-icon";
import type { Post, PostStatus } from "@/lib/types";

const TABS: { key: "all" | PostStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" },
  { key: "failed", label: "Failed" },
];

const PAGE_SIZE = 6;

export function PostsList({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [tab, setTab] = useState<"all" | PostStatus>("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<Post | null>(null);
  const [editText, setEditText] = useState("");
  const [detail, setDetail] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (query && !p.content.toLowerCase().includes(query.toLowerCase()))
        return false;
      const ref = (p.scheduled_at ?? p.published_at ?? p.created_at).slice(0, 10);
      if (from && ref < from) return false;
      if (to && ref > to) return false;
      return true;
    });
  }, [posts, tab, query, from, to]);

  const shown = filtered.slice(0, visible);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (!res.ok) throw new Error();
      const { post } = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      toast.success("Post updated");
      setEditing(null);
    } catch {
      toast.error("Could not update post");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Post deleted");
      setDeleting(null);
    } catch {
      toast.error("Could not delete post");
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete() {
    setBusy(true);
    try {
      const ids = Array.from(selected);
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids }),
      });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => !selected.has(p.id)));
      toast.success(`Deleted ${ids.length} post(s)`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
    } catch {
      toast.error("Bulk delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + date range */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-auto"
            aria-label="From date"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-auto"
            aria-label="To date"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count =
            t.key === "all"
              ? posts.length
              : posts.filter((p) => p.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setVisible(PAGE_SIZE);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              )}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary bg-accent px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {shown.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No posts match this view.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[hsl(var(--primary))]"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    aria-label="Select post"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                        {p.content}
                      </p>
                      <StatusBadge status={p.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {p.targets.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {p.targets.map((t, i) => (
                            <PlatformIcon
                              key={i}
                              platform={t.platform}
                              brandColor
                              className="h-4 w-4"
                            />
                          ))}
                        </div>
                      )}
                      <span>
                        {p.status === "scheduled" && p.scheduled_at
                          ? `Scheduled ${formatDate(p.scheduled_at)}`
                          : p.status === "published" && p.published_at
                            ? `Published ${formatDate(p.published_at)}`
                            : `Created ${formatDate(p.created_at)}`}
                      </span>

                      <div className="ml-auto flex gap-1">
                        <button
                          onClick={() => setDetail(p)}
                          className="rounded p-1.5 hover:bg-accent"
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditing(p);
                            setEditText(p.content);
                          }}
                          className="rounded p-1.5 hover:bg-accent"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="rounded p-1.5 text-destructive hover:bg-accent"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {visible < filtered.length && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Load more ({filtered.length - visible} left)
          </Button>
        </div>
      )}

      {/* Edit modal */}
      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <h2 className="text-lg font-semibold">Edit post</h2>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={6}
          className="mt-4 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={saveEdit} disabled={busy || !editText.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
          </Button>
        </div>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-muted-foreground">
                {formatDate(detail.created_at)}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm">{detail.content}</p>

            {detail.media_urls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.media_urls.map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={u}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}

            {detail.hashtags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {detail.hashtags.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                  >
                    #{h}
                  </span>
                ))}
              </div>
            )}

            {detail.targets.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  Published to
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.targets.map((t, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs capitalize"
                    >
                      <PlatformIcon platform={t.platform} brandColor className="h-4 w-4" />
                      {t.platform}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete post?"
        message="This permanently removes the post. This cannot be undone."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.size} posts?`}
        message="All selected posts will be permanently removed."
        confirmLabel="Delete all"
        loading={busy}
        onConfirm={bulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
