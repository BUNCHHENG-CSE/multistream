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
    <div className="bg-studio-grid flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background text-zinc-500 dark:text-zinc-400">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Compass className="size-6 animate-pulse text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex items-center gap-2 text-xs font-medium">
        <Radio className="size-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
        Loading Community Wall Directory...
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
