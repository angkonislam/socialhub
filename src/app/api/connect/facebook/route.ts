import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl } from "@/lib/app-url";

const GRAPH_VERSION = "v21.0";

export async function GET() {
  const clientId = process.env.AUTH_FACEBOOK_ID;
  if (!clientId) {
    return NextResponse.redirect(`${appUrl()}/accounts?error=fb_not_configured`);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${appUrl()}/api/connect/facebook/callback`;

  // Permissions needed to list Pages and post to them.
  // Override via FACEBOOK_SCOPES env if your app uses a different set.
  // NOTE: these require the "Facebook Login" product to be added to the app.
  // pages_show_list + business_management = access Business Portfolio pages.
  // No pages_read_engagement (Meta auto-injects it and breaks dev mode).
  const scope =
    process.env.FACEBOOK_SCOPES ??
    "pages_show_list,business_management";

  const dialog = new URL(
    `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`
  );
  dialog.searchParams.set("client_id", clientId);
  dialog.searchParams.set("redirect_uri", redirectUri);
  dialog.searchParams.set("state", state);
  dialog.searchParams.set("scope", scope);
  dialog.searchParams.set("response_type", "code");

  const jar = await cookies();
  jar.set("fb_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 min
    path: "/",
  });

  return NextResponse.redirect(dialog.toString());
}
