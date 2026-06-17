import type {
  AccountType,
  ConnectedAccount,
  Platform,
  PublishResult,
} from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Mock platform API layer.
 *
 * Stands in for the real Facebook Graph, Instagram, YouTube Data, and
 * TikTok APIs so the whole app works before real credentials exist.
 * Each function mimics network latency and returns realistic shapes.
 *
 * Swap these for real SDK calls once `NEXT_PUBLIC_USE_MOCK_APIS=false`
 * and provider credentials are configured — the call sites in the API
 * routes stay the same.
 */

const LATENCY_MS = 600;

function delay(ms = LATENCY_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

interface MockConnectable {
  platform: Platform;
  account_type: AccountType;
  display_name: string;
  avatar_url: string;
}

/** Fake "available to connect" entities per platform. */
const CATALOG: Record<Platform, MockConnectable[]> = {
  facebook: [
    {
      platform: "facebook",
      account_type: "facebook_page",
      display_name: "Acme Coffee — Page",
      avatar_url: "https://picsum.photos/seed/fbpage/80",
    },
  ],
  instagram: [
    {
      platform: "instagram",
      account_type: "instagram_business",
      display_name: "@acme.coffee",
      avatar_url: "https://picsum.photos/seed/ig/80",
    },
  ],
  youtube: [
    {
      platform: "youtube",
      account_type: "youtube_channel",
      display_name: "Acme Coffee TV",
      avatar_url: "https://picsum.photos/seed/yt/80",
    },
  ],
  tiktok: [
    {
      platform: "tiktok",
      account_type: "tiktok_account",
      display_name: "@acmecoffee",
      avatar_url: "https://picsum.photos/seed/tt/80",
    },
  ],
  telegram: [
    {
      platform: "telegram",
      account_type: "telegram_channel",
      display_name: "Acme Coffee Channel",
      avatar_url: "https://picsum.photos/seed/tg/80",
    },
  ],
  linkedin: [
    {
      platform: "linkedin",
      account_type: "linkedin_profile",
      display_name: "Acme Coffee Co.",
      avatar_url: "https://picsum.photos/seed/li/80",
    },
  ],
};

/** Simulate an OAuth handshake and return a connectable account. */
export async function mockConnect(
  userId: string,
  platform: Platform
): Promise<Omit<ConnectedAccount, "id" | "connected_at">> {
  await delay();
  const entry = CATALOG[platform][0];
  return {
    user_id: userId,
    platform: entry.platform,
    account_type: entry.account_type,
    external_id: uid(platform),
    display_name: entry.display_name,
    avatar_url: entry.avatar_url,
    access_token: `mock_token_${uid()}`,
  };
}

/** Simulate publishing one post to one connected account. */
export async function mockPublish(
  account: Pick<ConnectedAccount, "id" | "platform">,
  content: string
): Promise<PublishResult> {
  await delay(400 + Math.random() * 500);

  // Simulate an occasional failure so status tracking is exercised.
  const failed = content.toLowerCase().includes("forcefail");
  if (failed) {
    return {
      platform: account.platform,
      account_id: account.id,
      ok: false,
      error: "Mock API: simulated publish failure.",
    };
  }

  return {
    platform: account.platform,
    account_id: account.id,
    ok: true,
    external_post_id: uid(`${account.platform}_post`),
  };
}
