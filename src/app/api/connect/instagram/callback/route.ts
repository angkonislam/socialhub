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

interface IgProfile {
  id: string;
  name?: string;
  username?: string;
  profile_picture_url?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const igError = searchParams.get("error");

  if (igError) return back({ error: "ig_denied" });
  if (!code || !state) return back({ error: "ig_missing_code" });

  const jar = await cookies();
  const saved = jar.get("ig_oauth_state")?.value;
  jar.delete("ig_oauth_state");
  if (!saved || saved !== state) return back({ error: "ig_bad_state" });

  const clientId = process.env.INSTAGRAM_APP_ID!;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${appUrl()}/api/connect/instagram/callback`;

  try {
    // 1. Exchange code → short-lived access token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
      cache: "no-store",
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return back({ error: "ig_token_failed" });
    }
    const accessToken: string = tokenJson.access_token;
    const igUserId: string = tokenJson.user_id;

    // 2. Exchange for long-lived token
    const longLivedUrl = new URL("https://graph.instagram.com/access_token");
    longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
    longLivedUrl.searchParams.set("client_secret", clientSecret);
    longLivedUrl.searchParams.set("access_token", accessToken);
    const llRes = await fetch(longLivedUrl.toString(), { cache: "no-store" });
    const llJson = await llRes.json();
    const finalToken: string = llJson.access_token ?? accessToken;

    // 3. Get Instagram profile (use /me with Business Login token)
    const profileUrl = new URL("https://graph.instagram.com/me");
    profileUrl.searchParams.set("fields", "id,name,username,profile_picture_url");
    profileUrl.searchParams.set("access_token", finalToken);
    const profileRes = await fetch(profileUrl.toString(), { cache: "no-store" });
    const profile: IgProfile = await profileRes.json();

    // Fallback: use igUserId if profile.id missing
    const profileId = profile.id ?? igUserId;
    if (!profileId) return back({ error: "ig_profile_failed" });

    // 4. Save account
    const { id: userId } = await getSessionUser();
    const existing = await listAccounts(userId);
    const existingIds = new Set(
      existing.filter((a) => a.platform === "instagram").map((a) => a.external_id)
    );

    if (existingIds.has(profileId)) {
      return back({ connected: "instagram", count: "0" });
    }

    await addAccount({
      user_id: userId,
      platform: "instagram",
      account_type: "instagram_business",
      external_id: profileId,
      display_name: profile.name ?? profile.username ?? "Instagram Account",
      avatar_url: profile.profile_picture_url ?? null,
      access_token: finalToken,
    });

    return back({ connected: "instagram", count: "1" });
  } catch (err) {
    console.error("[Instagram callback error]", err);
    return back({ error: "ig_unexpected" });
  }
}
