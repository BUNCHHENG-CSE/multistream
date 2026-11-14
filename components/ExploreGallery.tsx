"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  Play,
  Search,
  Sparkles,
  Tv,
  User,
  ExternalLink,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GridPresetIcon } from "@/components/GridPresetIcon";
import {
  EXPLORE_SHOWCASE_WALLS,
  getStreamPlatform,
  getStreamPlatformMeta,
} from "@/lib/youtube";
import type { PublicLayoutDetail } from "@/actions/layouts";
import type { GridPreset, SavedStreamItem } from "@/db/schema";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

interface ExploreCardItem {
  id: string;
  title: string;
  subtitle: string;
  gridPreset: GridPreset;
  streams: SavedStreamItem[];
  author: string;
  badge: string;
  isCommunityDb: boolean;
}

const PRESET_FILTERS: Array<"All" | GridPreset> = [
  "All",
  "1+3",
  "2x2",
  "3x3",
  "1x2",
];

function WallMosaicPreview({ streams }: { streams: SavedStreamItem[] }) {
  const preview = streams.slice(0, 4);
  return (
    <div
      className={cn(
        "grid h-36 w-full gap-1 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-950 p-1 dark:border-zinc-800",
        preview.length <= 1
          ? "grid-cols-1 grid-rows-1"
          : preview.length === 2
            ? "grid-cols-2 grid-rows-1"
            : "grid-cols-2 grid-rows-2"
      )}
    >
      {preview.map((s, idx) => {
        const isYt = getStreamPlatform(s.videoId) === "youtube";
        const meta = getStreamPlatformMeta(s.videoId);
        return (
          <div
            key={`${s.videoId}-${idx}`}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950"
          >
            {isYt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${s.videoId}/mqdefault.jpg`}
                alt={s.label}
                loading="lazy"
                className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/60 to-zinc-950 text-[10px] font-bold text-purple-200">
                {meta.label}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <span className="absolute bottom-1 left-1.5 max-w-[90%] truncate font-mono text-[9px] font-semibold text-zinc-100">
              {s.label.split("—")[0].trim()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ExploreGallery({
  communityLayouts,
}: {
  communityLayouts: PublicLayoutDetail[];
}) {
  const router = useRouter();
  const loadLayoutConfig = useStreamStore((s) => s.loadLayoutConfig);

  const [query, setQuery] = useState("");
  const [presetFilter, setPresetFilter] = useState<"All" | GridPreset>("All");

  const cards = useMemo<ExploreCardItem[]>(() => {
    const dbCards: ExploreCardItem[] = communityLayouts.map((layout) => ({
      id: layout.id,
      title: layout.title,
      subtitle: `${layout.streams.length} curated live feeds in ${layout.gridPreset} theater grid`,
      gridPreset: layout.gridPreset,
      streams: layout.streams,
      author: layout.authorName || "Community Director",
      badge: "Community DB",
      isCommunityDb: true,
    }));

    const featuredCards: ExploreCardItem[] = EXPLORE_SHOWCASE_WALLS.map(
      (wall) => ({
        id: wall.id,
        title: wall.title,
        subtitle: wall.subtitle,
        gridPreset: wall.preset,
        streams: wall.streams,
        author: wall.author,
        badge: wall.badge,
        isCommunityDb: false,
      })
    );

    return [...dbCards, ...featuredCards];
  }, [communityLayouts]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (presetFilter !== "All" && card.gridPreset !== presetFilter) {
        return false;
      }
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.subtitle.toLowerCase().includes(q) ||
        card.author.toLowerCase().includes(q) ||
        card.badge.toLowerCase().includes(q) ||
        card.streams.some((s) => s.label.toLowerCase().includes(q))
      );
    });
  }, [cards, query, presetFilter]);

  const handleLaunchInStudio = (card: ExploreCardItem) => {
    loadLayoutConfig({
      gridPreset: card.gridPreset,
      streams: card.streams,
    });
    toast.success(`Launched "${card.title}" (${card.gridPreset})`);
    router.push("/");
  };

  return (
    <div className="bg-studio-grid flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 text-foreground dark:bg-zinc-950">
      {/* Header */}
      <header className="relative z-30 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/85 px-4 shadow-2xs backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-zinc-100/80 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Studio</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
              <Compass className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Community Wall Directory
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/15 px-1.5 py-0 font-mono text-[10px] text-emerald-700 dark:text-emerald-300"
                >
                  {cards.length} Walls
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                1-click multi-stream setups curated by directors & community
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:from-emerald-500 hover:to-teal-500"
          >
            <Tv className="size-3.5" />
            <span className="hidden sm:inline">Open Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Search & Preset Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-xs backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/90 dark:bg-zinc-900/75">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search walls by title, stream, category, or author..."
                className="h-9 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-xs dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                <Layers className="size-3.5" />
                Grid:
              </span>
              {PRESET_FILTERS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPresetFilter(preset)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition",
                    presetFilter === preset
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {preset !== "All" && (
                    <GridPresetIcon preset={preset} className="size-3" />
                  )}
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Wall Cards */}
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/70 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <Sparkles className="mb-3 size-8 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No matching walls found
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Try clearing your search query or switching the grid preset filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCards.map((card) => (
                <div
                  key={`${card.isCommunityDb ? "db" : "curated"}-${card.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-xs backdrop-blur-md transition-all hover:border-emerald-500/50 hover:shadow-lg dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:hover:border-emerald-500/40"
                >
                  <div className="space-y-3">
                    <WallMosaicPreview streams={card.streams} />

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "px-2 py-0 text-[10px] font-semibold",
                            card.isCommunityDb
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          )}
                        >
                          {card.badge}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-zinc-100 px-2 py-0 font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          <GridPresetIcon
                            preset={card.gridPreset}
                            className="size-3 text-emerald-500"
                          />
                          {card.gridPreset}
                        </Badge>
                      </div>

                      <h2 className="mt-2 truncate text-sm font-bold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                        {card.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1 truncate">
                        <User className="size-3" />
                        {card.author}
                      </span>
                      <span className="font-mono font-semibold">
                        {card.streams.length} feeds
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleLaunchInStudio(card)}
                        className="h-8 flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500"
                      >
                        <Play className="size-3.5 fill-current" />
                        Launch in Studio
                      </Button>
                      {card.isCommunityDb && (
                        <Link
                          href={`/watch/${card.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          title="Open Dedicated Theater Link"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
