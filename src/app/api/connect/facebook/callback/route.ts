import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/demo-session";
import { addAccount, listAccounts } from "@/lib/data";
import { appUrl } from "@/lib/app-url";

const GRAPH_VERSION = "v21.0";

function back(params: Record<string, string>) {
  const url = new URL(`${appUrl()}/accounts`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url.toString());
}

interface FbPage {
  id: string;
  name: string;
  access_token: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string };
}

interface IgProfile {
  id: string;
  name?: string;
  username?: string;
  profile_picture_url?: string;
}

async function gql<T>(url: URL): Promise<T> {
  const res = await fetch(url.toString(), { cache: "no-store" });
  return res.json() as Promise<T>;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const fbError = searchParams.get("error");

  if (fbError) return back({ error: "fb_denied" });
  if (!code || !state) return back({ error: "fb_missing_code" });

  const jar = await cookies();
  const saved = jar.get("fb_oauth_state")?.value;
  jar.delete("fb_oauth_state");
  if (!saved || saved !== state) return back({ error: "fb_bad_state" });

  const clientId = process.env.AUTH_FACEBOOK_ID!;
  const clientSecret = process.env.AUTH_FACEBOOK_SECRET!;
  const redirectUri = `${appUrl()}/api/connect/facebook/callback`;

  try {
    // 1. Exchange code → user access token
    const tokenUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
    );
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenJson = await gql<{ access_token?: string }>(tokenUrl);
    if (!tokenJson.access_token) return back({ error: "fb_token_failed" });
    const userToken = tokenJson.access_token;

    // 2. Get all Business Portfolios
    const bizUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/businesses`
    );
    bizUrl.searchParams.set("access_token", userToken);
    const bizJson = await gql<{ data?: Array<{ id: string }> }>(bizUrl);
    const businesses = bizJson.data ?? [];

    // 3. Collect pages from all sources
    const pages: FbPage[] = [];

    for (const biz of businesses) {
      const ownedUrl = new URL(
        `https://graph.facebook.com/${GRAPH_VERSION}/${biz.id}/owned_pages`
      );
      ownedUrl.searchParams.set(
        "fields",
        "id,name,access_token,picture,instagram_business_account"
      );
      ownedUrl.searchParams.set("access_token", userToken);
      const ownedJson = await gql<{ data?: FbPage[] }>(ownedUrl);
      for (const p of ownedJson.data ?? []) {
        if (!pages.find((x) => x.id === p.id)) pages.push(p);
      }
    }

    // Also check /me/accounts for personal pages
    const myUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`
    );
    myUrl.searchParams.set(
      "fields",
      "id,name,access_token,picture,instagram_business_account"
    );
    myUrl.searchParams.set("access_token", userToken);
    const myJson = await gql<{ data?: FbPage[] }>(myUrl);
    for (const p of myJson.data ?? []) {
      if (!pages.find((x) => x.id === p.id)) pages.push(p);
    }

    const { id: userId } = await getSessionUser();
    const existing = await listAccounts(userId);
    const existingFbIds = new Set(
      existing.filter((a) => a.platform === "facebook").map((a) => a.external_id)
    );
    const existingIgIds = new Set(
      existing.filter((a) => a.platform === "instagram").map((a) => a.external_id)
    );

    let fbAdded = 0;
    let igAdded = 0;

    if (pages.length === 0) {
      // Fallback: personal profile
      const meUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me`);
      meUrl.searchParams.set("fields", "id,name,picture");
      meUrl.searchParams.set("access_token", userToken);
      const me = await gql<{
        id?: string;
        name?: string;
        picture?: { data?: { url?: string } };
      }>(meUrl);
      const meId = me.id ?? "unknown";
      if (!existingFbIds.has(meId)) {
        await addAccount({
          user_id: userId,
          platform: "facebook",
          account_type: "facebook_page",
          external_id: meId,
          display_name: me.name ?? "Facebook Account",
          avatar_url: me.picture?.data?.url ?? null,
          access_token: userToken,
        });
        fbAdded++;
      }
    } else {
      // Save Facebook Pages
      for (const page of pages) {
        if (!existingFbIds.has(page.id)) {
          await addAccount({
            user_id: userId,
            platform: "facebook",
            account_type: "facebook_page",
            external_id: page.id,
            display_name: page.name,
            avatar_url: page.picture?.data?.url ?? null,
            access_token: page.access_token,
          });
          fbAdded++;
        }
      }

      // 4. Fetch Instagram accounts at business level (most reliable)
      for (const biz of businesses) {
        const igBizUrl = new URL(
          `https://graph.facebook.com/${GRAPH_VERSION}/${biz.id}/instagram_accounts`
        );
        igBizUrl.searchParams.set(
          "fields",
          "id,name,username,profile_picture_url"
        );
        igBizUrl.searchParams.set("access_token", userToken);
        const igBizJson = await gql<{ data?: IgProfile[] }>(igBizUrl);

        for (const ig of igBizJson.data ?? []) {
          if (!ig.id || existingIgIds.has(ig.id)) continue;
          await addAccount({
            user_id: userId,
            platform: "instagram",
            account_type: "instagram_business",
            external_id: ig.id,
            display_name: ig.name ?? ig.username ?? "Instagram Account",
            avatar_url: ig.profile_picture_url ?? null,
            access_token: userToken,
          });
          igAdded++;
          existingIgIds.add(ig.id);
        }
      }

      // 5. Also check per-page instagram_business_account (catches pages not in a business)
      for (const page of pages) {
        if (!page.access_token) continue;

        let igId = page.instagram_business_account?.id;
        if (!igId) {
          const igCheckUrl = new URL(
            `https://graph.facebook.com/${GRAPH_VERSION}/${page.id}`
          );
          igCheckUrl.searchParams.set("fields", "instagram_business_account");
          igCheckUrl.searchParams.set("access_token", page.access_token);
          const igCheck = await gql<{
            instagram_business_account?: { id: string };
          }>(igCheckUrl);
          igId = igCheck.instagram_business_account?.id;
        }
        if (!igId || existingIgIds.has(igId)) continue;

        const igUrl = new URL(
          `https://graph.facebook.com/${GRAPH_VERSION}/${igId}`
        );
        igUrl.searchParams.set(
          "fields",
          "id,name,username,profile_picture_url"
        );
        igUrl.searchParams.set("access_token", page.access_token);
        const ig = await gql<IgProfile>(igUrl);

        if (ig.id) {
          await addAccount({
            user_id: userId,
            platform: "instagram",
            account_type: "instagram_business",
            external_id: ig.id,
            display_name: ig.name ?? ig.username ?? "Instagram Account",
            avatar_url: ig.profile_picture_url ?? null,
            access_token: page.access_token,
          });
          igAdded++;
          existingIgIds.add(igId);
        }
      }
    }

    const params: Record<string, string> = { connected: "facebook" };
    const total = fbAdded + igAdded;
    if (total > 0) params.count = String(total);
    if (igAdded > 0) params.ig = String(igAdded);
    return back(params);
  } catch (err) {
    console.error("[FB callback error]", err);
    return back({ error: "fb_unexpected" });
  }
}
