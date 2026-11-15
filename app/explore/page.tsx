import { Suspense } from "react";
import type { Metadata } from "next";
import { Compass, Radio } from "lucide-react";
import { getPublicCommunityLayouts } from "@/actions/layouts";
import { ExploreGallery } from "@/components/ExploreGallery";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Explore Community Stream Walls & MultiView Presets",
  description:
    "Discover and launch curated multi-YouTube live stream walls created by the community. Browse esports multiview setups, 24/7 space and earth cams, lofi beats, and breaking news command centers.",
  keywords: [
    "explore multistream layouts",
    "community stream walls",
    "youtube multiview presets",
    "curated live streams",
    "multi camera streams",
    "public stream grids",
    "watch party presets",
  ],
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/explore`,
    title: "Explore Community Stream Walls & MultiView Presets | TCT MultiStream",
    description:
      "Discover and launch curated multi-YouTube live stream walls created by the community. Browse esports multiview setups, 24/7 space and earth cams, and breaking news command centers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Community Stream Walls & MultiView Presets | TCT MultiStream",
    description:
      "Discover and launch curated multi-YouTube live stream walls created by the community.",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteConfig.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Explore Stream Walls",
      item: `${siteConfig.url}/explore`,
    },
  ],
};

async function ExploreContent() {
  const result = await getPublicCommunityLayouts();
  const communityLayouts = result.success ? result.data : [];
  return <ExploreGallery communityLayouts={communityLayouts} />;
}

function ExploreLoadingFallback() {
  return (
    <div className="bg-studio-grid relative flex h-screen w-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-400">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-xl">
        <Compass className="size-7 animate-pulse text-emerald-400" />
        <span className="absolute -top-1 -right-1 flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-zinc-200 uppercase">
          <Radio className="size-3.5 animate-spin text-emerald-400" />
          Connecting Wall Directory
        </div>
        <p className="font-mono text-[11px] text-zinc-500">
          Syncing curated stream presets & community stages...
        </p>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Suspense fallback={<ExploreLoadingFallback />}>
        <ExploreContent />
      </Suspense>
    </>
  );
}
