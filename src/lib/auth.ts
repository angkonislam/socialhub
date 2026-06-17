import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import TikTok from "next-auth/providers/tiktok";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Login providers: Google, GitHub, Facebook, LinkedIn, TikTok.
 * A provider is only registered when its credentials are present, so the
 * app boots fine with a partial `.env.local` during development.
 *
 * Sessions are JWT-based. The user row is mirrored into Supabase on
 * first sign-in (see `events.signIn`).
 */

function configuredProviders() {
  const providers: NextAuthConfig["providers"] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(Google);
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(GitHub);
  }
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    providers.push(Facebook);
  }
  if (process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET) {
    providers.push(LinkedIn);
  }
  if (process.env.AUTH_TIKTOK_ID && process.env.AUTH_TIKTOK_SECRET) {
    providers.push(TikTok);
  }
  return providers;
}

export const authConfig: NextAuthConfig = {
  providers: configuredProviders(),
  secret:
    process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-in-production",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      try {
        const { upsertUser } = await import("@/lib/data");
        await upsertUser({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        });
      } catch {
        // non-fatal
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
