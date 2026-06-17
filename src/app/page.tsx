import Link from "next/link";
import {
  Sparkles,
  CalendarClock,
  Send,
  LayoutDashboard,
  Link2,
  PenSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformIcon } from "@/components/platform-icon";
import type { Platform } from "@/lib/types";

const PLATFORMS: Platform[] = [
  "facebook",
  "youtube",
  "instagram",
  "telegram",
  "tiktok",
];

const FEATURES = [
  {
    icon: Link2,
    title: "Connect every channel",
    body: "Link Facebook Pages, Instagram Business, YouTube, TikTok, and LinkedIn in a few clicks.",
  },
  {
    icon: PenSquare,
    title: "Compose once",
    body: "A rich editor with image & video upload, hashtags, emoji, and a live character counter.",
  },
  {
    icon: Send,
    title: "Publish everywhere",
    body: "Select platforms and push your post to all of them with a single click.",
  },
  {
    icon: CalendarClock,
    title: "Schedule & draft",
    body: "Queue posts for later or save drafts, with full status tracking for every post.",
  },
  {
    icon: LayoutDashboard,
    title: "One dashboard",
    body: "See connected accounts, published, scheduled, and draft counts plus recent activity.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    body: "OAuth-based connections, secrets in environment variables, and protected API routes.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            Social Hub
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-grid">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> One dashboard for all your channels
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Publish to every social network from one place
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Social Hub connects your accounts and lets you compose, schedule,
            and publish content across Facebook, Instagram, YouTube, TikTok,
            and LinkedIn — all from a single, modern dashboard.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg">Start for free</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                See features
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6">
            {PLATFORMS.map((p) => (
              <PlatformIcon
                key={p}
                platform={p}
                brandColor
                className="h-8 w-8 opacity-90 transition-transform hover:scale-110"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Everything you need to ship content</h2>
          <p className="mt-3 text-muted-foreground">
            Built for creators and teams who post everywhere.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Card className="overflow-hidden bg-primary p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to simplify your publishing?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Connect your first account in minutes. No credit card required.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Get started now
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Social Hub. All rights reserved.</span>
          <span>Built with Next.js, Supabase & Auth.js</span>
        </div>
      </footer>
    </div>
  );
}
