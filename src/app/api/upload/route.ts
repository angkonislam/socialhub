import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/demo-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Media upload endpoint.
 *
 * When Supabase is configured, the file is uploaded to the `media` Storage
 * bucket and a public URL is returned. Otherwise (mock mode) a placeholder
 * URL is returned so the composer flow still works end-to-end.
 *
 * Limits: 10MB images, 100MB videos (also enforced client-side).
 */

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;

export async function POST(req: Request) {
  const { id: userId } = await getSessionUser();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const cap = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > cap) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  // Mock mode: no real storage — echo back a placeholder URL.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      url: `https://picsum.photos/seed/${encodeURIComponent(file.name)}/600/400`,
      mock: true,
    });
  }

  // Real upload to Supabase Storage.
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
