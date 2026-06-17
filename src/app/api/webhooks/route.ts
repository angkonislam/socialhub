import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { createWebhook, deleteWebhook, listWebhooks } from "@/lib/data";

/** Outbound webhooks: list / create / delete. */

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1).default(["post.published"]),
});

export async function GET() {
  const { id } = await getSessionUser();
  return NextResponse.json({ webhooks: await listWebhooks(id) });
}

export async function POST(req: Request) {
  const { id } = await getSessionUser();
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
  }
  const wh = await createWebhook(id, parsed.data.url, parsed.data.events);
  return NextResponse.json({ webhook: wh }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await getSessionUser();
  const wid = new URL(req.url).searchParams.get("id");
  if (!wid) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ok = await deleteWebhook(id, wid);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
