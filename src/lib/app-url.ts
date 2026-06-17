/**
 * Returns the canonical base URL of the app.
 * Priority: NEXT_PUBLIC_APP_URL → VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → localhost
 *
 * VERCEL_PROJECT_PRODUCTION_URL = stable production domain (set automatically by Vercel)
 * VERCEL_URL = per-deployment preview URL (changes each deploy — avoid for OAuth redirects)
 */
export function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
