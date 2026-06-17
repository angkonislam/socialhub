import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import {
  createPost,
  fireWebhooks,
  listAccounts,
  logActivity,
  updatePost,
} from "@/lib/data";
import { mockPublish } from "@/lib/mock/platforms";
import { rateLimit } from "@/lib/rate-limit";
import { extractHashtags } from "@/lib/utils";
import type { PublishResult } from "@/lib/types";

/**
 * Publish API — create a post and push it to every selected platform in
 * one call. Returns a per-target result list so the UI can show partial
 * success. Uses the mock platform layer; swap `mockPublish` for real SDK
 * calls when credentials are configured.
 */

const publishSchema = z.object({
  content: z.string().min(1, "Content is required"),
  media_urls: z.array(z.string()).default([]),
  account_ids: z.array(z.string()).min(1, "Select at least one account"),
});

export async function POST(req: Request) {
  const { id: userId } = await getSessionUser();

  // Rate limit: max 10 publish calls per minute per user.
  const rl = rateLimit(`publish:${userId}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const parsed = publishSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { content, media_urls, account_ids } = parsed.data;

  const accounts = (await listAccounts(userId)).filter((a) =>
    account_ids.includes(a.id)
  );
  if (accounts.length === 0) {
    return NextResponse.json({ error: "No matching accounts" }, { status: 400 });
  }

  // Record the post in a "publishing" state first.
  const post = await createPost({
    user_id: userId,
    content,
    media_urls,
    hashtags: extractHashtags(content),
    status: "publishing",
    scheduled_at: null,
    published_at: null,
    targets: accounts.map((a) => ({ platform: a.platform, account_id: a.id })),
  });

  // Fan out to all targets in parallel.
  const results: PublishResult[] = await Promise.all(
    accounts.map((a) => mockPublish({ id: a.id, platform: a.platform }, content))
  );

  const allOk = results.every((r) => r.ok);
  const anyOk = results.some((r) => r.ok);

  await updatePost(userId, post.id, {
    status: allOk ? "published" : anyOk ? "published" : "failed",
    published_at: anyOk ? new Date().toISOString() : null,
  });

  await logActivity(
    userId,
    allOk ? "post.published" : "post.published_partial",
    `Published to ${results.filter((r) => r.ok).length}/${results.length} platforms`
  );

  // Notify any subscribed webhooks (best-effort, non-blocking failures).
  if (anyOk) {
    await fireWebhooks(userId, "post.published", {
      post_id: post.id,
      content,
      results,
    });
  }

  return NextResponse.json({ post_id: post.id, results });
}
