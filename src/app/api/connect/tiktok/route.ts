import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl } from "@/lib/app-url";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.redirect(`${appUrl()}/accounts?error=tt_not_configured`);
  }

  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const redirectUri = `${appUrl()}/api/connect/tiktok/callback`;

  const dialog = new URL("https://www.tiktok.com/v2/auth/authorize/");
  dialog.searchParams.set("client_key", clientKey);
  dialog.searchParams.set("redirect_uri", redirectUri);
  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("state", state);
  dialog.searchParams.set("scope", "user.info.basic,video.publish,video.upload");

  const jar = await cookies();
  jar.set("tt_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  jar.set("tt_code_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(dialog.toString());
}
