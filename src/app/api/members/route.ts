import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/demo-session";
import {
  addMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "@/lib/data";

/** Workspace team members: list / invite / update role / remove. */

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["owner", "editor", "viewer"]),
});

const roleSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "editor", "viewer"]),
});

export async function GET() {
  const { id } = await getSessionUser();
  return NextResponse.json({ members: await listMembers(id) });
}

export async function POST(req: Request) {
  const { id } = await getSessionUser();
  const parsed = inviteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }
  const member = await addMember(
    id,
    parsed.data.email,
    parsed.data.name,
    parsed.data.role
  );
  return NextResponse.json({ member }, { status: 201 });
}

export async function PATCH(req: Request) {
  const parsed = roleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role change" }, { status: 400 });
  }
  const ok = await updateMemberRole(parsed.data.id, parsed.data.role);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const mid = new URL(req.url).searchParams.get("id");
  if (!mid) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ok = await removeMember(mid);
  if (!ok) {
    return NextResponse.json(
      { error: "Cannot remove (owner or not found)" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
