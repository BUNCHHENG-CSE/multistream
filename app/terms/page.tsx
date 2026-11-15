import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  Scale,
  Shield,
  Video,
} from "lucide-react";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for TCT MultiStream governing use of the multi-view stream command center and YouTube API Services compliance.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | TCT MultiStream",
    description:
      "Read the Terms of Service for TCT MultiStream, including YouTube Terms of Service and user conduct guidelines.",
    url: `${siteConfig.url}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen w-full overflow-y-auto bg-background text-foreground transition-colors duration-200">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to MultiStream Studio</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6 lg:py-14">
        {/* Document Header */}
        <div className="space-y-3 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400">
            <Scale className="size-4" />
            <span>User Agreement &amp; Legal Terms</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Terms of Service
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
            <span>Application: <strong>TCT MultiStream</strong></span>
            <span>•</span>
            <span>Domain: <strong>tct-multistream.vercel.app</strong></span>
            <span>•</span>
            <span>Effective Date: November 15, 2026</span>
          </div>
        </div>

        {/* Section 1: Acceptance of Terms */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-5 text-sky-500" />
            <span>1. Acceptance of Terms</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Welcome to <strong>TCT MultiStream</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;).
            By accessing or using our website at{" "}
            <a
              href="https://tct-multistream.vercel.app"
              className="font-mono text-sky-600 dark:text-sky-400 hover:underline"
            >
              https://tct-multistream.vercel.app
            </a>
            , any associated APIs, or custom watch links, you agree to comply with and be bound by
            these Terms of Service and our{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground underline hover:text-sky-500"
            >
              Privacy Policy
            </Link>
            . If you do not agree with any part of these terms, you must refrain from using the Service.
          </p>
        </section>

        {/* Section 2: YouTube API Services & Third-Party Platforms */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="size-5 text-red-500" />
            <span>2. YouTube API Services &amp; Platform Guidelines</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            TCT MultiStream relies on YouTube API Services to embed, browse, and organize video streams.
            In accordance with YouTube API Terms of Service:
          </p>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm leading-relaxed space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-xs sm:text-sm">
                By using TCT MultiStream, users are agreeing to be bound by the{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                >
                  YouTube Terms of Service
                  <ExternalLink className="size-3" />
                </a>
                .
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-xs sm:text-sm">
                Users also agree to Google&apos;s processing of data as described in the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  Google Privacy Policy
                  <ExternalLink className="size-3" />
                </a>
                .
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-xs sm:text-sm">
                Users may revoke TCT MultiStream&apos;s access to their data at any time via the{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  Google Security Settings
                  <ExternalLink className="size-3" />
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Description of Service */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            3. Description of Service
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            TCT MultiStream provides an advanced multi-view streaming client allowing users to
            monitor up to 9 simultaneous live broadcasts or video feeds in dynamic grid layouts
            (1x1, 1x2, 2x2, 1+3 Stage, 3x3). Features include instant solo audio switching,
            integrated live chat toggling, synchronized watch party rooms, and cloud-synced custom layouts.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The Service does not host, encode, or store broadcast video streams. All stream content
            is delivered directly from official third-party embed players (YouTube, Twitch, Kick)
            under their respective public APIs and embed terms.
          </p>
        </section>

        {/* Section 4: Acceptable Use & User Conduct */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="size-5 text-emerald-500" />
            <span>4. Acceptable Use &amp; Prohibited Conduct</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You agree to use TCT MultiStream only for lawful purposes in compliance with all
            applicable local, national, and international laws. You agree NOT to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              Attempt to bypass, defeat, or manipulate embedded player security controls, rate limits, or advertising rules.
            </li>
            <li>
              Use automated bots, crawlers, or scrapers to extract data or exhaust API quotas.
            </li>
            <li>
              Publish or share public layout presets containing unlawful, defamatory, abusive, or infringing stream URLs.
            </li>
            <li>
              Interfere with, disrupt, or place unreasonable load on our server infrastructure, database, or WebSocket relays.
            </li>
            <li>
              Reverse engineer, decompile, or misuse the authentication and session mechanisms of the Service.
            </li>
          </ul>
        </section>

        {/* Section 5: Intellectual Property & Content Ownership */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            5. Intellectual Property &amp; Content Rights
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            All rights, titles, and interests in the TCT MultiStream software interface, branding,
            logo, and design are the exclusive property of TCT MultiStream and its creators.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            All video content, channel branding, thumbnails, audio, and live chat streams displayed
            within the embedded players remain the intellectual property of their respective creators,
            broadcasters, and platforms (YouTube/Google, Twitch/Amazon, Kick). TCT MultiStream claims
            no ownership over any third-party stream content.
          </p>
        </section>

        {/* Section 6: Disclaimer of Warranties */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            6. Disclaimer of Warranties
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
            <p className="font-semibold text-foreground uppercase tracking-wider">
              Provided &ldquo;As Is&rdquo; and &ldquo;As Available&rdquo;
            </p>
            <p>
              TCT MULTISTREAM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS
              WITHOUT ANY REPRESENTATION OR WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT
              THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, ERROR-FREE, OR THAT THIRD-PARTY VIDEO EMBEDS
              WILL REMAIN CONTINUOUSLY ACCESSIBLE. THIRD-PARTY STREAM AVAILABILITY IS ENTIRELY SUBJECT
              TO THE BROADCASTERS AND API PROVIDERS.
            </p>
          </div>
        </section>

        {/* Section 7: Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            7. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To the maximum extent permitted by applicable law, in no event shall TCT MultiStream,
            its developers, contributors, or affiliates be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or inability to use the Service,
            loss of data, or reliance on any third-party content.
          </p>
        </section>

        {/* Section 8: Modifications to Terms */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            8. Modifications to Terms
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We reserve the right to revise or modify these Terms of Service at any time. When changes
            are published, the updated date at the top of this document will be amended. Your continued
            use of the Service after changes are posted constitutes acceptance of the modified Terms.
          </p>
        </section>

        {/* Section 9: Contact Information */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Mail className="size-5 text-sky-500" />
            <span>9. Contact &amp; Developer Support</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions or feedback concerning these Terms of Service, please reach out to:
          </p>
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Application: </span>
              <span className="font-semibold text-foreground">TCT MultiStream</span>
            </div>
            <div>
              <span className="text-muted-foreground">Developer Support Email: </span>
              <a
                href="mailto:hangbunchheng2005@gmail.com"
                className="font-mono font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                hangbunchheng2005@gmail.com
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Domain: </span>
              <a
                href="https://tct-multistream.vercel.app"
                className="font-mono text-foreground hover:underline"
              >
                https://tct-multistream.vercel.app
              </a>
            </div>
          </div>
        </section>

        {/* Footer & Cross Link */}
        <footer className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
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
              Explore Stream Walls
            </Link>
            <span>•</span>
            <Link
              href="/"
              className="hover:text-foreground transition underline-offset-4 hover:underline"
            >
              Home
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
