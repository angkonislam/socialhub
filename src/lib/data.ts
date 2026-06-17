import "server-only";
import type {
  ActivityLog,
  Analytics,
  ConnectedAccount,
  DashboardStats,
  Platform,
  Post,
  PostStatus,
  PostTemplate,
  UserSettings,
  Webhook,
  WorkspaceMember,
  WorkspaceRole,
} from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/server";

const DEFAULT_SETTINGS = (userId: string): UserSettings => ({
  user_id: userId,
  timezone: "UTC",
  theme: "system",
  notify_email: true,
  notify_publish: true,
});

function sb() {
  return createServiceClient();
}

// ── Users ─────────────────────────────────────────────────────────

export async function upsertUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  await sb()
    .from("users")
    .upsert({ id: user.id, name: user.name, email: user.email, image: user.image }, { onConflict: "id" });
}

// ── Connected accounts ────────────────────────────────────────────

export async function listAccounts(userId: string): Promise<ConnectedAccount[]> {
  const { data } = await sb()
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });
  return (data ?? []) as ConnectedAccount[];
}

export async function addAccount(
  account: Omit<ConnectedAccount, "id" | "connected_at">
): Promise<ConnectedAccount> {
  const { data, error } = await sb()
    .from("connected_accounts")
    .insert(account)
    .select()
    .single();
  if (error) throw error;
  await logActivity(
    account.user_id,
    "account.connected",
    `Connected ${account.platform} "${account.display_name}"`
  );
  return data as ConnectedAccount;
}

export async function removeAccount(userId: string, accountId: string): Promise<boolean> {
  const { data: acct } = await sb()
    .from("connected_accounts")
    .select("platform, display_name")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();
  const { error } = await sb()
    .from("connected_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);
  if (!error && acct) {
    await logActivity(userId, "account.disconnected", `Disconnected ${acct.platform} "${acct.display_name}"`);
  }
  return !error;
}

// ── Posts ─────────────────────────────────────────────────────────

export async function listPosts(userId: string, status?: PostStatus): Promise<Post[]> {
  let q = sb().from("posts").select("*").eq("user_id", userId);
  if (status) q = q.eq("status", status);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []) as Post[];
}

export async function createPost(post: Omit<Post, "id" | "created_at" | "updated_at">): Promise<Post> {
  const { data, error } = await sb().from("posts").insert(post).select().single();
  if (error) throw error;
  return data as Post;
}

export async function getPost(userId: string, postId: string): Promise<Post | null> {
  const { data } = await sb()
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", userId)
    .single();
  return (data as Post) ?? null;
}

export async function updatePost(userId: string, postId: string, patch: Partial<Post>): Promise<Post | null> {
  const { data, error } = await sb()
    .from("posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return data as Post;
}

export async function deletePost(userId: string, postId: string): Promise<boolean> {
  const { error } = await sb()
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId);
  if (!error) await logActivity(userId, "post.deleted", "Deleted a post");
  return !error;
}

export async function deletePosts(userId: string, postIds: string[]): Promise<number> {
  const { data } = await sb()
    .from("posts")
    .delete()
    .in("id", postIds)
    .eq("user_id", userId)
    .select("id");
  return data?.length ?? 0;
}

// ── Activity log ──────────────────────────────────────────────────

export async function listActivity(userId: string, limit = 10): Promise<ActivityLog[]> {
  const { data } = await sb()
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityLog[];
}

export async function logActivity(userId: string, action: string, detail: string): Promise<void> {
  await sb().from("activity_logs").insert({ user_id: userId, action, detail });
}

// ── Aggregates ────────────────────────────────────────────────────

export async function getStats(userId: string): Promise<DashboardStats> {
  const [accounts, posts] = await Promise.all([listAccounts(userId), listPosts(userId)]);
  return {
    connectedAccounts: accounts.length,
    publishedPosts: posts.filter((p) => p.status === "published").length,
    scheduledPosts: posts.filter((p) => p.status === "scheduled").length,
    draftPosts: posts.filter((p) => p.status === "draft").length,
  };
}

// ── Templates ─────────────────────────────────────────────────────

export async function listTemplates(userId: string): Promise<PostTemplate[]> {
  const { data } = await sb()
    .from("post_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PostTemplate[];
}

export async function createTemplate(userId: string, name: string, content: string): Promise<PostTemplate> {
  const { data, error } = await sb()
    .from("post_templates")
    .insert({ user_id: userId, name, content })
    .select()
    .single();
  if (error) throw error;
  return data as PostTemplate;
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  const { error } = await sb()
    .from("post_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ── Webhooks ──────────────────────────────────────────────────────

export async function listWebhooks(userId: string): Promise<Webhook[]> {
  const { data } = await sb()
    .from("webhooks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Webhook[];
}

export async function createWebhook(userId: string, url: string, events: string[]): Promise<Webhook> {
  const { data, error } = await sb()
    .from("webhooks")
    .insert({ user_id: userId, url, events, active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Webhook;
}

export async function deleteWebhook(userId: string, id: string): Promise<boolean> {
  const { error } = await sb()
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

export async function fireWebhooks(userId: string, event: string, payload: Record<string, unknown>): Promise<void> {
  const hooks = (await listWebhooks(userId)).filter((w) => w.active && w.events.includes(event));
  await Promise.allSettled(
    hooks.map((w) =>
      fetch(w.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload, at: new Date().toISOString() }),
      })
    )
  );
}

// ── Settings ──────────────────────────────────────────────────────

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data } = await sb()
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as UserSettings) ?? DEFAULT_SETTINGS(userId);
}

export async function updateSettings(userId: string, patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings(userId);
  const merged = { ...current, ...patch, user_id: userId };
  await sb().from("user_settings").upsert(merged, { onConflict: "user_id" });
  return merged;
}

// ── Workspace / team members ──────────────────────────────────────

export async function listMembers(userId: string): Promise<WorkspaceMember[]> {
  const { data } = await sb()
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []) as WorkspaceMember[];
}

export async function addMember(userId: string, email: string, name: string, role: WorkspaceRole): Promise<WorkspaceMember> {
  const { data, error } = await sb()
    .from("workspace_members")
    .insert({ workspace_id: userId, user_id: userId, email, name, role })
    .select()
    .single();
  if (error) throw error;
  await logActivity(userId, "member.invited", `Invited ${email} as ${role}`);
  return data as WorkspaceMember;
}

export async function updateMemberRole(memberId: string, role: WorkspaceRole): Promise<boolean> {
  const { error } = await sb()
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId);
  return !error;
}

export async function removeMember(memberId: string): Promise<boolean> {
  const { data: m } = await sb()
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .single();
  if (m?.role === "owner") return false;
  const { error } = await sb().from("workspace_members").delete().eq("id", memberId);
  return !error;
}

// ── Analytics ─────────────────────────────────────────────────────

export async function getAnalytics(userId: string, days = 14): Promise<Analytics> {
  const posts = await listPosts(userId);
  const published = posts.filter((p) => p.published_at);

  const perDay: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    perDay.push({
      date: key,
      count: published.filter((p) => p.published_at?.slice(0, 10) === key).length,
    });
  }

  const platformCount = new Map<Platform, number>();
  for (const p of published) {
    for (const t of p.targets) {
      platformCount.set(t.platform, (platformCount.get(t.platform) ?? 0) + 1);
    }
  }
  const perPlatform = Array.from(platformCount.entries()).map(([platform, count]) => ({ platform, count }));

  const tagCount = new Map<string, number>();
  for (const p of posts) {
    for (const tag of p.hashtags) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }
  const topHashtags = Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalPublished = posts.filter((p) => p.status === "published").length;
  const totalFailed = posts.filter((p) => p.status === "failed").length;
  const denom = totalPublished + totalFailed;

  return {
    perDay,
    perPlatform,
    topHashtags,
    successRate: denom === 0 ? 100 : Math.round((totalPublished / denom) * 100),
    totalPublished,
    totalFailed,
  };
}
