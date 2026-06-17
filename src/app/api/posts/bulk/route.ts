import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { deletePosts, updatePost } from "@/lib/data";

/**
 * Bulk post operations.
 *  POST { action: "delete", ids }              → delete many
 *  POST { action: "reschedule", ids, when }    → reschedule many
 */

const schema = z.object({
  action: z.enum(["delete", "reschedule"]),
  ids: z.array(z.string()).min(1),
  when: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const { id: userId } = await getSessionUser();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { action, ids, when } = parsed.data;

  if (action === "delete") {
    const removed = await deletePosts(userId, ids);
    return NextResponse.json({ ok: true, removed });
  }

  // reschedule
  if (!when) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }
  let updated = 0;
  for (const id of ids) {
    const r = await updatePost(userId, id, {
      status: "scheduled",
      scheduled_at: when,
    });
    if (r) updated++;
  }
  return NextResponse.json({ ok: true, updated });
}
