import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Tv, ArrowLeft, Lock, Radio } from "lucide-react";
import { getPublicLayout } from "@/actions/layouts";
import { SharedLayoutViewer } from "@/components/SharedLayoutViewer";

async function SharedLayoutContent({
  params,
}: {
  params: Promise<{ layoutId: string }>;
}) {
  await connection();
  const { layoutId } = await params;
  const result = await getPublicLayout(layoutId);

  if (!result.success) {
    return (
      <div className="bg-studio-grid flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-zinc-200/90 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
            <Lock className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Layout Unavailable
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {result.error}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500"
          >
            <ArrowLeft className="size-3.5" />
            Return to Multi-Stream Studio
          </Link>
        </div>
      </div>
    );
  }

  return <SharedLayoutViewer layout={result.data} />;
}

function SharedLayoutLoadingFallback() {
  return (
    <div className="bg-studio-grid flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background text-zinc-500 dark:text-zinc-400">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Tv className="size-6 animate-pulse text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex items-center gap-2 text-xs font-medium">
        <Radio className="size-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
        Loading shared multi-stream layout...
      </div>
    </div>
  );
}

export default function WatchLayoutPage({
  params,
}: {
  params: Promise<{ layoutId: string }>;
}) {
  return (
    <Suspense fallback={<SharedLayoutLoadingFallback />}>
      <SharedLayoutContent params={params} />
    </Suspense>
  );
}
