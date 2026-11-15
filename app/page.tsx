import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { isGitHubAuthEnabled } from "@/auth";
import { getCurrentUser, getUserLayouts } from "@/actions/layouts";
import { Navbar } from "@/components/Navbar";
import { StreamGrid } from "@/components/StreamGrid";
import { LiveChatSidebar } from "@/components/LiveChatSidebar";

async function AuthenticatedNavbar() {
  await connection();
  const [user, layoutsResult] = await Promise.all([
    getCurrentUser(),
    getUserLayouts(),
  ]);

  const initialLayouts = layoutsResult.success ? layoutsResult.data : [];

  return (
    <Navbar
      initialUser={user}
      initialLayouts={initialLayouts}
      githubAuthEnabled={isGitHubAuthEnabled}
    />
  );
}

export default function HomePage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Top Control Bar wrapped in Suspense for Next.js Cache Components compatibility */}
      <Suspense fallback={<Navbar initialUser={null} initialLayouts={[]} />}>
        <AuthenticatedNavbar />
      </Suspense>

      {/* Main Theater Viewport: Dynamic Grid Engine + Collapsible Live Chat Sidebar */}
      <main className="flex min-h-0 w-full flex-1 overflow-hidden">
        <StreamGrid />
        <LiveChatSidebar />
      </main>

      {/* Semantic SEO section for search engine crawlers and screen readers */}
      <section
        aria-label="About TCT MultiStream Multi-YouTube Live Stream Command Center"
        className="sr-only"
      >
        <h1>
          TCT MultiStream — Watch Multiple YouTube Live Streams Simultaneously
        </h1>
        <p>
          TCT MultiStream is the ultimate multi-YouTube live stream viewer and
          broadcast command center. Watch multiple YouTube live streams, Twitch
          broadcasts, and videos at the same time in synchronized theater grid
          layouts (1x1, 1x2, 2x2, 1+3 Stage, and 3x3 Command Center).
        </p>

        <h2>Key Features of TCT MultiStream</h2>
        <ul>
          <li>
            <strong>Synchronized Theater Grid Engine:</strong> Choose from 1x1,
            1x2 split, 2x2 quad view, 1+3 main stage, or 3x3 9-stream command
            center.
          </li>
          <li>
            <strong>Solo Audio Switching:</strong> One-click audio focus mutes
            all other streams and unmutes your selected stream instantly using
            the YouTube IFrame Player API.
          </li>
          <li>
            <strong>Collapsible YouTube Live Chat:</strong> Embed official
            interactive YouTube Live Chat with an active stream switcher.
          </li>
          <li>
            <strong>Cloud Layout Persistence & Sharing:</strong> Save custom
            stream presets to Neon PostgreSQL and share public watch party links
            with friends.
          </li>
          <li>
            <strong>Multi-Platform Support:</strong> Play YouTube live streams,
            videos, Twitch broadcasts, and Kick streams in one unified studio.
          </li>
          <li>
            <strong>Audio Equalizer & Soundscapes:</strong> Fine-tune audio
            levels and mix relaxing ambient soundscapes.
          </li>
        </ul>

        <h2>Popular Use Cases for Multi-Stream Viewing</h2>
        <ul>
          <li>
            <strong>Esports & Gaming Multiview:</strong> Follow multiple player
            POVs, commentator desks, and observer feeds during Valorant, CS2,
            League of Legends, and Dota 2 tournaments.
          </li>
          <li>
            <strong>Breaking News & Global Coverage:</strong> Compare live
            broadcasts side-by-side from multiple international news networks.
          </li>
          <li>
            <strong>Space Launches & 24/7 Earth Cameras:</strong> Monitor NASA,
            SpaceX, ISS feeds, and live world webcams on a single video wall.
          </li>
          <li>
            <strong>Music Festivals & DJ Sets:</strong> Experience multi-stage
            festivals with seamless audio switching between stages.
          </li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        <dl>
          <dt>How do I watch multiple YouTube streams at once?</dt>
          <dd>
            Paste any YouTube URL, live stream link, or 11-character video ID
            into the top bar, pick your preferred grid preset, and all streams
            will play simultaneously.
          </dd>
          <dt>Can I listen to one stream while watching multiple streams?</dt>
          <dd>
            Yes! Click Solo Audio on any stream player to listen to only that
            stream while keeping all other video feeds playing silently.
          </dd>
          <dt>Is TCT MultiStream free?</dt>
          <dd>
            Yes, TCT MultiStream is completely free with no extensions or
            downloads required.
          </dd>
        </dl>

        <nav aria-label="Legal and Navigation Links" className="flex gap-4">
          <Link href="/explore">
            Explore Community Stream Walls &amp; MultiView Presets
          </Link>
          <Link href="/privacy">
            Privacy Policy
          </Link>
          <Link href="/terms">
            Terms of Service
          </Link>
        </nav>
      </section>
    </div>
  );
}
