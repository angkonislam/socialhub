/**
 * Server-side feature flags derived from environment variables.
 * Import only in server components / route handlers.
 */

/** True when real Facebook OAuth credentials are configured. */
export function isFacebookLive(): boolean {
  return Boolean(
    process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
  );
}

/** True when Google credentials are configured (enables YouTube connect). */
export function isYoutubeLive(): boolean {
  return Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );
}

/** Instagram Business Login — separate Instagram app credentials. */
export function isInstagramLive(): boolean {
  return Boolean(
    process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET
  );
}
