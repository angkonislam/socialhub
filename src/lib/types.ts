/**
 * Shared domain types for Social Hub.
 * These mirror the Supabase schema in `supabase/schema.sql`.
 */

export type Platform =
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "telegram"
  | "linkedin";

export type AccountType =
  | "facebook_page"
  | "instagram_business"
  | "youtube_channel"
  | "tiktok_account"
  | "telegram_channel"
  | "linkedin_profile";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  account_type: AccountType;
  /** Platform-side id of the page/channel/account. */
  external_id: string;
  display_name: string;
  avatar_url: string | null;
  /** Encrypted/opaque in real impl; mock returns a fake token. */
  access_token: string | null;
  connected_at: string;
}

export interface PostTarget {
  platform: Platform;
  account_id: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  hashtags: string[];
  status: PostStatus;
  /** ISO timestamp; set when status is "scheduled". */
  scheduled_at: string | null;
  published_at: string | null;
  targets: PostTarget[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface DashboardStats {
  connectedAccounts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
}

/** Result returned by a platform publish call (real or mock). */
export interface PublishResult {
  platform: Platform;
  account_id: string;
  ok: boolean;
  /** Platform-side post id on success. */
  external_post_id?: string;
  error?: string;
}

/** A reusable caption/template saved by the user. */
export interface PostTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
}

/** Outbound webhook fired on post events (Zapier/Make style). */
export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  /** Events that trigger this webhook, e.g. ["post.published"]. */
  events: string[];
  active: boolean;
  created_at: string;
}

/** Per-user preferences. */
export interface UserSettings {
  user_id: string;
  /** IANA timezone, e.g. "Asia/Dhaka". */
  timezone: string;
  theme: "light" | "dark" | "system";
  notify_email: boolean;
  notify_publish: boolean;
}

export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  created_at: string;
}

/** Aggregated analytics for the insights page. */
export interface Analytics {
  /** Posts published per day (last N days). */
  perDay: { date: string; count: number }[];
  /** Published-post count per platform. */
  perPlatform: { platform: Platform; count: number }[];
  /** Most-used hashtags. */
  topHashtags: { tag: string; count: number }[];
  successRate: number;
  totalPublished: number;
  totalFailed: number;
}
