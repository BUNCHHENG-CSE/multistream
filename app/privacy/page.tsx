import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Tv,
  UserCheck,
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
  title: "Privacy Policy",
  description:
    "Official Privacy Policy for TCT MultiStream. Explains our Google OAuth integration, strict adherence to the Google API Services User Data Policy (Limited Use), YouTube API Services compliance, and user data protection protocols.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | TCT MultiStream",
    description:
      "Review the comprehensive Privacy Policy for TCT MultiStream, covering YouTube API Services, Google OAuth data protection, and our strict zero-data-sale policy.",
    url: `${siteConfig.url}/privacy`,
    type: "website",
  },
};

const TABLE_OF_CONTENTS = [
  { id: "section-1", title: "1. Overview & Service Scope" },
  { id: "section-2", title: "2. YouTube API Services & Google Data" },
  { id: "section-3", title: "3. Google API Limited Use Disclosure" },
  { id: "section-4", title: "4. Information We Collect" },
  { id: "section-5", title: "5. How We Use Collected Information" },
  { id: "section-6", title: "6. Zero-Sale, Zero-Ads & AI Protection" },
  { id: "section-7", title: "7. Data Security & Encryption Standards" },
  { id: "section-8", title: "8. Data Retention & Deletion Policy" },
  { id: "section-9", title: "9. How to Revoke Google Access" },
  { id: "section-10", title: "10. Third-Party Embedded Video Players" },
  { id: "section-11", title: "11. Cookies & Local Storage Practices" },
  { id: "section-12", title: "12. Children's Online Privacy (COPPA)" },
  { id: "section-13", title: "13. International Data Transfers" },
  { id: "section-14", title: "14. Policy Updates & Notifications" },
  { id: "section-15", title: "15. Contact Information & Support" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background text-foreground transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-500">
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
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground">
                TCT MultiStream Legal Center
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs font-medium">
            <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Privacy Policy
            </span>
            <Link
              href="/terms"
              className="rounded-lg px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Terms of Service
            </Link>
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
              Google API Services &amp; YouTube Verified Compliance
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
              <Lock className="size-3.5" />
              Zero Data Selling Guarantee
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Privacy Policy
          </h1>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            This document outlines how <strong>TCT MultiStream</strong> accesses, collects, protects,
            and processes user data, including our strict compliance with the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500"
            >
              Google API Services User Data Policy
            </a>{" "}
            and the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500"
            >
              YouTube Terms of Service
            </a>
            .
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono text-xs">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Application</div>
              <div className="font-semibold text-foreground truncate">TCT MultiStream</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified Domain</div>
              <div className="font-semibold text-foreground truncate">tct-multistream.vercel.app</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Effective Date</div>
              <div className="font-semibold text-foreground truncate">November 15, 2026</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Developer Contact</div>
              <div className="font-semibold text-foreground truncate">hangbunchheng2005@gmail.com</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Two-Column Layout ── */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Sticky Table of Contents & Quick Help (Desktop) */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-4 text-emerald-500" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-1 text-xs">
                  {TABLE_OF_CONTENTS.map((item) => (
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

              {/* Quick Revocation Card */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  <UserCheck className="size-4" />
                  <span>Your Privacy Controls</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can inspect or disconnect TCT MultiStream from your Google Account at any time
                  using Google&apos;s security permissions dashboard.
                </p>
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 shadow-xs"
                >
                  <span>Google Account Permissions</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Support Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-emerald-500" />
                  <span>Support &amp; Compliance Inquiries</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Questions regarding your data or requests for account deletion? Email:
                </p>
                <a
                  href="mailto:hangbunchheng2005@gmail.com"
                  className="font-mono text-emerald-600 dark:text-emerald-400 font-medium underline block break-all"
                >
                  hangbunchheng2005@gmail.com
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: In-Depth Legal Clauses */}
          <article className="lg:col-span-8 space-y-12 leading-relaxed text-sm text-muted-foreground">
            {/* Executive Highlights Alert */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
                <span>Executive Summary &amp; Privacy Guarantees</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                TCT MultiStream is engineered with privacy as a fundamental pillar. We provide a client-side
                multi-view command center for authorized video streams. We operate on the principle of
                minimal data collection:
              </p>
              <ul className="grid gap-2 text-xs sm:text-sm text-foreground/80 sm:grid-cols-2 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Zero Data Selling:</strong> We never sell or broker your personal information.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Zero Targeted Advertising:</strong> We do not track you across the web or serve ads.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>No AI Training:</strong> Your Google data is never used to train machine learning models.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Read-Only API Scopes:</strong> We cannot modify, delete, or post to your YouTube channel.</span>
                </li>
              </ul>
            </div>

            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Tv className="size-5 text-emerald-500" />
                <span>1. Overview &amp; Service Scope</span>
              </h2>
              <p>
                <strong>TCT MultiStream</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;)
                operates the web platform accessible at{" "}
                <a
                  href="https://tct-multistream.vercel.app"
                  className="font-mono text-foreground underline underline-offset-4 hover:text-emerald-500"
                >
                  https://tct-multistream.vercel.app
                </a>
                . The Service allows users to configure synchronized multi-stream theater grids
                (e.g., 1x1, 1x2, 2x2, 1+3 Stage, and 3x3) to monitor public live broadcasts and video streams
                simultaneously, switch audio solos with zero player reloads, and access live chat feeds.
              </p>
              <p>
                This Privacy Policy applies to all interactions with our website, cloud synchronization APIs,
                authentication portals, and shared watch party links. By using TCT MultiStream, you acknowledge
                that you have read and understood this Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <YouTubeIcon className="size-5 text-red-500" />
                <span>2. YouTube API Services &amp; Google User Data</span>
              </h2>
              <p>
                TCT MultiStream integrates with <strong>YouTube API Services</strong> to allow users to search,
                browse, embed, and watch live streams and public broadcasts directly in their browser.
                In compliance with Section III.A.2 of the YouTube API Developer Policies:
              </p>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2 text-xs sm:text-sm">
                <div className="font-semibold text-red-600 dark:text-red-400">
                  Mandatory YouTube &amp; Google Terms Compliance:
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-foreground/85">
                  <li>
                    By using TCT MultiStream, you agree to be bound by the{" "}
                    <a
                      href="https://www.youtube.com/t/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-red-600 dark:text-red-400 underline underline-offset-4 hover:text-red-500 inline-flex items-center gap-1"
                    >
                      YouTube Terms of Service
                      <ExternalLink className="size-3" />
                    </a>
                    .
                  </li>
                  <li>
                    Google processes information in accordance with the{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500 inline-flex items-center gap-1"
                    >
                      Google Privacy Policy
                      <ExternalLink className="size-3" />
                    </a>
                    .
                  </li>
                  <li>
                    Users can revoke TCT MultiStream&apos;s access to their data at any time via the{" "}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500 inline-flex items-center gap-1"
                    >
                      Google Security Settings Page
                      <ExternalLink className="size-3" />
                    </a>
                    .
                  </li>
                </ul>
              </div>

              <h3 className="text-base font-semibold text-foreground pt-2">
                2.1 Google OAuth Scopes Requested
              </h3>
              <p>
                When you choose to authenticate using your Google Account, TCT MultiStream requests
                only the following minimal permissions:
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-3 py-2.5">OAuth Scope</th>
                      <th className="px-3 py-2.5">Scope Level</th>
                      <th className="px-3 py-2.5">Purpose &amp; Functional Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    <tr>
                      <td className="px-3 py-2 text-sky-600 dark:text-sky-400 font-medium">openid</td>
                      <td className="px-3 py-2 text-muted-foreground">Standard</td>
                      <td className="px-3 py-2 font-sans text-foreground/80">
                        Verifies your digital identity and securely establishes your session.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-sky-600 dark:text-sky-400 font-medium">email</td>
                      <td className="px-3 py-2 text-muted-foreground">Standard</td>
                      <td className="px-3 py-2 font-sans text-foreground/80">
                        Identifies your user account and links your saved cloud stream layouts.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-sky-600 dark:text-sky-400 font-medium">profile</td>
                      <td className="px-3 py-2 text-muted-foreground">Standard</td>
                      <td className="px-3 py-2 font-sans text-foreground/80">
                        Renders your display name and avatar icon in the studio control bar.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400 font-medium break-all">
                        https://www.googleapis.com/auth/youtube.readonly
                      </td>
                      <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400 font-medium">Read-Only</td>
                      <td className="px-3 py-2 font-sans text-foreground/80">
                        Retrieves your subscribed channels to detect active live broadcasts and
                        populate your personalized multi-view feed upon direct request.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Strict Read-Only Enforcement:</strong> We do NOT request permissions to upload videos,
                comment, like, manage subscriptions, modify playlists, or edit your account profile.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Scale className="size-5 text-amber-500" />
                <span>3. Google API Limited Use Disclosure</span>
              </h2>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2">
                <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  Limited Use Compliance Statement:
                </div>
                <blockquote className="italic text-foreground text-xs sm:text-sm leading-relaxed border-l-2 border-amber-500 pl-3">
                  &ldquo;TCT MultiStream&apos;s use and transfer to any other app of information received
                  from Google APIs will adhere to the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-amber-500"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.&rdquo;
                </blockquote>
              </div>
              <p>
                To maintain complete compliance with Google&apos;s Limited Use criteria:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  We only use Google user data to provide user-facing features that are prominent
                  in TCT MultiStream&apos;s user interface (e.g. streaming feed display).
                </li>
                <li>
                  We do not transfer Google user data to third parties unless necessary to provide
                  or improve these features, comply with applicable law, or as part of a merger/acquisition.
                </li>
                <li>
                  We never transfer or use Google user data for serving advertisements, including personalized,
                  re-targeted, or interest-based advertising.
                </li>
                <li>
                  We do not permit humans to read your Google user data unless you have given explicit consent,
                  it is necessary for security purposes (such as investigating abuse), or to comply with law.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                4. Information We Collect
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <UserCheck className="size-4 text-sky-500" />
                    <span>A. Information You Provide to Us Directly</span>
                  </h3>
                  <p className="text-xs leading-relaxed">
                    When you create an account, save a custom stream layout, or launch a watch party,
                    we store: your user profile (name and email), your custom layout names, grid configurations
                    (e.g., 2x2, 1+3 Stage), selected audio volumes, and the list of YouTube/Twitch video identifiers
                    you added to your slots.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Server className="size-4 text-emerald-500" />
                    <span>B. Information Collected from Third-Party APIs</span>
                  </h3>
                  <p className="text-xs leading-relaxed">
                    When authenticated via Google OAuth, we receive temporary access tokens and refresh tokens.
                    These tokens are used strictly to communicate with YouTube API Services to load channel
                    titles, live broadcast statuses, and public video metadata for your active session.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <KeyRound className="size-4 text-purple-500" />
                    <span>C. Guest &amp; Local Browser Storage</span>
                  </h3>
                  <p className="text-xs leading-relaxed">
                    If you use TCT MultiStream without signing in (&ldquo;Guest Pass&rdquo; mode), all stream URLs,
                    volume levels, solo audio states, and theme preferences (dark/light mode) are stored
                    exclusively in your browser&apos;s local storage. This data never touches our remote servers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                5. How We Use Collected Information
              </h2>
              <p>We process your information strictly for the following functional purposes:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Service Delivery:</strong> To render the synchronized multi-stream theater grid,
                  coordinate live stream audio solos, and manage embedded chat sidebars.
                </li>
                <li>
                  <strong>Cloud Layout Persistence:</strong> To save your custom grid presets and generate
                  shareable watch party URLs (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/watch/[layoutId]</code>)
                  when you choose to make them public.
                </li>
                <li>
                  <strong>Authentication &amp; Session Management:</strong> To securely identify your account
                  and protect your private layouts from unauthorized modification.
                </li>
                <li>
                  <strong>Operational Diagnostics:</strong> To detect runtime errors, monitor database latency,
                  and ensure high availability of our video synchronization relays.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <EyeOff className="size-5 text-emerald-500" />
                <span>6. Zero-Sale, Zero-Ads &amp; AI Protection</span>
              </h2>
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <div className="font-semibold text-foreground text-sm">
                  Our Uncompromising Privacy Commitments:
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">1. No Data Selling or Renting</div>
                    <p className="text-muted-foreground">
                      We do not sell, rent, lease, or barter your personal information or Google user data
                      to any data brokers, market researchers, or advertisers.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">2. No Ad Retargeting Networks</div>
                    <p className="text-muted-foreground">
                      We do not share your viewing habits or channel subscriptions with marketing networks
                      or advertising exchanges.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">3. No AI Model Training</div>
                    <p className="text-muted-foreground">
                      User data and Google API information are never utilized to train, fine-tune,
                      or evaluate general-purpose artificial intelligence or machine learning models.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">4. No Behavioral Profiling</div>
                    <p className="text-muted-foreground">
                      We do not build cross-site tracking profiles or track your activity outside of
                      our immediate domain.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Lock className="size-5 text-sky-500" />
                <span>7. Data Security &amp; Encryption Standards</span>
              </h2>
              <p>
                We employ industry-leading technical and organizational safeguards to protect your data
                against unauthorized access, destruction, loss, or alteration:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong>Encryption in Transit:</strong> All web traffic is strictly served over HTTPS
                  with TLS 1.3 encryption and HSTS preloading.
                </li>
                <li>
                  <strong>Encryption at Rest:</strong> Database records, authentication credentials,
                  and OAuth tokens are stored in secure PostgreSQL instances hosted by Neon with AES-256 encryption.
                </li>
                <li>
                  <strong>Zero Password Storage:</strong> For Google OAuth logins, no passwords ever touch our infrastructure.
                  For email sign-ins, credentials are protected by cryptographic hashing (Argon2id).
                </li>
                <li>
                  <strong>Least Privilege Architecture:</strong> Server environments enforce strict
                  role-based access controls and ephemeral worker sessions.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Trash2 className="size-5 text-red-500" />
                <span>8. Data Retention &amp; Permanent Deletion Policy</span>
              </h2>
              <p>
                We retain your information only as long as necessary to fulfill the purposes outlined
                in this Privacy Policy or until you request account deletion.
              </p>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-xs sm:text-sm">
                <h3 className="font-semibold text-foreground">
                  Permanent Data Deletion Process
                </h3>
                <p>
                  You have the legal right to request the permanent deletion of your account, saved layouts,
                  and all associated personal data from our systems at any time:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>
                    Send an email to our support team at{" "}
                    <a
                      href="mailto:hangbunchheng2005@gmail.com"
                      className="font-mono text-foreground font-semibold underline"
                    >
                      hangbunchheng2005@gmail.com
                    </a>{" "}
                    with the subject &ldquo;Data Deletion Request&rdquo;.
                  </li>
                  <li>
                    Include the email address associated with your TCT MultiStream account.
                  </li>
                  <li>
                    Upon verification, we will permanently purge all database records, OAuth tokens,
                    and saved configurations within 30 days and confirm deletion by email.
                  </li>
                </ol>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <RefreshCw className="size-5 text-emerald-500" />
                <span>9. How to Revoke Google Account Access</span>
              </h2>
              <p>
                In accordance with YouTube API Services Developer Policies, users can instantly revoke
                TCT MultiStream&apos;s authorization to access their Google and YouTube data at any time:
              </p>
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-3 text-xs sm:text-sm">
                <p>
                  To revoke access directly from your Google Account:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>
                    Visit the{" "}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 font-semibold underline inline-flex items-center gap-1"
                    >
                      Google Account Permissions Dashboard
                      <ExternalLink className="size-3" />
                    </a>
                    .
                  </li>
                  <li>Locate <strong>TCT MultiStream</strong> under &ldquo;Third-party apps with account access&rdquo;.</li>
                  <li>Click on the application and select <strong>Remove Access</strong>.</li>
                </ol>
                <p className="text-xs text-muted-foreground pt-1">
                  Once access is revoked, TCT MultiStream will immediately lose all ability to access your
                  YouTube subscriptions or broadcast status.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                10. Third-Party Embedded Video Players
              </h2>
              <p>
                Video streams embedded in TCT MultiStream are rendered using official iframe player technology
                provided by third parties (YouTube IFrame API, Twitch Interactive Embed, Kick Embed).
              </p>
              <p>
                When you play a stream, the third-party platform directly serves video chunks and player assets
                to your browser. These platforms may set their own cookies, collect viewing analytics, or apply
                their own privacy rules. We recommend reviewing their respective privacy policies:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-sky-600 dark:text-sky-400">
                <li>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                    Google / YouTube Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://www.twitch.tv/p/en/legal/privacy-notice/" target="_blank" rel="noopener noreferrer" className="underline">
                    Twitch Privacy Notice
                  </a>
                </li>
                <li>
                  <a href="https://kick.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">
                    Kick Privacy Policy
                  </a>
                </li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                11. Cookies &amp; Local Storage Practices
              </h2>
              <p>
                TCT MultiStream uses strictly essential cookies and browser local storage:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong>Session Cookies:</strong> Used exclusively to maintain your authenticated login state
                  via secure HTTP-only cookies.
                </li>
                <li>
                  <strong>Local Storage Preferences:</strong> Stores guest stream configurations, active audio solo
                  indexes, ambient soundscape volumes, and UI theme preferences (dark/light mode).
                </li>
                <li>
                  <strong>No Advertising Cookies:</strong> We do not place third-party marketing or tracking cookies
                  on your device.
                </li>
              </ul>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldAlert className="size-5 text-amber-500" />
                <span>12. Children&apos;s Online Privacy Protection (COPPA)</span>
              </h2>
              <p>
                TCT MultiStream does not knowingly collect or solicit personal information from children
                under the age of 13 (or under 16 in the European Economic Area). Our Service is directed
                to a general audience. If we discover that we have inadvertently collected personal data
                from a child under 13 without verifiable parental consent, we will promptly delete that
                information from our servers.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                13. International Data Transfers
              </h2>
              <p>
                TCT MultiStream is hosted on secure cloud infrastructure provided by Vercel and Neon,
                with edge servers and data centers located primarily in the United States. If you access
                the Service from outside the United States, your information may be transferred to, stored,
                and processed in the United States in accordance with standard contractual clauses and
                robust data protection safeguards.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                14. Policy Updates &amp; Notifications
              </h2>
              <p>
                We may periodically update this Privacy Policy to reflect changes in our technological
                infrastructure, legal requirements, or Google API policy updates. When changes occur,
                we will update the &ldquo;Effective Date&rdquo; at the top of this document. We encourage you
                to review this page periodically to remain informed about how we protect your information.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="scroll-mt-24 space-y-4 border-t border-border/80 pt-8">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <Mail className="size-5 text-emerald-500" />
                  <span>15. Contact Information &amp; Data Protection Officer</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  If you have questions, comments, or formal inquiries regarding this Privacy Policy,
                  Google API compliance, or your personal data, please contact the developer:
                </p>
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5 font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground">Application: </span>
                    <span className="font-semibold text-foreground">TCT MultiStream</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lead Developer &amp; Data Contact: </span>
                    <a
                      href="mailto:hangbunchheng2005@gmail.com"
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      hangbunchheng2005@gmail.com
                    </a>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production URL: </span>
                    <a
                      href="https://tct-multistream.vercel.app"
                      className="text-foreground hover:underline"
                    >
                      https://tct-multistream.vercel.app
                    </a>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Google OAuth Client: </span>
                    <span className="text-foreground">TCT MultiStream (Verified App)</span>
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
                  href="/terms"
                  className="hover:text-foreground transition underline-offset-4 hover:underline"
                >
                  Terms of Service
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
