import { Suspense } from "react";
import { Compass, Radio } from "lucide-react";
import { getPublicCommunityLayouts } from "@/actions/layouts";
import { ExploreGallery } from "@/components/ExploreGallery";

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
    <Suspense fallback={<ExploreLoadingFallback />}>
      <ExploreContent />
    </Suspense>
  );
}
