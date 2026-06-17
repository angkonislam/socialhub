import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl } from "@/lib/app-url";

export async function GET() {
  const clientId = process.env.INSTAGRAM_APP_ID;
  if (!clientId) {
    return NextResponse.redirect(`${appUrl()}/accounts?error=ig_not_configured`);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${appUrl()}/api/connect/instagram/callback`;

  const dialog = new URL("https://www.instagram.com/oauth/authorize");
  dialog.searchParams.set("client_id", clientId);
  dialog.searchParams.set("redirect_uri", redirectUri);
  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("state", state);
  dialog.searchParams.set("scope", "instagram_business_basic,instagram_business_content_publish");

  const jar = await cookies();
  jar.set("ig_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(dialog.toString());
}
