import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { getSettings, updateSettings } from "@/lib/data";

/** Per-user settings: get / update. */

const patchSchema = z.object({
  timezone: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notify_email: z.boolean().optional(),
  notify_publish: z.boolean().optional(),
});

export async function GET() {
  const { id } = await getSessionUser();
  return NextResponse.json({ settings: await getSettings(id) });
}

export async function PUT(req: Request) {
  const { id } = await getSessionUser();
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }
  const settings = await updateSettings(id, parsed.data);
  return NextResponse.json({ settings });
}
