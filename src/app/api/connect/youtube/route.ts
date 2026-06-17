import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId) {
    return NextResponse.redirect(`${appUrl()}/accounts?error=yt_not_configured`);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${appUrl()}/api/connect/youtube/callback`;

  const dialog = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  dialog.searchParams.set("client_id", clientId);
  dialog.searchParams.set("redirect_uri", redirectUri);
  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("state", state);
  dialog.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly profile");
  dialog.searchParams.set("access_type", "offline");
  dialog.searchParams.set("prompt", "consent");

  const jar = await cookies();
  jar.set("yt_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(dialog.toString());
}
