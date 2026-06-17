import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import { addAccount, listAccounts, removeAccount } from "@/lib/data";
import { mockConnect } from "@/lib/mock/platforms";
import type { Platform } from "@/lib/types";

/**
 * Connected-accounts API.
 *  GET    → list the signed-in user's connected accounts
 *  POST   → connect a new account for a platform (mock OAuth handshake)
 *  DELETE → disconnect an account by id
 */

const connectSchema = z.object({
  platform: z.enum([
    "facebook",
    "instagram",
    "youtube",
    "tiktok",
    "telegram",
    "linkedin",
  ]),
});

async function requireUser() {
  const user = await getSessionUser();
  return user.id;
}

export async function GET() {
  const userId = await requireUser();
  const accounts = await listAccounts(userId);
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const userId = await requireUser();

  const parsed = connectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  // In real mode, redirect through the platform's OAuth flow instead.
  const draft = await mockConnect(userId, parsed.data.platform as Platform);
  const account = await addAccount(draft);
  return NextResponse.json({ account }, { status: 201 });
}

export async function DELETE(req: Request) {
  const userId = await requireUser();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ok = await removeAccount(userId, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
