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

interface TikTokUser {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const ttError = searchParams.get("error");

  if (ttError) return back({ error: "tt_denied" });
  if (!code || !state) return back({ error: "tt_missing_code" });

  const jar = await cookies();
  const saved = jar.get("tt_oauth_state")?.value;
  jar.delete("tt_oauth_state");
  jar.delete("tt_code_verifier");
  if (!saved || saved !== state) return back({ error: "tt_bad_state" });

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = `${appUrl()}/api/connect/tiktok/callback`;

  try {
    // 1. Exchange code → access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return back({ error: "tt_token_failed" });
    }
    const accessToken: string = tokenJson.access_token;
    const openId: string = tokenJson.open_id;

    // 2. Get user info
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );
    const userJson = await userRes.json();
    const user: TikTokUser = userJson.data?.user ?? {};

    const profileId = user.open_id ?? openId;
    if (!profileId) return back({ error: "tt_profile_failed" });

    // 3. Save account
    const { id: userId } = await getSessionUser();
    const existing = await listAccounts(userId);
    const existingIds = new Set(
      existing.filter((a) => a.platform === "tiktok").map((a) => a.external_id)
    );

    if (existingIds.has(profileId)) {
      return back({ connected: "tiktok", count: "0" });
    }

    await addAccount({
      user_id: userId,
      platform: "tiktok",
      account_type: "tiktok_account",
      external_id: profileId,
      display_name: user.display_name ?? "TikTok Account",
      avatar_url: user.avatar_url ?? null,
      access_token: accessToken,
    });

    return back({ connected: "tiktok", count: "1" });
  } catch (err) {
    console.error("[TikTok callback error]", err);
    return back({ error: "tt_unexpected" });
  }
}
