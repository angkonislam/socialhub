import type {
  ActivityLog,
  ConnectedAccount,
  Post,
  PostTemplate,
  UserSettings,
  Webhook,
  WorkspaceMember,
} from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * In-memory data store.
 *
 * Used as the backing store when Supabase is not configured (i.e. when
 * the app runs in mock mode), so the dashboard, composer, and publishing
 * flows are fully functional out of the box.
 *
 * NOTE: process-local and non-persistent — resets on server restart.
 * Replace with Supabase queries (see `src/lib/data.ts`) for production.
 */

interface DB {
  accounts: ConnectedAccount[];
  posts: Post[];
  activity: ActivityLog[];
  templates: PostTemplate[];
  webhooks: Webhook[];
  settings: UserSettings[];
  members: WorkspaceMember[];
}

// Persist across hot reloads in dev by stashing on globalThis.
const globalForStore = globalThis as unknown as { __socialHubDB?: DB };

function seed(): DB {
  const now = new Date().toISOString();
  return {
    accounts: [
      {
        id: uid("acct"),
        user_id: "demo",
        platform: "facebook",
        account_type: "facebook_page",
        external_id: uid("fb"),
        display_name: "Acme Coffee — Page",
        avatar_url: "https://picsum.photos/seed/fbpage/80",
        access_token: "mock_token_seed",
        connected_at: now,
      },
      {
        id: uid("acct"),
        user_id: "demo",
        platform: "instagram",
        account_type: "instagram_business",
        external_id: uid("ig"),
        display_name: "@acme.coffee",
        avatar_url: "https://picsum.photos/seed/ig/80",
        access_token: "mock_token_seed",
        connected_at: now,
      },
    ],
    posts: [
      {
        id: uid("post"),
        user_id: "demo",
        content: "Fresh roast just dropped ☕ #coffee #acme",
        media_urls: [],
        hashtags: ["coffee", "acme"],
        status: "published",
        scheduled_at: null,
        published_at: now,
        targets: [],
        created_at: now,
        updated_at: now,
      },
      {
        id: uid("post"),
        user_id: "demo",
        content: "Weekend giveaway announcement 🎉",
        media_urls: [],
        hashtags: [],
        status: "scheduled",
        scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
        published_at: null,
        targets: [],
        created_at: now,
        updated_at: now,
      },
      {
        id: uid("post"),
        user_id: "demo",
        content: "Draft: new menu teaser…",
        media_urls: [],
        hashtags: [],
        status: "draft",
        scheduled_at: null,
        published_at: null,
        targets: [],
        created_at: now,
        updated_at: now,
      },
    ],
    activity: [
      {
        id: uid("act"),
        user_id: "demo",
        action: "account.connected",
        detail: "Connected Facebook Page “Acme Coffee”",
        created_at: now,
      },
      {
        id: uid("act"),
        user_id: "demo",
        action: "post.published",
        detail: "Published a post to 1 platform",
        created_at: now,
      },
    ],
    templates: [
      {
        id: uid("tpl"),
        user_id: "demo",
        name: "Product launch",
        content: "🚀 Big news! We just launched {product}. Check it out 👇 #launch #new",
        created_at: now,
      },
      {
        id: uid("tpl"),
        user_id: "demo",
        name: "Weekend promo",
        content: "Weekend special ☕ Grab yours before it's gone! #deal #weekend",
        created_at: now,
      },
    ],
    webhooks: [],
    settings: [
      {
        user_id: "demo",
        timezone: "Asia/Dhaka",
        theme: "system",
        notify_email: true,
        notify_publish: true,
      },
    ],
    members: [
      {
        id: uid("mbr"),
        workspace_id: "demo-workspace",
        user_id: "demo",
        email: "demo@socialhub.app",
        name: "Demo User",
        role: "owner",
        created_at: now,
      },
    ],
  };
}

export function db(): DB {
  if (!globalForStore.__socialHubDB) {
    globalForStore.__socialHubDB = seed();
  }
  return globalForStore.__socialHubDB;
}
