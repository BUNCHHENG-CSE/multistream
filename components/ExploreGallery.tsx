"use client";

import React, { useId, useMemo, useRef, useState, useEffect } from "react";
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
  Copy,
  Check,
  Eye,
  X,
  Radio,
  LayoutGrid,
  List,
  Flame,
  Headphones,
  Rocket,
  Newspaper,
  Zap,
  Volume2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GridPresetIcon } from "@/components/GridPresetIcon";
import {
  EXPLORE_SHOWCASE_WALLS,
  getStreamPlatform,
  getStreamPlatformMeta,
  getStreamRawId,
  getStreamExternalUrl,
} from "@/lib/youtube";
import type { PublicLayoutDetail } from "@/actions/layouts";
import type { GridPreset, SavedStreamItem } from "@/db/schema";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

export interface ExploreCardItem {
  id: string;
  title: string;
  subtitle: string;
  gridPreset: GridPreset;
  streams: SavedStreamItem[];
  author: string;
  badge: string;
  category: "music" | "space" | "news" | "productivity" | "command" | "community";
  isCommunityDb: boolean;
  tags?: string[];
}

const PRESET_FILTERS: Array<"All" | GridPreset> = [
  "All",
  "1+3",
  "2x2",
  "3x3",
  "1x2",
];

type CategoryFilter =
  | "all"
  | "music"
  | "space"
  | "news"
  | "productivity"
  | "command";

interface CategoryMeta {
  id: CategoryFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
  glowColor: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "all",
    label: "All Presets",
    icon: Sparkles,
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.15)",
  },
  {
    id: "music",
    label: "Music & Beats",
    icon: Headphones,
    colorClass: "text-purple-500 dark:text-purple-400",
    badgeClass: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300",
    glowColor: "rgba(168, 85, 247, 0.15)",
  },
  {
    id: "space",
    label: "Aerospace & Earth",
    icon: Rocket,
    colorClass: "text-sky-500 dark:text-sky-400",
    badgeClass: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-300",
    glowColor: "rgba(14, 165, 233, 0.15)",
  },
  {
    id: "news",
    label: "Newsroom & Intel",
    icon: Newspaper,
    colorClass: "text-amber-500 dark:text-amber-400",
    badgeClass: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300",
    glowColor: "rgba(245, 158, 11, 0.15)",
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Zap,
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300",
    glowColor: "rgba(16, 185, 129, 0.15)",
  },
  {
    id: "command",
    label: "Command Matrix",
    icon: LayoutGrid,
    colorClass: "text-rose-500 dark:text-rose-400",
    badgeClass: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300",
    glowColor: "rgba(244, 63, 94, 0.15)",
  },
];

function resolveCardCategory(
  badge: string,
  title: string
): ExploreCardItem["category"] {
  const norm = (badge + " " + title).toLowerCase();
  if (norm.includes("music") || norm.includes("chill") || norm.includes("lofi") || norm.includes("synth")) {
    return "music";
  }
  if (norm.includes("space") || norm.includes("nasa") || norm.includes("earth") || norm.includes("orbital")) {
    return "space";
  }
  if (norm.includes("news") || norm.includes("world") || norm.includes("desk")) {
    return "news";
  }
  if (norm.includes("work") || norm.includes("focus") || norm.includes("productivity")) {
    return "productivity";
  }
  if (norm.includes("command") || norm.includes("matrix") || norm.includes("mission") || norm.includes("3x3")) {
    return "command";
  }
  return "community";
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-3 shrink-0 fill-red-500", className)} viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-3 shrink-0 fill-purple-400", className)} viewBox="0 0 24 24">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

function StreamTileThumbnail({
  stream,
  isHero = false,
  index = 0,
}: {
  stream: SavedStreamItem;
  isHero?: boolean;
  index?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const platform = getStreamPlatform(stream.videoId);
  const rawId = getStreamRawId(stream.videoId);
  const cleanLabel = stream.label.split("—")[0].trim();

  if (platform === "twitch") {
    return (
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-md border border-purple-500/20 bg-gradient-to-br from-purple-950/90 via-slate-950 to-zinc-950 p-2 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded bg-purple-500/30 px-1 py-0.5 text-[9px] font-bold text-purple-200 backdrop-blur-xs">
            <TwitchIcon className="size-2.5" />
            <span>TW</span>
          </span>
          <span className="font-mono text-[9px] text-purple-300/80">#{index + 1}</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 py-1 text-center">
          <div className="flex size-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30">
            <Radio className="size-3.5 animate-pulse text-purple-400" />
          </div>
          <span className="max-w-[95%] truncate font-mono text-[10px] font-semibold text-purple-100">
            @{rawId}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-purple-500/15 pt-1 text-[8px] text-purple-300/80">
          <span className="truncate">{cleanLabel}</span>
          <span className="flex items-center gap-0.5 text-[8px] text-emerald-400">
            <span className="size-1 animate-ping rounded-full bg-emerald-400" />
            LIVE
          </span>
        </div>
      </div>
    );
  }

  if (platform === "kick") {
    return (
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-md border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-zinc-950 p-2 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/30 px-1 py-0.5 font-mono text-[8px] font-black text-emerald-300">
            KICK
          </span>
          <span className="font-mono text-[9px] text-emerald-300/80">#{index + 1}</span>
        </div>
        <div className="text-center font-mono text-[10px] font-bold text-emerald-200">
          @{rawId}
        </div>
        <div className="truncate text-[8px] text-zinc-400">{cleanLabel}</div>
      </div>
    );
  }

  // YouTube Stream
  const thumbnailUrl = `https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`;

  return (
    <div className="group/tile relative h-full w-full overflow-hidden rounded-md bg-zinc-900">
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={stream.label}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover opacity-90 transition-all duration-300 group-hover/tile:scale-105 group-hover/tile:opacity-100"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-2 text-center text-zinc-400">
          <YouTubeIcon className="size-4 text-red-500" />
          <span className="max-w-[90%] truncate font-mono text-[9px] font-medium text-zinc-200">
            {cleanLabel}
          </span>
        </div>
      )}

      {/* High-tech Cinema Gradient Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Platform & Slot Badge */}
      <div className="absolute top-1 left-1.5 flex items-center gap-1">
        <span className="inline-flex items-center gap-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-semibold text-zinc-200 backdrop-blur-md">
          <YouTubeIcon className="size-2.5" />
          <span>YT</span>
        </span>
        {isHero && (
          <span className="rounded bg-emerald-500/80 px-1 py-0.5 font-mono text-[8px] font-bold text-black shadow-xs">
            STAGE 1
          </span>
        )}
      </div>

      {/* Stream Label Overlay */}
      <div className="absolute right-1.5 bottom-1 left-1.5 flex items-center justify-between gap-1">
        <span className="truncate font-mono text-[9px] font-semibold text-zinc-100 drop-shadow-md">
          {cleanLabel}
        </span>
        <span className="shrink-0 font-mono text-[8px] text-zinc-400">
          #{index + 1}
        </span>
      </div>
    </div>
  );
}

function WallMosaicPreview({
  preset,
  streams,
  onLaunch,
  onInspect,
}: {
  preset: GridPreset;
  streams: SavedStreamItem[];
  onLaunch?: () => void;
  onInspect?: () => void;
}) {
  return (
    <div className="relative group/mosaic overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-950 p-1.5 shadow-inner transition-colors duration-200 dark:border-zinc-800/90">
      {/* Dynamic Grid Layout that truly matches the Preset */}
      {preset === "1+3" && (
        <div className="grid h-40 w-full grid-cols-3 grid-rows-3 gap-1.5 sm:h-44">
          <div className="col-span-2 row-span-3">
            {streams[0] && (
              <StreamTileThumbnail stream={streams[0]} isHero index={0} />
            )}
          </div>
          <div className="col-span-1 row-span-1">
            {streams[1] ? (
              <StreamTileThumbnail stream={streams[1]} index={1} />
            ) : (
              <div className="h-full w-full rounded-md border border-dashed border-zinc-800 bg-zinc-900/40" />
            )}
          </div>
          <div className="col-span-1 row-span-1">
            {streams[2] ? (
              <StreamTileThumbnail stream={streams[2]} index={2} />
            ) : (
              <div className="h-full w-full rounded-md border border-dashed border-zinc-800 bg-zinc-900/40" />
            )}
          </div>
          <div className="col-span-1 row-span-1">
            {streams[3] ? (
              <StreamTileThumbnail stream={streams[3]} index={3} />
            ) : (
              <div className="h-full w-full rounded-md border border-dashed border-zinc-800 bg-zinc-900/40" />
            )}
          </div>
        </div>
      )}

      {preset === "2x2" && (
        <div className="grid h-40 w-full grid-cols-2 grid-rows-2 gap-1.5 sm:h-44">
          {streams.slice(0, 4).map((s, idx) => (
            <div key={`${s.videoId}-${idx}`} className="h-full w-full">
              <StreamTileThumbnail stream={s} index={idx} />
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - streams.length) }).map((_, i) => (
            <div
              key={`empty-2x2-${i}`}
              className="flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 font-mono text-[9px] text-zinc-600"
            >
              STANDBY
            </div>
          ))}
        </div>
      )}

      {preset === "1x2" && (
        <div className="grid h-40 w-full grid-cols-2 grid-rows-1 gap-1.5 sm:h-44">
          {streams.slice(0, 2).map((s, idx) => (
            <div key={`${s.videoId}-${idx}`} className="h-full w-full">
              <StreamTileThumbnail stream={s} index={idx} isHero={idx === 0} />
            </div>
          ))}
          {streams.length < 2 && (
            <div className="flex items-center justify-center rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 font-mono text-[9px] text-zinc-600">
              STANDBY FEED
            </div>
          )}
        </div>
      )}

      {preset === "3x3" && (
        <div className="grid h-40 w-full grid-cols-3 grid-rows-3 gap-1 sm:h-44">
          {streams.slice(0, 9).map((s, idx) => (
            <div key={`${s.videoId}-${idx}`} className="h-full w-full">
              <StreamTileThumbnail stream={s} index={idx} />
            </div>
          ))}
          {Array.from({ length: Math.max(0, 9 - streams.length) }).map((_, i) => (
            <div
              key={`empty-3x3-${i}`}
              className="flex items-center justify-center rounded-sm border border-dashed border-zinc-800/80 bg-zinc-900/40 font-mono text-[8px] text-zinc-600"
            >
              AUX {streams.length + i + 1}
            </div>
          ))}
        </div>
      )}

      {preset === "1x1" && (
        <div className="h-40 w-full sm:h-44">
          {streams[0] && (
            <StreamTileThumbnail stream={streams[0]} index={0} isHero />
          )}
        </div>
      )}

      {/* Interactive Quick Launch Hover Overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-2xs transition-opacity duration-200 group-hover/mosaic:pointer-events-auto group-hover/mosaic:opacity-100">
        <div className="flex items-center gap-2">
          {onLaunch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black shadow-lg shadow-emerald-500/25 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
            >
              <Play className="size-3.5 fill-current" />
              <span>Launch</span>
            </button>
          )}
          {onInspect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <Eye className="size-3.5" />
              <span>Inspect</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamInspectorDialog({
  card,
  open,
  onOpenChange,
  onLaunch,
}: {
  card: ExploreCardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunch: (card: ExploreCardItem) => void;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const titleId = useId();
  const descId = useId();

  if (!card) return null;

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = card.isCommunityDb
      ? `${origin}/watch/${card.id}`
      : `${origin}/?preset=${encodeURIComponent(card.gridPreset)}&streams=${encodeURIComponent(
          card.streams.map((s) => s.videoId).join(",")
        )}`;

    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success(`Copied share link for "${card.title}"`);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="max-w-2xl rounded-2xl border border-zinc-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:rounded-3xl dark:border-zinc-800/90 dark:bg-zinc-950/95"
      >
        <DialogHeader className="space-y-2 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase",
                card.isCommunityDb
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              )}
            >
              {card.badge}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 font-mono text-[10px] text-zinc-600 dark:text-zinc-300"
            >
              <GridPresetIcon preset={card.gridPreset} className="size-3 text-emerald-500" />
              {card.gridPreset} Theater Grid
            </Badge>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Curated by <strong className="text-foreground">{card.author}</strong>
            </span>
          </div>

          <DialogTitle
            id={titleId}
            className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-zinc-100"
          >
            {card.title}
          </DialogTitle>
          <DialogDescription
            id={descId}
            className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400"
          >
            {card.subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Streams List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Synchronized Broadcast Feeds ({card.streams.length})</span>
            <span className="font-mono text-[11px]">Audio Routing: Solo Mixer</span>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {card.streams.map((stream, idx) => {
              const platform = getStreamPlatform(stream.videoId);
              const meta = getStreamPlatformMeta(stream.videoId);
              const directUrl = getStreamExternalUrl(stream.videoId);

              return (
                <div
                  key={`${stream.videoId}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-2.5 transition hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-200 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {stream.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span>ID: {stream.videoId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("px-1.5 py-0 text-[10px] font-bold", meta.badgeClass)}
                    >
                      {platform === "youtube" ? "YouTube" : platform === "twitch" ? "Twitch" : "Kick"}
                    </Badge>
                    <a
                      href={directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Open source stream in new tab"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 rounded-xl text-xs"
          >
            {copiedLink ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy Share URL</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onLaunch(card);
              }}
              className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500"
            >
              <Play className="size-3.5 fill-current" />
              <span>Launch in Studio</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [presetFilter, setPresetFilter] = useState<"All" | GridPreset>("All");
  const [sortBy, setSortBy] = useState<"featured" | "feeds-desc" | "title-asc">("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSpotlight, setShowSpotlight] = useState(true);
  const [inspectCard, setInspectCard] = useState<ExploreCardItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Fullscreen mode is not supported in this browser tab.");
    }
  };

  // Global keyboard shortcuts: "/" to search, "Esc" to clear, "F" for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && isInput) {
        setQuery("");
        searchInputRef.current?.blur();
      } else if (e.key.toLowerCase() === "f" && !isInput) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const cards = useMemo<ExploreCardItem[]>(() => {
    const dbCards: ExploreCardItem[] = communityLayouts.map((layout) => ({
      id: layout.id,
      title: layout.title,
      subtitle: `${layout.streams.length} curated live feeds in ${layout.gridPreset} theater grid`,
      gridPreset: layout.gridPreset,
      streams: layout.streams,
      author: layout.authorName || "Community Director",
      badge: "Community DB",
      category: resolveCardCategory("Community DB", layout.title),
      isCommunityDb: true,
      tags: ["Community", layout.gridPreset],
    }));

    const featuredCards: ExploreCardItem[] = EXPLORE_SHOWCASE_WALLS.map((wall) => ({
      id: wall.id,
      title: wall.title,
      subtitle: wall.subtitle,
      gridPreset: wall.preset,
      streams: wall.streams,
      author: wall.author,
      badge: wall.badge,
      category: resolveCardCategory(wall.badge, wall.title),
      isCommunityDb: false,
      tags: wall.tags,
    }));

    return [...dbCards, ...featuredCards];
  }, [communityLayouts]);

  // Spotlight card: first featured or top wall
  const spotlightCard = useMemo<ExploreCardItem | null>(() => {
    return cards.find((c) => c.id === "space-command") || cards[0] || null;
  }, [cards]);

  // Filtered & Sorted Cards
  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = cards.filter((card) => {
      // Category filter
      if (selectedCategory !== "all" && card.category !== selectedCategory) {
        return false;
      }
      // Preset filter
      if (presetFilter !== "All" && card.gridPreset !== presetFilter) {
        return false;
      }
      // Search query
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.subtitle.toLowerCase().includes(q) ||
        card.author.toLowerCase().includes(q) ||
        card.badge.toLowerCase().includes(q) ||
        card.gridPreset.toLowerCase().includes(q) ||
        card.tags?.some((t) => t.toLowerCase().includes(q)) ||
        card.streams.some(
          (s) =>
            s.label.toLowerCase().includes(q) || s.videoId.toLowerCase().includes(q)
        )
      );
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "feeds-desc") {
        return b.streams.length - a.streams.length;
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      return 0; // "featured" maintains natural order
    });
  }, [cards, query, selectedCategory, presetFilter, sortBy]);

  const totalFeedsCount = useMemo(() => {
    return cards.reduce((acc, c) => acc + c.streams.length, 0);
  }, [cards]);

  const handleLaunchInStudio = (card: ExploreCardItem) => {
    loadLayoutConfig({
      gridPreset: card.gridPreset,
      streams: card.streams,
    });
    toast.success(`Launched "${card.title}" (${card.gridPreset})`);
    router.push("/");
  };

  const handleCopyCardShareLink = (card: ExploreCardItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = card.isCommunityDb
      ? `${origin}/watch/${card.id}`
      : `${origin}/?preset=${encodeURIComponent(card.gridPreset)}&streams=${encodeURIComponent(
          card.streams.map((s) => s.videoId).join(",")
        )}`;

    navigator.clipboard.writeText(shareUrl);
    toast.success(`Copied instant launch URL for "${card.title}"`);
  };

  return (
    <div className="bg-studio-grid relative flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 text-foreground dark:bg-zinc-950">
      {/* Background Radial Glow Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl dark:from-emerald-500/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-[400px] w-[500px] rounded-full bg-gradient-to-t from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl"
      />

      {/* Top Navbar */}
      <header className="relative z-30 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/80 px-4 shadow-2xs backdrop-blur-xl md:px-6 dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-100/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Studio</span>
          </Link>

          <div className="hidden h-5 w-px bg-zinc-200 sm:block dark:bg-zinc-800" />

          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 shadow-xs dark:text-emerald-400">
              <Compass className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-zinc-900 sm:text-sm dark:text-zinc-100">
                  Wall Directory
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.2 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {cards.length} LIVE WALLS
                </span>
              </div>
              <p className="hidden text-[11px] text-zinc-500 sm:block dark:text-zinc-400">
                1-click multi-stream setups curated by directors & community
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Shortcut Pill */}
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            className="hidden items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-100/60 px-2.5 py-1 text-xs text-zinc-500 transition hover:bg-white md:inline-flex dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Search className="size-3.5" />
            <span>Search walls</span>
            <kbd className="rounded border border-zinc-300 bg-zinc-200/80 px-1 font-mono text-[9px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              /
            </kbd>
          </button>

          {/* Fullscreen Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-zinc-100/80 text-zinc-600 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            aria-label={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>

          <ThemeToggle />

          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500 active:scale-98"
          >
            <Tv className="size-3.5" />
            <span className="hidden sm:inline">Open Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area — Full Screen Fluid Width */}
      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:px-6 2xl:px-8">
        <div className="w-full space-y-5 pb-16">
          {/* Hero Header & Live Network Status */}
          <section className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white/95 via-white/80 to-zinc-100/60 p-5 shadow-sm backdrop-blur-xl sm:p-7 dark:border-zinc-800/80 dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/60">
            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl space-y-3 lg:max-w-4xl">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-700 shadow-2xs dark:text-emerald-300">
                  <Sparkles className="size-3" />
                  <span>CURATED MULTIVIEW NETWORK</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl dark:text-zinc-50">
                  Community Wall Directory
                </h1>
                <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  Deploy instant synchronized multi-feed walls across YouTube, Twitch & Kick.
                  Explore 24/7 space and earth cams, lo-fi beat stations, international newsroom
                  matrices, and custom community configurations.
                </p>

                {/* Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-100/70 px-2.5 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                    <Layers className="size-3.5 text-emerald-500" />
                    <span>{cards.length} Curated Walls</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-100/70 px-2.5 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                    <Radio className="size-3.5 text-sky-500" />
                    <span>{totalFeedsCount} Synchronized Feeds</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-100/70 px-2.5 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                    <Volume2 className="size-3.5 text-purple-500" />
                    <span>Solo Audio Switching</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions on Hero */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {spotlightCard && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpotlight((v) => !v)}
                    className="gap-1.5 rounded-xl border-zinc-300 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    <Flame className="size-3.5 text-amber-500" />
                    <span>{showSpotlight ? "Hide Spotlight" : "Show Spotlight"}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push("/")}
                  className="gap-1.5 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Tv className="size-3.5" />
                  <span>Custom Wall</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Spotlight Hero Banner (Optional / Collapsible) */}
          {showSpotlight && spotlightCard && (
            <section className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-zinc-900/90 to-zinc-900/80 p-4 shadow-lg backdrop-blur-md transition-all duration-300 dark:from-emerald-950/30 dark:via-zinc-950/90 dark:to-zinc-950/80 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3 lg:max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                      <Flame className="size-3" />
                      FEATURED SPOTLIGHT
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] text-zinc-400">
                      <GridPresetIcon preset={spotlightCard.gridPreset} className="mr-1 size-3 text-emerald-400" />
                      {spotlightCard.gridPreset}
                    </Badge>
                  </div>

                  <h2 className="text-xl font-black text-white sm:text-2xl">
                    {spotlightCard.title}
                  </h2>
                  <p className="text-xs text-zinc-300 sm:text-sm">
                    {spotlightCard.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {spotlightCard.streams.map((s, i) => (
                      <span
                        key={`spotlight-tag-${i}`}
                        className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-zinc-300 border border-white/10"
                      >
                        {getStreamPlatform(s.videoId) === "youtube" ? (
                          <YouTubeIcon className="size-2.5" />
                        ) : (
                          <TwitchIcon className="size-2.5" />
                        )}
                        <span>{s.label.split("—")[0].trim()}</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleLaunchInStudio(spotlightCard)}
                      className="gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
                    >
                      <Play className="size-3.5 fill-current" />
                      <span>Launch Spotlight Wall</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectCard(spotlightCard)}
                      className="gap-1.5 rounded-xl border-white/20 bg-black/40 text-xs text-zinc-200 hover:bg-white/10 hover:text-white"
                    >
                      <Eye className="size-3.5" />
                      <span>Inspect Feeds</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCardShareLink(spotlightCard)}
                      className="size-8 rounded-xl p-0 text-zinc-400 hover:text-white"
                      title="Copy Share Link"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Preview Thumbnail for Spotlight */}
                <div className="w-full lg:max-w-xl xl:max-w-2xl">
                  <WallMosaicPreview
                    preset={spotlightCard.gridPreset}
                    streams={spotlightCard.streams}
                    onLaunch={() => handleLaunchInStudio(spotlightCard)}
                    onInspect={() => setInspectCard(spotlightCard)}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Interactive Control & Filter Toolbar */}
          <div className="space-y-4 rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-xs backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75 sm:p-5">
            {/* Top Toolbar: Search + Preset Tabs + View Mode */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, stream channel, category, or author... (Press /)"
                  className="h-10 rounded-xl border-zinc-200/90 bg-zinc-50/80 pr-9 pl-9 text-xs shadow-2xs transition focus:border-emerald-500/60 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-emerald-500/50"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Grid Presets Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <Layers className="size-3.5" />
                  Layout:
                </span>
                {PRESET_FILTERS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPresetFilter(preset)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition active:scale-95",
                      presetFilter === preset
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 shadow-2xs dark:text-emerald-300"
                        : "border-zinc-200/90 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                    )}
                  >
                    {preset !== "All" && (
                      <GridPresetIcon preset={preset} className="size-3.5 text-emerald-500" />
                    )}
                    {preset === "All" ? "All Grids" : preset}
                  </button>
                ))}
              </div>

              {/* Sort & View Mode Switch */}
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as typeof sortBy)}
                >
                  <SelectTrigger className="h-9 w-38 rounded-xl border-zinc-200 bg-zinc-50 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="featured">Featured First</SelectItem>
                    <SelectItem value="feeds-desc">Most Feeds</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "flex size-7 cursor-pointer items-center justify-center rounded-lg transition",
                      viewMode === "grid"
                        ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex size-7 cursor-pointer items-center justify-center rounded-lg transition",
                      viewMode === "list"
                        ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    )}
                    title="Compact List View"
                  >
                    <List className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95",
                      isSelected
                        ? cn("border-transparent shadow-xs text-white", cat.id === "all" ? "bg-emerald-600" : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950")
                        : "border-zinc-200/80 bg-zinc-100/70 text-zinc-600 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    <Icon className={cn("size-3.5", isSelected ? "text-inherit" : cat.colorClass)} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Stats Indicator */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Showing <strong className="text-foreground">{filteredCards.length}</strong> of{" "}
              {cards.length} walls
            </span>
            {(query || selectedCategory !== "all" || presetFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("all");
                  setPresetFilter("All");
                }}
                className="cursor-pointer text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Grid View Mode */}
          {viewMode === "grid" && (
            <>
              {filteredCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/70 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    <Sparkles className="size-6 text-zinc-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    No matching stream walls found
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                    We couldn&apos;t find any walls matching your search query or layout filter.
                    Try resetting filters or searching for another keyword.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setSelectedCategory("all");
                      setPresetFilter("All");
                    }}
                    className="mt-4 rounded-xl text-xs"
                  >
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                  {filteredCards.map((card) => {
                    const hasTwitch = card.streams.some(
                      (s) => getStreamPlatform(s.videoId) === "twitch"
                    );
                    const hasYouTube = card.streams.some(
                      (s) => getStreamPlatform(s.videoId) === "youtube"
                    );

                    return (
                      <div
                        key={`${card.isCommunityDb ? "db" : "curated"}-${card.id}`}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:hover:border-emerald-500/35"
                      >
                        <div className="space-y-3.5">
                          {/* Live Dynamic Mosaic Preview */}
                          <WallMosaicPreview
                            preset={card.gridPreset}
                            streams={card.streams}
                            onLaunch={() => handleLaunchInStudio(card)}
                            onInspect={() => setInspectCard(card)}
                          />

                          {/* Card Meta & Header */}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "px-2 py-0 text-[10px] font-bold uppercase",
                                    card.isCommunityDb
                                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  )}
                                >
                                  {card.badge}
                                </Badge>

                                {/* Multi-Platform Badges */}
                                <div className="flex items-center gap-1">
                                  {hasYouTube && (
                                    <span
                                      className="inline-flex items-center rounded bg-red-500/10 p-1 text-red-500"
                                      title="Contains YouTube Live Feeds"
                                    >
                                      <YouTubeIcon className="size-2.5" />
                                    </span>
                                  )}
                                  {hasTwitch && (
                                    <span
                                      className="inline-flex items-center rounded bg-purple-500/10 p-1 text-purple-400"
                                      title="Contains Twitch Live Broadcasts"
                                    >
                                      <TwitchIcon className="size-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>

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

                            {/* Title & Description */}
                            <h3 className="mt-2.5 text-sm font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                              {card.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {card.subtitle}
                            </p>

                            {/* Feeds Chip Tags */}
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {card.streams.slice(0, 3).map((s, idx) => (
                                <span
                                  key={`feed-chip-${idx}`}
                                  className="max-w-[140px] truncate rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
                                >
                                  {s.label.split("—")[0].trim()}
                                </span>
                              ))}
                              {card.streams.length > 3 && (
                                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
                                  +{card.streams.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-4 space-y-2.5 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <User className="size-3 text-zinc-400" />
                              <span className="truncate">{card.author}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              {card.streams.length} feeds
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleLaunchInStudio(card)}
                              className="h-8.5 flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500 active:scale-98"
                            >
                              <Play className="size-3.5 fill-current" />
                              <span>Launch Wall</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setInspectCard(card)}
                              className="h-8.5 size-8.5 rounded-xl border-zinc-200 p-0 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              title="Inspect All Feeds"
                            >
                              <Eye className="size-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCardShareLink(card)}
                              className="h-8.5 size-8.5 rounded-xl border-zinc-200 p-0 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              title="Copy Instant Launch Link"
                            >
                              <Copy className="size-3.5" />
                            </Button>

                            {card.isCommunityDb && (
                              <Link
                                href={`/watch/${card.id}`}
                                className="inline-flex h-8.5 size-8.5 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                title="Open Dedicated Theater Mode"
                              >
                                <ExternalLink className="size-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Compact List View Mode */}
          {viewMode === "list" && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 shadow-xs backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75">
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {filteredCards.map((card) => (
                  <div
                    key={`list-${card.id}`}
                    className="flex flex-col gap-4 p-4 transition hover:bg-zinc-50/80 md:flex-row md:items-center md:justify-between dark:hover:bg-zinc-800/40"
                  >
                    <div className="flex items-center gap-4">
                      {/* Mini Preview */}
                      <div className="w-24 shrink-0 sm:w-28">
                        <WallMosaicPreview
                          preset={card.gridPreset}
                          streams={card.streams}
                          onLaunch={() => handleLaunchInStudio(card)}
                          onInspect={() => setInspectCard(card)}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[9px] font-bold uppercase"
                          >
                            {card.badge}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="gap-1 font-mono text-[9px]"
                          >
                            <GridPresetIcon preset={card.gridPreset} className="size-2.5 text-emerald-500" />
                            {card.gridPreset}
                          </Badge>
                          <span className="font-mono text-[10px] text-zinc-400">
                            by {card.author}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {card.title}
                        </h4>
                        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectCard(card)}
                        className="rounded-xl text-xs"
                      >
                        <Eye className="size-3.5" />
                        <span>Inspect ({card.streams.length})</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleLaunchInStudio(card)}
                        className="gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <Play className="size-3.5 fill-current" />
                        <span>Launch</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Stream Inspector Modal */}
      <StreamInspectorDialog
        card={inspectCard}
        open={Boolean(inspectCard)}
        onOpenChange={(open) => !open && setInspectCard(null)}
        onLaunch={handleLaunchInStudio}
      />
    </div>
  );
}
