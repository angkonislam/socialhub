export const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Demo User",
  email: "demo@socialhub.app",
  image: null as string | null,
};

export async function getSessionUser() {
  try {
    const { getSupabaseUser } = await import("@/lib/supabase/auth-server");
    const user = await getSupabaseUser();
    if (user) {
      try {
        const { upsertUser } = await import("@/lib/data");
        await upsertUser({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.email ?? null,
          email: user.email ?? null,
          image: user.user_metadata?.avatar_url ?? null,
        });
      } catch {}
      return {
        id: user.id,
        name: user.user_metadata?.full_name ?? user.email ?? "User",
        email: user.email ?? null,
        image: user.user_metadata?.avatar_url ?? null,
      };
    }
  } catch {}
  return DEMO_USER;
}
