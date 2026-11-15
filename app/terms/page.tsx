import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Gavel,
  Globe,
  Lock,
  Mail,
  Scale,
  Shield,
  ShieldAlert,
  Tv,
} from "lucide-react";
import { siteConfig } from "@/lib/seo";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Official Terms of Service for TCT MultiStream. Governs the use of our multi-view live streaming platform, user obligations, acceptable use policy, and YouTube API Services compliance.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | TCT MultiStream",
    description:
      "Review the Terms of Service for TCT MultiStream, including mandatory YouTube Terms of Service agreements and acceptable use policies.",
    url: `${siteConfig.url}/terms`,
    type: "website",
  },
};

const TERMS_TABLE_OF_CONTENTS = [
  { id: "term-1", title: "1. Acceptance of Terms & Eligibility" },
  { id: "term-2", title: "2. Description of the Service" },
  { id: "term-3", title: "3. YouTube Terms of Service & Third Parties" },
  { id: "term-4", title: "4. User Accounts & Authentication" },
  { id: "term-5", title: "5. Acceptable Use & Prohibited Conduct" },
  { id: "term-6", title: "6. Intellectual Property & Broadcast Rights" },
  { id: "term-7", title: "7. User Layouts & Watch Party Presets" },
  { id: "term-8", title: "8. Live Chat & Third-Party Embeds" },
  { id: "term-9", title: "9. Service Modifications & Availability" },
  { id: "term-10", title: "10. Disclaimer of Warranties (As-Is)" },
  { id: "term-11", title: "11. Limitation of Liability" },
  { id: "term-12", title: "12. Indemnification" },
  { id: "term-13", title: "13. Termination & Access Revocation" },
  { id: "term-14", title: "14. Governing Law & Dispute Resolution" },
  { id: "term-15", title: "15. Severability & Entire Agreement" },
  { id: "term-16", title: "16. Changes to These Terms" },
  { id: "term-17", title: "17. Contact & Developer Support" },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background text-foreground transition-colors duration-200 selection:bg-sky-500/20 selection:text-sky-500">
      {/* ── Top Sticky App Header ── */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Studio</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-border/80 pl-4">
              <span className="flex size-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground">
                TCT MultiStream Legal Center
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-medium">
            <Link
              href="/privacy"
              className="rounded-lg px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span className="rounded-lg bg-sky-500/10 px-3 py-1 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
              Terms of Service
            </span>
            <Link
              href="/explore"
              className="hidden md:inline-flex rounded-lg px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Explore Preset Walls
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Header ── */}
      <section className="border-b border-border/80 bg-gradient-to-b from-muted/30 via-background to-background py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
              <Scale className="size-3.5" />
              Binding Legal Agreement
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
              <YouTubeIcon className="size-3.5" />
              YouTube API Developer Compliance
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Terms of Service
          </h1>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            Please read these Terms of Service carefully before using <strong>TCT MultiStream</strong>.
            By accessing our multi-view platform, embedded streaming players, or cloud layout tools,
            you agree to be legally bound by these terms and the terms of our third-party API providers.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono text-xs">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Application</div>
              <div className="font-semibold text-foreground truncate">TCT MultiStream</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Production URL</div>
              <div className="font-semibold text-foreground truncate">tct-multistream.vercel.app</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Revised</div>
              <div className="font-semibold text-foreground truncate">November 15, 2026</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Support Contact</div>
              <div className="font-semibold text-foreground truncate">hangbunchheng2005@gmail.com</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Two-Column Layout ── */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Sticky Table of Contents (Desktop) */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-4 text-sky-500" />
                  <span>Terms Index</span>
                </div>
                <nav className="space-y-1 text-xs">
                  {TERMS_TABLE_OF_CONTENTS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground truncate"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>

              {/* YouTube Terms Notice Card */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  <YouTubeIcon className="size-4" />
                  <span>YouTube API Notice</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  TCT MultiStream utilizes YouTube API Services. By using our application, you are
                  also agreeing to be bound by the official YouTube Terms of Service.
                </p>
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 shadow-xs"
                >
                  <span>Review YouTube Terms</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Privacy Cross-Link Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="size-3.5 text-emerald-500" />
                  <span>Your Privacy Matters</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Learn how we safeguard your data and enforce our strict zero-data-sale policy:
                </p>
                <Link
                  href="/privacy"
                  className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Read Full Privacy Policy</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Column: In-Depth Legal Clauses */}
          <article className="lg:col-span-8 space-y-12 leading-relaxed text-sm text-muted-foreground">
            {/* Agreement Notice Box */}
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-sky-600 dark:text-sky-400">
                <FileCheck className="size-5" />
                <span>Summary of Essential Terms</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                By accessing or using TCT MultiStream, you enter into a binding legal contract with
                the Service developers. Key principles include:
              </p>
              <ul className="grid gap-2 text-xs sm:text-sm text-foreground/80 sm:grid-cols-2 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-sky-500 shrink-0 mt-0.5" />
                  <span><strong>Free Public Client:</strong> Free multi-view player with no extension required.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-sky-500 shrink-0 mt-0.5" />
                  <span><strong>Third-Party Compliance:</strong> Mandatory adherence to YouTube and Twitch rules.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-sky-500 shrink-0 mt-0.5" />
                  <span><strong>Creator Rights:</strong> All video content and audio belong to original broadcasters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-sky-500 shrink-0 mt-0.5" />
                  <span><strong>Lawful Use:</strong> Strictly no scraping, automated abuse, or malicious stream injection.</span>
                </li>
              </ul>
            </div>

            {/* Term 1 */}
            <section id="term-1" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Scale className="size-5 text-sky-500" />
                <span>1. Acceptance of Terms &amp; Eligibility</span>
              </h2>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of <strong>TCT MultiStream</strong>
                (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;), available at{" "}
                <a
                  href="https://tct-multistream.vercel.app"
                  className="font-mono text-foreground underline underline-offset-4 hover:text-sky-500"
                >
                  https://tct-multistream.vercel.app
                </a>
                . By visiting the website, launching multi-stream walls, or signing in with Google OAuth,
                you represent and warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>You are at least 13 years old (or 16 years old in the European Economic Area).</li>
                <li>You have the legal authority to enter into these binding Terms.</li>
                <li>Your use of the Service does not violate any applicable local, national, or international law.</li>
              </ul>
              <p>
                If you do not agree to these Terms in their entirety, you must immediately cease accessing
                and using TCT MultiStream.
              </p>
            </section>

            {/* Term 2 */}
            <section id="term-2" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Tv className="size-5 text-emerald-500" />
                <span>2. Description of the Service</span>
              </h2>
              <p>
                TCT MultiStream is a browser-based multi-view broadcast command center. The Service allows users to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  Watch up to 9 simultaneous live broadcasts or video feeds in customizable grid presets
                  (1x1, 1x2 split, 2x2 quad, 1+3 Stage, and 3x3 9-stream video wall).
                </li>
                <li>
                  Switch solo audio instantly between streams using player client APIs without reloading video iframes.
                </li>
                <li>
                  Toggle collapsible live chat sidebars synchronized with active streams.
                </li>
                <li>
                  Save customized multi-stream configurations to the cloud and share watch party links
                  (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/watch/[layoutId]</code>).
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                <strong>Hosting Disclaimer:</strong> TCT MultiStream is an independent player client and web interface.
                We do not host, store, re-encode, or transmit video or audio files. All video content is streamed directly
                from third-party platforms (YouTube, Twitch, Kick) via their official embed frameworks.
              </p>
            </section>

            {/* Term 3 */}
            <section id="term-3" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <YouTubeIcon className="size-5 text-red-500" />
                <span>3. YouTube Terms of Service &amp; Third-Party API Platforms</span>
              </h2>
              <p>
                TCT MultiStream relies on YouTube API Services to search, browse, and embed YouTube video feeds.
                As an express condition of using this application:
              </p>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-3 text-xs sm:text-sm">
                <div className="font-bold text-red-600 dark:text-red-400">
                  Mandatory Third-Party Terms Agreement:
                </div>
                <p className="text-foreground leading-relaxed">
                  By using TCT MultiStream, users are agreeing to be bound by the{" "}
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-red-600 dark:text-red-400 underline underline-offset-4 hover:text-red-500 inline-flex items-center gap-1"
                  >
                    YouTube Terms of Service
                    <ExternalLink className="size-3" />
                  </a>
                  .
                </p>
                <p className="text-foreground leading-relaxed">
                  Users also agree to Google&apos;s data practices as set forth in the{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500 inline-flex items-center gap-1"
                  >
                    Google Privacy Policy
                    <ExternalLink className="size-3" />
                  </a>
                  .
                </p>
                <p className="text-foreground leading-relaxed">
                  Users may revoke TCT MultiStream&apos;s authorization to access their Google data at any time via the{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500 inline-flex items-center gap-1"
                  >
                    Google Security Settings Page
                    <ExternalLink className="size-3" />
                  </a>
                  .
                </p>
              </div>
              <p>
                To the extent you embed Twitch or Kick streams, you also agree to comply with the{" "}
                <a
                  href="https://www.twitch.tv/p/en/legal/terms-of-service/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sky-600 dark:text-sky-400"
                >
                  Twitch Terms of Service
                </a>{" "}
                and the{" "}
                <a
                  href="https://kick.com/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sky-600 dark:text-sky-400"
                >
                  Kick Terms of Service
                </a>
                .
              </p>
            </section>

            {/* Term 4 */}
            <section id="term-4" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Lock className="size-5 text-sky-500" />
                <span>4. User Accounts &amp; Authentication</span>
              </h2>
              <p>
                You may access core multi-view features without creating an account using our Guest Pass mode.
                However, to save customized layouts to the cloud, access your personal YouTube feed,
                or generate public watch party links, you may register using Google OAuth or email sign-in.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>You are solely responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree to notify us immediately of any unauthorized access to your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate our Acceptable Use Policy.</li>
              </ul>
            </section>

            {/* Term 5 */}
            <section id="term-5" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldAlert className="size-5 text-red-500" />
                <span>5. Acceptable Use Policy &amp; Prohibited Conduct</span>
              </h2>
              <p>
                You agree to use TCT MultiStream strictly in accordance with all applicable laws.
                You expressly agree that you will NOT:
              </p>
              <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs sm:text-sm">
                <ul className="list-disc pl-5 space-y-2 text-foreground/85">
                  <li>
                    <strong>Tamper with Player Controls:</strong> Block, alter, hide, or manipulate
                    embedded advertising, branding, or monetization features displayed inside official
                    YouTube or Twitch iframe players.
                  </li>
                  <li>
                    <strong>Abuse Quotas &amp; DDoS:</strong> Flood our synchronization endpoints,
                    exhaust third-party API quotas, or deploy automated scrapers, spiders, or bots.
                  </li>
                  <li>
                    <strong>Inject Malicious Stream Links:</strong> Add stream URLs pointing to illicit,
                    malicious, copyright-infringing, defamatory, or harmful content.
                  </li>
                  <li>
                    <strong>Circumvent Security:</strong> Attempt to probe, exploit, or bypass authentication
                    protections, token verification, or database access controls.
                  </li>
                  <li>
                    <strong>Commercial Resale:</strong> Resell, sublicense, or white-label TCT MultiStream
                    as a paid commercial product without prior written consent.
                  </li>
                </ul>
              </div>
            </section>

            {/* Term 6 */}
            <section id="term-6" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Gavel className="size-5 text-amber-500" />
                <span>6. Intellectual Property &amp; Broadcast Rights</span>
              </h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                  <h3 className="font-semibold text-foreground text-sm">
                    A. Third-Party Content Rights
                  </h3>
                  <p className="text-xs leading-relaxed">
                    All video broadcasts, audio streams, channel logos, trademarks, and chat messages
                    remain the sole intellectual property of their respective creators, broadcasters,
                    and hosting platforms (YouTube/Google, Twitch/Amazon, Kick). TCT MultiStream claims
                    no ownership over any third-party stream content.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                  <h3 className="font-semibold text-foreground text-sm">
                    B. TCT MultiStream Platform Rights
                  </h3>
                  <p className="text-xs leading-relaxed">
                    The software code, design layout, audio mixing engine, user interface, brand name,
                    and original assets of TCT MultiStream are protected by international copyright
                    and intellectual property laws.
                  </p>
                </div>
              </div>
            </section>

            {/* Term 7 */}
            <section id="term-7" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                7. User Layouts &amp; Watch Party Presets
              </h2>
              <p>
                Users can create, save, and optionally publish multi-stream layout configurations.
                When you mark a layout as &ldquo;Public&rdquo;, you grant TCT MultiStream a non-exclusive,
                royalty-free license to display your layout title, grid preset, and stream video IDs
                in our public Explore directory for other community members to launch and watch.
              </p>
              <p className="text-xs text-muted-foreground">
                We reserve the right to remove any public layout that violates our Acceptable Use Policy
                or contains infringing stream identifiers.
              </p>
            </section>

            {/* Term 8 */}
            <section id="term-8" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                8. Live Chat &amp; Third-Party Embeds
              </h2>
              <p>
                The collapsible live chat component connects directly to official third-party chat frames
                (such as YouTube Live Chat). Messages sent in chat are governed by the hosting platform&apos;s
                community guidelines and moderation systems. TCT MultiStream does not store, censor,
                or intercept chat messages.
              </p>
            </section>

            {/* Term 9 */}
            <section id="term-9" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                9. Service Modifications &amp; Availability
              </h2>
              <p>
                We strive for continuous, reliable platform operation. However, we reserve the right to
                modify, suspend, or discontinue any aspect of the Service at any time with or without notice.
                We are not liable for any downtime caused by scheduled maintenance, network failures,
                or third-party API outages (including YouTube API rate limits).
              </p>
            </section>

            {/* Term 10 */}
            <section id="term-10" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                <span>10. Disclaimer of Warranties (&ldquo;As-Is&rdquo;)</span>
              </h2>
              <div className="rounded-xl border border-border bg-muted/40 p-5 text-xs sm:text-sm leading-relaxed space-y-2">
                <p className="font-bold text-foreground uppercase tracking-wider text-xs">
                  Important Warranty Disclaimer:
                </p>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, TCT MULTISTREAM IS PROVIDED ON AN &ldquo;AS IS&rdquo;
                  AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                  INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                  ACCURACY, NON-INFRINGEMENT, OR UNINTERRUPTED PLAYBACK. WE DO NOT WARRANT THAT THIRD-PARTY
                  STREAM STREAMS WILL REMAIN ACCESSIBLE OR FREE FROM DEFECTS.
                </p>
              </div>
            </section>

            {/* Term 11 */}
            <section id="term-11" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                11. Limitation of Liability
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed">
                IN NO EVENT SHALL TCT MULTISTREAM, ITS DEVELOPERS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS,
                DATA, OR GOODWILL) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE
                SERVICE OR RELIANCE ON ANY THIRD-PARTY STREAM CONTENT.
              </p>
            </section>

            {/* Term 12 */}
            <section id="term-12" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                12. Indemnification
              </h2>
              <p>
                You agree to defend, indemnify, and hold harmless TCT MultiStream, its creators, and contributors
                from and against any claims, liabilities, damages, judgments, awards, losses, costs, or expenses
                (including reasonable attorneys&apos; fees) arising out of or relating to your violation of these
                Terms, your misuse of the Service, or your infringement of any third-party intellectual property rights.
              </p>
            </section>

            {/* Term 13 */}
            <section id="term-13" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                13. Termination &amp; Access Revocation
              </h2>
              <p>
                We may suspend or terminate your access to the Service immediately, without prior notice
                or liability, for any reason, including breach of these Terms. Upon termination, your right
                to access cloud layouts and account features will immediately cease.
              </p>
            </section>

            {/* Term 14 */}
            <section id="term-14" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Globe className="size-5 text-sky-500" />
                <span>14. Governing Law &amp; Dispute Resolution</span>
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
                in which the primary developer resides, without regard to conflict of law provisions.
                Any disputes shall be resolved through good-faith informal negotiation before initiating
                formal proceedings.
              </p>
            </section>

            {/* Term 15 */}
            <section id="term-15" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                15. Severability &amp; Entire Agreement
              </h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision
                shall be limited or eliminated to the minimum extent necessary, and the remaining provisions
                shall remain in full force and effect. These Terms constitute the entire agreement between
                you and TCT MultiStream regarding the Service.
              </p>
            </section>

            {/* Term 16 */}
            <section id="term-16" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                16. Changes to These Terms
              </h2>
              <p>
                We reserve the right to revise these Terms of Service at any time. When updates are published,
                the &ldquo;Last Revised&rdquo; timestamp at the top of this document will be amended.
                Your continued use of the Service following posted modifications constitutes full acceptance
                of the revised Terms.
              </p>
            </section>

            {/* Term 17 */}
            <section id="term-17" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <Mail className="size-5 text-sky-500" />
                  <span>17. Contact &amp; Developer Support</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  For legal inquiries, copyright notices, or questions regarding these Terms of Service,
                  please contact the developer:
                </p>
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5 font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground">Application: </span>
                    <span className="font-semibold text-foreground">TCT MultiStream</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Support Email: </span>
                    <a
                      href="mailto:hangbunchheng2005@gmail.com"
                      className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      hangbunchheng2005@gmail.com
                    </a>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Live Service Domain: </span>
                    <a
                      href="https://tct-multistream.vercel.app"
                      className="text-foreground hover:underline"
                    >
                      https://tct-multistream.vercel.app
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Page Footer ── */}
            <footer className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <div>
                &copy; 2026 TCT MultiStream. All rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link
                  href="/explore"
                  className="hover:text-foreground transition underline-offset-4 hover:underline"
                >
                  Explore Presets
                </Link>
                <span>•</span>
                <Link
                  href="/"
                  className="hover:text-foreground transition underline-offset-4 hover:underline"
                >
                  Studio Home
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
