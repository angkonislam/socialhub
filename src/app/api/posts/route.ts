import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { createPost, listPosts, logActivity } from "@/lib/data";
import { extractHashtags } from "@/lib/utils";
import type { PostStatus } from "@/lib/types";

/**
 * Posts API.
 *  GET  → list posts, optionally filtered by ?status=
 *  POST → create a post as a draft or scheduled item
 *         (immediate publishing goes through /api/publish)
 */

const targetSchema = z.object({
  platform: z.enum([
    "facebook",
    "instagram",
    "youtube",
    "tiktok",
    "telegram",
    "linkedin",
  ]),
  account_id: z.string(),
});

const createSchema = z.object({
  content: z.string().min(1, "Content is required"),
  media_urls: z.array(z.string()).default([]),
  targets: z.array(targetSchema).default([]),
  status: z.enum(["draft", "scheduled"]).default("draft"),
  scheduled_at: z.string().datetime().nullable().optional(),
});

async function requireUser() {
  const user = await getSessionUser();
  return user.id;
}

export async function GET(req: Request) {
  const userId = await requireUser();

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") as PostStatus | null) ?? undefined;
  const posts = await listPosts(userId, status);
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const userId = await requireUser();

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const post = await createPost({
    user_id: userId,
    content: data.content,
    media_urls: data.media_urls,
    hashtags: extractHashtags(data.content),
    status: data.status,
    scheduled_at: data.status === "scheduled" ? data.scheduled_at ?? null : null,
    published_at: null,
    targets: data.targets,
  });

  await logActivity(
    userId,
    data.status === "scheduled" ? "post.scheduled" : "post.drafted",
    data.status === "scheduled"
      ? `Scheduled a post for ${data.scheduled_at}`
      : "Saved a draft"
  );

  return NextResponse.json({ post }, { status: 201 });
}
