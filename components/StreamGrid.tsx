"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Sparkles,
  Play,
  Layers,
  Radio,
  ArrowUpRight,
  Link2,
  Tv,
  Music,
  Globe,
  Orbit,
  Sliders,
  Zap,
  Keyboard,
  Newspaper,
  Gamepad2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StreamPlayer } from "@/components/StreamPlayer";
import { CommandPalette } from "@/components/CommandPalette";
import { FloatingPipDock } from "@/components/FloatingPipDock";
import { BookmarksDialog } from "@/components/BookmarksDialog";
import { StudioTelemetryBar } from "@/components/StudioTelemetryBar";
import { WatchPartyReactions } from "@/components/WatchPartyReactions";
import {
  GRID_PRESET_META,
  GridPresetIcon,
} from "@/components/GridPresetIcon";
import {
  CURATED_LIVE_STREAMS,
  CURATED_WALL_PACKS,
  getAmbilightPalette,
  getStreamPlatform,
  isValidYouTubeVideoId,
} from "@/lib/youtube";
import { useStreamStore } from "@/store/useStreamStore";
import type { GridPreset } from "@/db/schema";
import { cn } from "@/lib/utils";

const PRESET_SLOT_LIMIT: Record<GridPreset, number> = {
  "1x1": 1,
  "1x2": 2,
  "2x2": 4,
  "1+3": 4,
  "3x3": 9,
};

const VALID_PRESETS = new Set<GridPreset>(["1x1", "1x2", "2x2", "1+3", "3x3"]);
const CHANNEL_CATEGORIES = [
  "All",
  "Music",
  "Space",
  "World Cam",
  "News",
  "Twitch",
] as const;

function getGridContainerClasses(
  preset: GridPreset,
  hasFocused: boolean
): string {
  if (hasFocused) {
    switch (preset) {
      case "1x1":
        return "grid-cols-1 grid-rows-1";
      case "1x2":
        return "grid-cols-1 grid-rows-3 md:grid-cols-[var(--stage-main)_1fr] md:grid-rows-1";
      case "2x2":
      case "1+3":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[var(--stage-main)_1fr] lg:grid-rows-3";
      case "3x3":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-fr";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[var(--stage-main)_1fr] lg:grid-rows-3";
    }
  }

  switch (preset) {
    case "1x1":
      return "grid-cols-1 grid-rows-1";
    case "1x2":
      return "grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1";
    case "2x2":
      return "grid-cols-1 sm:grid-cols-2 sm:grid-rows-2";
    case "1+3":
      return "grid-cols-1 lg:grid-cols-[var(--stage-main)_1fr] lg:grid-rows-3";
    case "3x3":
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3";
    default:
      return "grid-cols-1 sm:grid-cols-2 sm:grid-rows-2";
  }
}

function getTileSlotClasses(
  preset: GridPreset,
  index: number,
  isFocusedTile: boolean,
  hasFocused: boolean
): string {
  if (hasFocused) {
    if (isFocusedTile) {
      switch (preset) {
        case "1x2":
          return "order-first row-span-2 md:row-span-1 md:col-span-1 min-h-[220px]";
        case "2x2":
        case "1+3":
          return "order-first sm:col-span-2 lg:col-span-1 lg:row-span-3 min-h-[240px]";
        case "3x3":
          return "order-first sm:col-span-2 sm:row-span-2 min-h-[220px]";
        default:
          return "order-first min-h-[220px]";
      }
    }
    return "col-span-1 row-span-1 min-h-[120px]";
  }

  if (preset === "1+3") {
    if (index === 0) {
      return "lg:col-span-1 lg:row-span-3 min-h-[240px]";
    }
    return "lg:col-span-1 lg:row-span-1 min-h-[140px]";
  }
  return "min-h-[160px]";
}

function getBlueprintGridClasses(preset: GridPreset): string {
  switch (preset) {
    case "1x1":
      return "grid-cols-1 grid-rows-1";
    case "1x2":
      return "grid-cols-2 grid-rows-1";
    case "2x2":
      return "grid-cols-2 grid-rows-2";
    case "1+3":
      return "grid-cols-4 grid-rows-3";
    case "3x3":
      return "grid-cols-3 grid-rows-3";
    default:
      return "grid-cols-2 grid-rows-2";
  }
}

function getCategoryStyle(category: string): {
  gradient: string;
  icon: React.ReactNode;
} {
  switch (category.toLowerCase()) {
    case "space":
      return {
        gradient: "from-sky-600/80 via-indigo-700/80 to-slate-900",
        icon: <Orbit className="size-5 text-sky-200/90" />,
      };
    case "world cam":
      return {
        gradient: "from-amber-600/80 via-rose-700/80 to-zinc-900",
        icon: <Globe className="size-5 text-amber-200/90" />,
      };
    case "news":
      return {
        gradient: "from-rose-600/80 via-red-800/80 to-zinc-900",
        icon: <Newspaper className="size-5 text-rose-200/90" />,
      };
    case "twitch":
      return {
        gradient: "from-purple-600/80 via-violet-800/80 to-zinc-900",
        icon: <Gamepad2 className="size-5 text-purple-200/90" />,
      };
    case "music":
    default:
      return {
        gradient: "from-emerald-600/80 via-teal-700/80 to-zinc-900",
        icon: <Music className="size-5 text-emerald-200/90" />,
      };
  }
}

function ChannelThumbnail({
  videoId,
  label,
  category,
}: {
  videoId: string;
  label: string;
  category: string;
}) {
  const [hasError, setHasError] = useState(false);
  const style = getCategoryStyle(category);
  const isYouTube = getStreamPlatform(videoId) === "youtube";

  return (
    <div
      className={cn(
        "relative h-15 w-26 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br shadow-xs sm:h-16 sm:w-28",
        style.gradient
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-85">
        {style.icon}
      </div>
      {isYouTube && !hasError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt={label}
          loading="lazy"
          onError={() => setHasError(true)}
          className="relative z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span
        className={cn(
          "absolute bottom-1.5 left-1.5 z-30 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase shadow-xs",
          isYouTube ? "bg-red-600/95" : "bg-purple-600/95"
        )}
      >
        <span className="size-1.5 animate-pulse rounded-full bg-white" />
        {isYouTube ? "LIVE" : "TWITCH"}
      </span>
    </div>
  );
}

export function StreamGrid() {
  const streams = useStreamStore((s) => s.streams);
  const gridPreset = useStreamStore((s) => s.gridPreset);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const focusedVideoId = useStreamStore((s) => s.focusedVideoId);
  const autoCycleEnabled = useStreamStore((s) => s.autoCycleEnabled);
  const autoCycleIntervalSec = useStreamStore((s) => s.autoCycleIntervalSec);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const mainStageRatio = useStreamStore((s) => s.mainStageRatio);
  const ambilightEnabled = useStreamStore((s) => s.ambilightEnabled);

  const addStream = useStreamStore((s) => s.addStream);
  const setGridPreset = useStreamStore((s) => s.setGridPreset);
  const loadStarterStreams = useStreamStore((s) => s.loadStarterStreams);
  const loadWallPack = useStreamStore((s) => s.loadWallPack);
  const loadLayoutConfig = useStreamStore((s) => s.loadLayoutConfig);
  const promoteToMain = useStreamStore((s) => s.promoteToMain);
  const reorderStreams = useStreamStore((s) => s.reorderStreams);
  const triggerSyncAllLive = useStreamStore((s) => s.triggerSyncAllLive);
  const cycleNextStream = useStreamStore((s) => s.cycleNextStream);
  const setShortcutsOpen = useStreamStore((s) => s.setShortcutsOpen);
  const setMainStageRatio = useStreamStore((s) => s.setMainStageRatio);
  const setSplitterDragging = useStreamStore((s) => s.setSplitterDragging);

  const [customUrl, setCustomUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isStageResizing, setIsStageResizing] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isStageResizing) return;

    const onPointerMove = (e: PointerEvent) => {
      const container = gridContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setMainStageRatio(pct);
    };

    const onPointerUp = () => {
      setIsStageResizing(false);
      setSplitterDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isStageResizing, setMainStageRatio, setSplitterDragging]);

  // Read instant-share ?streams=...&preset=... from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const streamsParam = params.get("streams");
    const presetParam = params.get("preset") as GridPreset | null;

    if (streamsParam) {
      const ids = streamsParam
        .split(",")
        .map((id) => id.trim())
        .filter(isValidYouTubeVideoId)
        .slice(0, 9);

      if (ids.length > 0) {
        const nextPreset: GridPreset =
          presetParam && VALID_PRESETS.has(presetParam)
            ? presetParam
            : ids.length === 1
              ? "1x1"
              : ids.length === 2
                ? "1x2"
                : ids.length <= 4
                  ? "2x2"
                  : "3x3";

        loadLayoutConfig({
          gridPreset: nextPreset,
          streams: ids.map((id, idx) => {
            const matched = CURATED_LIVE_STREAMS.find((c) => c.videoId === id);
            return {
              videoId: id,
              label: matched?.label ?? `Shared Feed #${idx + 1} (${id})`,
            };
          }),
        });
        toast.success(`Loaded ${ids.length} shared streams (${nextPreset})`);
      }

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [loadLayoutConfig]);

  // Auto-Cycle Carousel Mode timer
  useEffect(() => {
    if (!autoCycleEnabled || streams.length <= 1) return;
    const intervalId = window.setInterval(() => {
      cycleNextStream();
    }, autoCycleIntervalSec * 1000);
    return () => window.clearInterval(intervalId);
  }, [autoCycleEnabled, autoCycleIntervalSec, streams.length, cycleNextStream]);

  // Tab Visibility Eco Saver notice
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        ecoModeEnabled &&
        streams.length > 0
      ) {
        triggerSyncAllLive();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [ecoModeEnabled, streams.length, triggerSyncAllLive]);

  const filteredCuratedStreams = useMemo(() => {
    if (selectedCategory === "All") return CURATED_LIVE_STREAMS;
    return CURATED_LIVE_STREAMS.filter(
      (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory]);

  const maxSlots = PRESET_SLOT_LIMIT[gridPreset];
  const visibleStreams = streams.slice(0, maxSlots);
  const hiddenStreams = streams.slice(maxSlots);
  const emptySlotCount = Math.max(0, maxSlots - visibleStreams.length);
  const hasFocusedStream = Boolean(
    focusedVideoId &&
      visibleStreams.length > 1 &&
      visibleStreams.some((s) => s.videoId === focusedVideoId)
  );

  const selectedPresetMeta =
    GRID_PRESET_META.find((p) => p.value === gridPreset) ?? GRID_PRESET_META[2];

  const handleHeroAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) {
      toast.error(
        "Paste a YouTube, Twitch, Kick URL, @handle, or 11-char Video ID."
      );
      return;
    }
    const res = addStream(customUrl);
    if (!res.success) {
      toast.error(res.error || "Invalid stream URL or ID");
      return;
    }
    toast.success(`Added stream (${res.videoId}) to grid`);
    setCustomUrl("");
  };

  const handleDragStartTile = (idx: number) => {
    setDraggedIndex(idx);
    setDragOverIndex(idx);
  };

  const handleDragOverTile = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDropTile = (targetIdx: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIdx) {
      reorderStreams(draggedIndex, targetIdx);
      toast.info(`Swapped Stream #0${draggedIndex + 1} ↔ #0${targetIdx + 1}`);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEndTile = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Full-Viewport 12-Column Broadcast Studio Dashboard when no streams are active
  if (streams.length === 0) {
    return (
      <div className="bg-studio-grid relative flex h-[calc(100vh-4rem)] w-full flex-1 flex-col overflow-y-auto bg-zinc-50/80 px-4 py-4 transition-colors duration-200 sm:px-6 sm:py-5 lg:overflow-hidden lg:px-7 lg:py-5 dark:bg-zinc-950">
        {/* Ambient radial theater glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/12 via-sky-500/5 to-transparent dark:from-emerald-500/15 dark:via-sky-500/5 dark:to-transparent" />

        <div className="relative z-10 grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          {/* LEFT 7-8 COLUMNS: Hero Command Panel + Interactive Stage Blueprint + Themed Wall Packs */}
          <div className="flex flex-col justify-between gap-3.5 lg:col-span-7 xl:col-span-8 lg:min-h-0">
            {/* 1. Full-Width Hero & Quick-Add Command Card */}
            <section className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl sm:p-6 dark:border-zinc-800/90 dark:bg-zinc-900/75">
              <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />

              {/* Telemetry Header */}
              <div className="relative flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                  <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Multi-Platform Broadcast Engine</span>
                  <span className="opacity-40">•</span>
                  <span className="font-mono">YT + Twitch + Kick</span>
                </div>

                <div className="hidden items-center gap-3 font-mono text-[11px] text-zinc-500 sm:flex dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Drag-and-Drop Grid
                  </span>
                  <span className="opacity-40">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sliders className="size-3 text-sky-600 dark:text-sky-400" />
                    Pro Audio Mixer
                  </span>
                </div>
              </div>

              {/* Headline + Copy */}
              <div className="relative mt-3.5">
                <h1 className="bg-gradient-to-br from-zinc-950 via-zinc-800 to-zinc-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl xl:text-4xl dark:from-white dark:via-zinc-100 dark:to-zinc-400">
                  Multi-Stream Command Center
                </h1>
                <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  Paste any YouTube, Twitch (
                  <code className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    twitch.tv/...
                  </code>
                  ), Kick link, or{" "}
                  <code className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    @nasa
                  </code>{" "}
                  /{" "}
                  <code className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    @lofigirl
                  </code>{" "}
                  handle—or launch a curated wall pack below.
                </p>
              </div>

              {/* Inline Quick-Add Form + Instant Wall Launchers */}
              <div className="relative mt-4 flex flex-col gap-2.5 xl:flex-row xl:items-center">
                <form
                  onSubmit={handleHeroAddSubmit}
                  className="flex flex-1 items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                    <Input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="Paste YouTube / Twitch / Kick URL, ID, or @handle (e.g. @nasa)..."
                      className="h-10 w-full rounded-xl border-zinc-200/90 bg-zinc-50/90 pr-3 pl-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-500 focus-visible:bg-white sm:text-sm dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:bg-zinc-950"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 shrink-0 gap-1.5 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    <Plus className="size-4" />
                    <span>Add Feed</span>
                  </Button>
                </form>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      loadStarterStreams();
                      toast.success("Loaded 4-Stream Command Wall (1+3 Preset)");
                    }}
                    className="h-10 gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-xs font-semibold text-white shadow-md shadow-emerald-500/15 transition hover:from-emerald-500 hover:to-teal-500"
                  >
                    <Play className="size-3.5 fill-current" />
                    Launch 4-Stream Demo (1+3)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      loadStarterStreams();
                      setGridPreset("2x2");
                      toast.success("Loaded 4-Stream Quad Matrix (2x2)");
                    }}
                    className="h-10 gap-1.5 rounded-xl border-zinc-200/90 bg-zinc-100/70 px-3.5 text-xs font-semibold text-zinc-700 hover:border-emerald-500/40 hover:bg-white hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:border-emerald-500/40 dark:hover:bg-zinc-900 dark:hover:text-emerald-300"
                  >
                    <GridPresetIcon preset="2x2" className="size-3.5" />
                    2x2 Quad
                  </Button>
                </div>
              </div>
            </section>

            {/* 2. Interactive Stage Architecture Blueprint & Preset Deck */}
            <section className="flex flex-1 flex-col justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl sm:p-5 dark:border-zinc-800/90 dark:bg-zinc-900/75">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Layers className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold tracking-wide text-zinc-900 uppercase dark:text-zinc-100">
                      Stage Architecture & Grid Presets
                    </h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Select a layout geometry — click any blueprint slot to
                      launch a feed
                    </p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="gap-1.5 bg-zinc-100 px-2.5 py-1 font-mono text-[11px] text-emerald-700 dark:bg-zinc-800 dark:text-emerald-300"
                >
                  <GridPresetIcon preset={gridPreset} className="size-3.5" />
                  {selectedPresetMeta.label} ({selectedPresetMeta.capacity}{" "}
                  {selectedPresetMeta.capacity === 1 ? "Slot" : "Slots"})
                </Badge>
              </div>

              {/* 5 Preset Cards + Live Stage Blueprint */}
              <div className="grid flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:col-span-7 xl:grid-cols-5">
                  {GRID_PRESET_META.map((preset) => {
                    const isSelected = gridPreset === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setGridPreset(preset.value);
                          toast.info(`Selected ${preset.label}`);
                        }}
                        className={cn(
                          "group flex flex-col items-center justify-center gap-2 rounded-xl border p-2.5 text-center transition-all duration-150",
                          isSelected
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 shadow-xs ring-1 ring-emerald-500/30 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "border-zinc-200/90 bg-zinc-50/70 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                        )}
                      >
                        <GridPresetIcon
                          preset={preset.value}
                          className={cn(
                            "size-5 transition-transform duration-150 group-hover:scale-110",
                            isSelected
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-zinc-500 dark:text-zinc-400"
                          )}
                        />
                        <div>
                          <div className="font-mono text-xs font-bold">
                            {preset.value}
                          </div>
                          <div className="text-[10px] font-medium opacity-75">
                            {preset.capacity}{" "}
                            {preset.capacity === 1 ? "Feed" : "Feeds"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Interactive Stage Blueprint */}
                <div className="flex flex-col rounded-xl border border-zinc-200/90 bg-zinc-100/70 p-2.5 xl:col-span-5 dark:border-zinc-800/90 dark:bg-zinc-950/70">
                  <div
                    className={cn(
                      "grid min-h-[104px] flex-1 gap-1.5",
                      getBlueprintGridClasses(gridPreset)
                    )}
                  >
                    {Array.from({ length: selectedPresetMeta.capacity }).map(
                      (_, idx) => {
                        const curated =
                          CURATED_LIVE_STREAMS[
                            idx % CURATED_LIVE_STREAMS.length
                          ];
                        const isMain = gridPreset === "1+3" && idx === 0;
                        return (
                          <button
                            key={`blueprint-slot-${idx}`}
                            type="button"
                            onClick={() => {
                              const res = addStream(
                                curated.videoId,
                                curated.label
                              );
                              if (res.success) {
                                toast.success(`Added "${curated.label}"`);
                              }
                            }}
                            className={cn(
                              "group/slot flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300/90 bg-white/80 p-1.5 text-center transition hover:border-emerald-500/60 hover:bg-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10",
                              isMain && "col-span-3 row-span-3"
                            )}
                            title={`Click to launch "${curated.label}"`}
                          >
                            <span className="font-mono text-[10px] font-bold text-zinc-500 group-hover/slot:text-emerald-600 dark:text-zinc-400 dark:group-hover/slot:text-emerald-300">
                              {isMain ? "MAIN STAGE 01" : `0${idx + 1}`}
                            </span>
                            {(isMain ||
                              selectedPresetMeta.capacity <= 4) && (
                              <span className="mt-0.5 max-w-full truncate px-1 text-[9px] text-zinc-400 group-hover/slot:text-emerald-700 dark:text-zinc-500 dark:group-hover/slot:text-emerald-300">
                                + {curated.label.split("—")[0].trim()}
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Themed Multi-Wall Packs (1-Click Launchers) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CURATED_WALL_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => {
                    loadWallPack(pack.streams, pack.preset);
                    toast.success(`Launched "${pack.title}" (${pack.preset})`);
                  }}
                  className="group flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-white/85 p-3.5 text-left shadow-2xs backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-white hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-900/65 dark:hover:border-emerald-500/50 dark:hover:bg-zinc-900"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {pack.badge}
                    </Badge>
                    <span className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-emerald-500">
                      {pack.preset}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-emerald-300">
                      <Play className="size-3 fill-current text-emerald-500" />
                      {pack.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {pack.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT 4-5 COLUMNS: Full-Height 24/7 Curated Live Channels Dock with Category Filter */}
          <aside className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-xl lg:col-span-5 xl:col-span-4 dark:border-zinc-800/90 dark:bg-zinc-900/75">
            {/* Dock Header */}
            <div className="border-b border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/90">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                    <Tv className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold tracking-wide text-zinc-900 uppercase dark:text-zinc-100">
                        24/7 Live Directory
                      </h2>
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      YouTube & Twitch instant feeds
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    loadStarterStreams();
                    toast.success("Loaded 4 curated live feeds");
                  }}
                  className="gap-1 rounded-lg border-emerald-500/35 bg-emerald-500/10 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <Play className="size-3 fill-current" />
                  Load Top 4
                </Button>
              </div>

              {/* Category Filter Pills */}
              <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-0.5">
                {CHANNEL_CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition",
                        isActive
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
                      )}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Channel Cards List */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5 sm:p-4">
              {filteredCuratedStreams.map((item, idx) => (
                <div
                  key={item.videoId}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-2.5 transition-all duration-200 hover:border-emerald-500/50 hover:bg-white hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:border-emerald-500/50 dark:hover:bg-zinc-900"
                >
                  <ChannelThumbnail
                    videoId={item.videoId}
                    label={item.label}
                    category={item.category}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        CH 0{idx + 1}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4 rounded bg-zinc-200/80 px-1.5 py-0 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {item.category}
                      </Badge>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {item.handle}
                      </span>
                    </div>

                    <div className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-emerald-300">
                      {item.label}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => {
                        const res = addStream(item.videoId, item.label);
                        if (res.success) {
                          toast.success(`Added "${item.label}"`);
                        }
                      }}
                      className="h-7 gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>

                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        const res = addStream(item.videoId, item.label);
                        if (res.success) {
                          setGridPreset("1x1");
                          toast.success(`Watching "${item.label}" in 1x1`);
                        }
                      }}
                      className="h-6 rounded-lg border-zinc-200/90 bg-white px-2 text-[10px] font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                    >
                      Watch 1x1
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dock Footer Hint */}
            <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/70 px-4 py-2 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400">
              <span>
                Press{" "}
                <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  /
                </kbd>{" "}
                to add URL
              </span>
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
              >
                <Keyboard className="size-3" />
                Shortcuts (
                <kbd className="font-mono text-[10px]">?</kbd>)
              </button>
            </div>
          </aside>
        </div>

        {/* Global Studio Overlays */}
        <CommandPalette />
        <FloatingPipDock />
        <BookmarksDialog />
        <WatchPartyReactions />
      </div>
    );
  }

  const leadStreamId =
    (hasFocusedStream ? focusedVideoId : visibleStreams[0]?.videoId) ??
    visibleStreams[0]?.videoId ??
    "";
  const ambilight = getAmbilightPalette(leadStreamId);
  const showResizableStageSplitter =
    (gridPreset === "1+3" && !hasFocusedStream) ||
    (hasFocusedStream &&
      (gridPreset === "1x2" || gridPreset === "2x2" || gridPreset === "1+3"));

  return (
    <div className="bg-studio-grid relative flex h-[calc(100vh-4rem)] w-full flex-1 flex-col overflow-hidden bg-zinc-100/80 p-1.5 transition-colors duration-200 sm:p-2 dark:bg-zinc-950">
      {/* Dynamic Ambilight Theater Glow Layer */}
      {ambilightEnabled && leadStreamId && (
        <div
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at 28% 38%, ${ambilight.primary}, transparent 58%), radial-gradient(circle at 75% 68%, ${ambilight.secondary}, transparent 60%)`,
          }}
          className="pointer-events-none absolute inset-0 z-0 opacity-90 transition-all duration-1000"
        />
      )}

      {/* Main Responsive CSS Grid */}
      <div
        ref={gridContainerRef}
        style={
          {
            "--stage-main": `${mainStageRatio}%`,
          } as React.CSSProperties
        }
        className={cn(
          "relative z-10 grid h-full w-full flex-1 gap-1.5 overflow-hidden sm:gap-2",
          getGridContainerClasses(gridPreset, hasFocusedStream)
        )}
      >
        {/* Draggable Main Stage Vertical Splitter (1+3 & Solo Focus desktop layouts) */}
        {showResizableStageSplitter && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Main Stage split (double-click to reset)"
            style={{ left: `calc(${mainStageRatio}% - 4px)` }}
            onPointerDown={(e) => {
              e.preventDefault();
              setIsStageResizing(true);
              setSplitterDragging(true);
            }}
            onDoubleClick={() => {
              setMainStageRatio(70);
              toast.info("Reset Main Stage split ratio to 70%");
            }}
            title="Drag to resize Main Stage vs side feeds (double-click to reset)"
            className={cn(
              "group/split absolute inset-y-2 z-30 hidden w-2.5 cursor-col-resize items-center justify-center lg:flex",
              isStageResizing && "bg-emerald-500/15"
            )}
          >
            <div
              className={cn(
                "h-14 w-1 rounded-full transition-all",
                isStageResizing
                  ? "h-28 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  : "bg-white/30 opacity-0 group-hover/split:bg-emerald-400 group-hover/split:opacity-100"
              )}
            />
          </div>
        )}
        {visibleStreams.map((stream, index) => {
          const isFocusedTile =
            hasFocusedStream && stream.videoId === focusedVideoId;
          return (
            <div
              key={stream.videoId}
              className={cn(
                "relative h-full w-full overflow-hidden",
                getTileSlotClasses(
                  gridPreset,
                  index,
                  isFocusedTile,
                  hasFocusedStream
                )
              )}
            >
              <StreamPlayer
                stream={stream}
                index={index}
                isMainSlot={hasFocusedStream ? isFocusedTile : index === 0}
                isAsymmetricLayout={gridPreset === "1+3" || hasFocusedStream}
                isDragging={draggedIndex === index}
                isDragOver={
                  dragOverIndex === index &&
                  draggedIndex !== null &&
                  draggedIndex !== index
                }
                anyTileDragging={draggedIndex !== null}
                onDragStartTile={handleDragStartTile}
                onDragOverTile={handleDragOverTile}
                onDropTile={handleDropTile}
                onDragEndTile={handleDragEndTile}
              />
            </div>
          );
        })}

        {/* Empty Grid Slot Placeholders when active streams < preset capacity */}
        {Array.from({ length: emptySlotCount }).map((_, idx) => {
          const slotIndex = visibleStreams.length + idx;
          const unusedCurated = CURATED_LIVE_STREAMS.filter(
            (c) => !streams.some((s) => s.videoId === c.videoId)
          );
          const nextSuggestion =
            unusedCurated[idx % Math.max(1, unusedCurated.length)];

          return (
            <div
              key={`empty-slot-${slotIndex}`}
              className={cn(
                "group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300/90 bg-white/60 p-4 text-center backdrop-blur-xs transition-all duration-200 hover:border-emerald-500/50 hover:bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-900/25 dark:hover:border-emerald-500/40 dark:hover:bg-zinc-900/45",
                getTileSlotClasses(
                  gridPreset,
                  slotIndex,
                  false,
                  hasFocusedStream
                )
              )}
            >
              <div className="flex items-center gap-1.5 rounded-full border border-zinc-200/90 bg-zinc-100/90 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <Radio className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span>SLOT 0{slotIndex + 1}</span>
              </div>

              <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Available Broadcast Slot
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                Paste a YouTube, Twitch, or Kick link above
              </p>

              {nextSuggestion && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const res = addStream(
                      nextSuggestion.videoId,
                      nextSuggestion.label
                    );
                    if (res.success) {
                      toast.success(`Added "${nextSuggestion.label}"`);
                    }
                  }}
                  className="mt-3 gap-1.5 rounded-lg border-zinc-200/90 bg-white text-[11px] font-medium text-zinc-700 shadow-2xs hover:border-emerald-500/50 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
                >
                  <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Quick Fill: {nextSuggestion.label.split("—")[0].trim()}
                  </span>
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Overflow Standby Bar if current preset shows fewer slots than total loaded streams */}
      {hiddenStreams.length > 0 && (
        <div className="mt-1.5 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/90 bg-white/90 px-3.5 py-1.5 text-xs shadow-sm backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span className="flex size-2 rounded-full bg-amber-500" />
            <span>
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {hiddenStreams.length}
              </strong>{" "}
              standby feed{hiddenStreams.length > 1 ? "s" : ""} outside{" "}
              <Badge
                variant="secondary"
                className="bg-zinc-200/80 px-1.5 py-0 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {gridPreset}
              </Badge>{" "}
              viewport:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hiddenStreams.map((s) => {
              const hasAudio = unmutedVideoIds.includes(s.videoId);
              return (
                <Button
                  key={s.videoId}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    promoteToMain(s.videoId);
                    toast.info(`Promoted "${s.label}" into active stage`);
                  }}
                  className={cn(
                    "gap-1.5 rounded-lg text-[11px] font-medium transition",
                    hasAudio
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-500/50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
                  )}
                >
                  <ArrowUpRight className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="max-w-[160px] truncate">{s.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Broadcast Telemetry, World Clocks & Automation Control Strip */}
      <div className="relative z-10">
        <StudioTelemetryBar />
      </div>

      {/* Global Studio Overlays */}
      <CommandPalette />
      <FloatingPipDock />
      <BookmarksDialog />
      <WatchPartyReactions />
    </div>
  );
}
