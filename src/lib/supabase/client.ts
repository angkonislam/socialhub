"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client using the public anon key.
 * Safe for client components. Subject to Row Level Security.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
