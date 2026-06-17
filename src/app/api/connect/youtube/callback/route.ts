import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/demo-session";
import { addAccount, listAccounts } from "@/lib/data";
import { appUrl } from "@/lib/app-url";

function back(params: Record<string, string>) {
  const url = new URL(`${appUrl()}/accounts`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url.toString());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return back({ error: "yt_denied" });
  if (!code || !state) return back({ error: "yt_missing_code" });

  const jar = await cookies();
  const saved = jar.get("yt_oauth_state")?.value;
  jar.delete("yt_oauth_state");
  if (!saved || saved !== state) return back({ error: "yt_bad_state" });

  const clientId = process.env.AUTH_GOOGLE_ID!;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET!;
  const redirectUri = `${appUrl()}/api/connect/youtube/callback`;

  try {
    // Exchange code → access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return back({ error: "yt_token_failed" });
    }
    const accessToken: string = tokenJson.access_token;

    // Get YouTube channel info
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );
    const channelJson = await channelRes.json();
    const channels = channelJson.items ?? [];

    const { id: userId } = await getSessionUser();
    const existing = await listAccounts(userId);
    const existingIds = new Set(
      existing.filter((a) => a.platform === "youtube").map((a) => a.external_id)
    );

    let added = 0;
    for (const ch of channels) {
      const channelId: string = ch.id;
      if (existingIds.has(channelId)) continue;
      await addAccount({
        user_id: userId,
        platform: "youtube",
        account_type: "youtube_channel",
        external_id: channelId,
        display_name: ch.snippet?.title ?? "YouTube Channel",
        avatar_url: ch.snippet?.thumbnails?.default?.url ?? null,
        access_token: accessToken,
      });
      added++;
    }

    return back({ connected: "youtube", count: String(added) });
  } catch {
    return back({ error: "yt_unexpected" });
  }
}
