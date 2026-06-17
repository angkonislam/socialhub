import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { deletePost, getPost, updatePost } from "@/lib/data";
import { extractHashtags } from "@/lib/utils";

/**
 * Single-post API.
 *  GET    → fetch one post
 *  PATCH  → edit content / media / schedule / status
 *  DELETE → remove a post
 */

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  media_urls: z.array(z.string()).optional(),
  status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
});

async function userId() {
  return (await getSessionUser()).id;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await getPost(await userId(), id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const patch = { ...parsed.data };
  // Keep hashtags in sync when content changes.
  const updated = await updatePost(await userId(), id, {
    ...patch,
    ...(patch.content ? { hashtags: extractHashtags(patch.content) } : {}),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deletePost(await userId(), id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
