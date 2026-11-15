import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Video,
} from "lucide-react";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for TCT MultiStream explaining data collection, Google API Services User Data Policy adherence, and YouTube API Services compliance.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | TCT MultiStream",
    description:
      "Understand how TCT MultiStream protects your data and adheres to Google API & YouTube API Services policies.",
    url: `${siteConfig.url}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
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
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6 lg:py-14">
        {/* Document Header */}
        <div className="space-y-3 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
            <span>Google API &amp; YouTube Compliance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
            <span>Application: <strong>TCT MultiStream</strong></span>
            <span>•</span>
            <span>Domain: <strong>tct-multistream.vercel.app</strong></span>
            <span>•</span>
            <span>Effective Date: November 15, 2026</span>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sky-600 dark:text-sky-400">
            <Lock className="size-4" />
            <span>Privacy Summary &amp; Core Principles</span>
          </div>
          <p>
            At <strong>TCT MultiStream</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;the Service&rdquo;),
            we believe in complete transparency and strict user data privacy.
            We <strong>do not sell</strong> your data, we <strong>do not display targeted ads</strong>,
            and we <strong>never use or transfer your information to train AI models</strong>.
            This policy outlines how our application interacts with YouTube API Services and Google user data.
          </p>
        </div>

        {/* Section 1: Introduction */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>1. Introduction &amp; Service Scope</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            TCT MultiStream is a web-based multi-view command center that enables users to watch,
            organize, and synchronize multiple video streams (including YouTube live broadcasts and videos)
            in custom theater grid layouts. This Privacy Policy applies to the website located at{" "}
            <a
              href="https://tct-multistream.vercel.app"
              className="text-sky-600 dark:text-sky-400 hover:underline font-mono"
            >
              https://tct-multistream.vercel.app
            </a>{" "}
            and all associated features, layouts, and tools provided by the application.
          </p>
        </section>

        {/* Section 2: YouTube API Services & Google User Data */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="size-5 text-red-500" />
            <span>2. YouTube API Services &amp; Google User Data</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            TCT MultiStream uses <strong>YouTube API Services</strong> to allow users to discover,
            embed, and watch public YouTube live streams and video content. By accessing or using
            features powered by YouTube API Services, you acknowledge and agree that:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Your use of YouTube content is subject to the{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  YouTube Terms of Service
                  <ExternalLink className="size-3" />
                </a>
                .
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Google processes information in accordance with the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  Google Privacy Policy
                  <ExternalLink className="size-3" />
                </a>
                .
              </span>
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground pt-2">
            2.1 Google OAuth Permissions Requested
          </h3>
          <p className="text-sm text-muted-foreground">
            Users may choose to sign in using Google OAuth to access their personalized YouTube feeds.
            When you sign in, TCT MultiStream requests the following minimal, read-only permissions:
          </p>
          <div className="rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs space-y-1.5">
            <div className="text-foreground font-semibold">Authorized Scopes:</div>
            <div className="text-sky-600 dark:text-sky-400">openid</div>
            <div className="text-sky-600 dark:text-sky-400">email</div>
            <div className="text-sky-600 dark:text-sky-400">profile</div>
            <div className="text-emerald-600 dark:text-emerald-400">
              https://www.googleapis.com/auth/youtube.readonly
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">youtube.readonly</code> scope
            is strictly read-only. TCT MultiStream can never publish videos, post comments, alter your subscriptions,
            modify account settings, or perform any write operations on your YouTube or Google account.
          </p>
        </section>

        {/* Section 3: Google API Services User Data Policy & Limited Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            3. Google API Limited Use Disclosure
          </h2>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
              Limited Use Compliance Statement:
            </p>
            <p>
              TCT MultiStream&apos;s use and transfer to any other app of information received
              from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-amber-500"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            In compliance with Google&apos;s Limited Use requirements:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>No Data Selling:</strong> We do not sell, rent, lease, or monetize your Google
              or YouTube user data under any circumstance.
            </li>
            <li>
              <strong>No Advertising or Profiling:</strong> We do not use or transfer user data
              for serving advertisements, retargeting campaigns, or broker databases.
            </li>
            <li>
              <strong>No AI Model Training:</strong> We do not use Google user data to train or fine-tune
              generalized machine learning or artificial intelligence models.
            </li>
            <li>
              <strong>Strict Functional Purpose:</strong> Data obtained via Google APIs is used
              solely to provide and improve the user-facing multi-view streaming experience requested by the user.
            </li>
          </ul>
        </section>

        {/* Section 4: What Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            4. Information We Collect and How We Use It
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="font-semibold text-sm text-card-foreground">
                Account Information (Optional)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you sign in with Google or create an account, we receive your name,
                email address, and profile picture avatar. This information is used only to
                identify your user session and associate your saved custom layouts.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="font-semibold text-sm text-card-foreground">
                Layouts &amp; Stream URLs
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you save a multi-stream layout, we store your layout title, grid preset
                (e.g., 2x2, 1+3), volume preferences, and the stream video IDs you entered.
                Layouts are private unless you explicitly mark them as public.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="font-semibold text-sm text-card-foreground">
                Browser Local Storage
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you use TCT MultiStream in Guest Mode without logging in, your stream list,
                active layout, solo audio preference, and theme settings (dark/light) are saved
                locally in your browser&apos;s localStorage and are never sent to our servers.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="font-semibold text-sm text-card-foreground">
                API Tokens &amp; Security
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                OAuth access tokens and refresh tokens are encrypted at rest and in transit.
                They are retained strictly to maintain active user sessions and fetch your
                subscribed channel live feeds upon your direct interaction.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Data Revocation & Deletion Policy */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RefreshCw className="size-5 text-sky-500" />
            <span>5. Revocation of Access &amp; Data Deletion Policy</span>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You maintain full ownership and control over your personal data and authorizations.
          </p>

          <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="size-4 text-red-500" />
                <span>How to Revoke Google Account Access</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can revoke TCT MultiStream&apos;s access to your Google account at any time
                directly from your Google account settings:
              </p>
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition"
              >
                <span>Google Security Settings — Third-Party Permissions</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                How to Request Permanent Data Deletion
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you wish to delete your account, saved layouts, and all associated stored data
                permanently from our database, you can:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                <li>Sign out of the application to terminate your active session.</li>
                <li>
                  Email our support team at{" "}
                  <a
                    href="mailto:hangbunchheng2005@gmail.com"
                    className="font-mono text-foreground font-medium underline"
                  >
                    hangbunchheng2005@gmail.com
                  </a>{" "}
                  with the subject line &ldquo;Data Deletion Request&rdquo;.
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                We will permanently erase your user record, OAuth credentials, and cloud layouts
                within 30 days of receiving your request.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Third-Party Embedded Players */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            6. Third-Party Embedded Players &amp; Cookies
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When you watch video streams via TCT MultiStream, video playback occurs inside
            official embedded players (such as the YouTube IFrame Player, Twitch Interactive Player,
            or Kick Embed). These third-party players may place their own cookies, collect viewing
            telemetry, or enforce their own privacy terms according to their respective platforms.
            TCT MultiStream does not inspect or intercept iframe player cookies.
          </p>
        </section>

        {/* Section 7: Contact Us */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Mail className="size-5 text-sky-500" />
            <span>7. Contact Information &amp; User Support</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions, concerns, or requests regarding this Privacy Policy, your consent,
            or your user data, please contact the developer:
          </p>
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Application: </span>
              <span className="font-semibold text-foreground">TCT MultiStream</span>
            </div>
            <div>
              <span className="text-muted-foreground">Support &amp; Privacy Email: </span>
              <a
                href="mailto:hangbunchheng2005@gmail.com"
                className="font-mono font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                hangbunchheng2005@gmail.com
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Website: </span>
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
