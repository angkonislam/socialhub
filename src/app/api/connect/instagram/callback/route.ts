import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/demo-session";
import { addAccount, listAccounts } from "@/lib/data";
import { appUrl } from "@/lib/app-url";

const IG_GRAPH = "https://graph.instagram.com/v21.0";

function back(params: Record<string, string>) {
  const url = new URL(`${appUrl()}/accounts`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url.toString());
}

interface IgProfile {
  id?: string;
  name?: string;
  username?: string;
  account_type?: string;
  profile_picture_url?: string;
}

async function fetchProfile(token: string, userId: string): Promise<IgProfile> {
  const fields = "id,name,username,account_type,profile_picture_url";

  // Try explicit user-id endpoint first (more reliable than /me)
  const byId = await fetch(
    `${IG_GRAPH}/${userId}?fields=${fields}&access_token=${token}`,
    { cache: "no-store" }
  );
  const byIdJson: IgProfile = await byId.json();
  console.log("[IG profile by id]", JSON.stringify(byIdJson));
  if (byIdJson.id) return byIdJson;

  // Fallback to /me
  const me = await fetch(
    `${IG_GRAPH}/me?fields=${fields}&access_token=${token}`,
    { cache: "no-store" }
  );
  const meJson: IgProfile = await me.json();
  console.log("[IG profile /me]", JSON.stringify(meJson));
  return meJson;
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
    // 1. Exchange code → short-lived token
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
    console.log("[IG short token]", JSON.stringify({ ok: tokenRes.ok, user_id: tokenJson.user_id, has_token: !!tokenJson.access_token }));
    if (!tokenRes.ok || !tokenJson.access_token) {
      return back({ error: "ig_token_failed" });
    }
    const shortToken: string = tokenJson.access_token;
    const igUserId: string = String(tokenJson.user_id ?? "");

    // 2. Exchange for long-lived token
    const llRes = await fetch(
      `${IG_GRAPH.replace("/v21.0", "")}/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortToken}`,
      { cache: "no-store" }
    );
    const llJson = await llRes.json();
    console.log("[IG long token]", JSON.stringify({ ok: llRes.ok, has_token: !!llJson.access_token, error: llJson.error }));
    const finalToken: string = llJson.access_token ?? shortToken;

    // 3. Get profile — try user-id endpoint, fallback to /me
    const profile = await fetchProfile(finalToken, igUserId);

    const profileId = profile.id ?? igUserId;
    if (!profileId) return back({ error: "ig_profile_failed" });

    // 4. Deduplicate
    const { id: userId } = await getSessionUser();
    const existing = await listAccounts(userId);
    const existingIds = new Set(
      existing.filter((a) => a.platform === "instagram").map((a) => a.external_id)
    );
    if (existingIds.has(profileId)) {
      return back({ connected: "instagram", count: "0" });
    }

    // Best display name: full name > @username > Instagram #{short id}
    const displayName =
      profile.name?.trim() ||
      (profile.username ? `@${profile.username}` : null) ||
      `Instagram #${profileId.slice(-6)}`;

    await addAccount({
      user_id: userId,
      platform: "instagram",
      account_type: "instagram_business",
      external_id: profileId,
      display_name: displayName,
      avatar_url: profile.profile_picture_url ?? null,
      access_token: finalToken,
    });

    return back({ connected: "instagram", count: "1" });
  } catch (err) {
    console.error("[Instagram callback error]", err);
    return back({ error: "ig_unexpected" });
  }
}
