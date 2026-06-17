import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { createTemplate, deleteTemplate, listTemplates } from "@/lib/data";

/** Saved-caption templates: list / create / delete. */

const createSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
});

export async function GET() {
  const { id } = await getSessionUser();
  return NextResponse.json({ templates: await listTemplates(id) });
}

export async function POST(req: Request) {
  const { id } = await getSessionUser();
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }
  const tpl = await createTemplate(id, parsed.data.name, parsed.data.content);
  return NextResponse.json({ template: tpl }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await getSessionUser();
  const tid = new URL(req.url).searchParams.get("id");
  if (!tid) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ok = await deleteTemplate(id, tid);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
