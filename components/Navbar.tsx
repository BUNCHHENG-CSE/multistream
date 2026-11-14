"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tv,
  Plus,
  VolumeX,
  MessageSquare,
  Trash2,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  X,
  Link2,
  Play,
  RefreshCw,
  Compass,
  Command,
  MoreHorizontal,
  Keyboard,
  Bookmark,
  Leaf,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SaveLayoutDialog } from "@/components/SaveLayoutDialog";
import { SavedLayoutsDrawer } from "@/components/SavedLayoutsDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  GRID_PRESET_META,
  GridPresetIcon,
} from "@/components/GridPresetIcon";
import { AudioMixerSheet } from "@/components/AudioMixerSheet";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { ShareExportDialog } from "@/components/ShareExportDialog";
import {
  CURATED_LIVE_STREAMS,
  CURATED_WALL_PACKS,
  getStreamPlatformMeta,
} from "@/lib/youtube";
import { useStreamStore } from "@/store/useStreamStore";
import type { GridPreset, SavedLayout } from "@/db/schema";
import { cn } from "@/lib/utils";

interface NavbarProps {
  initialUser: { id: string; name: string; email: string } | null;
  initialLayouts: SavedLayout[];
  githubAuthEnabled?: boolean;
}

export function Navbar({
  initialUser,
  initialLayouts,
  githubAuthEnabled = false,
}: NavbarProps) {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);
  const [currentUser, setCurrentUser] = useState(initialUser);
  if (
    initialUser?.id !== prevInitialUser?.id ||
    initialUser?.email !== prevInitialUser?.email
  ) {
    setPrevInitialUser(initialUser);
    setCurrentUser(initialUser);
  }

  const [prevInitialLayouts, setPrevInitialLayouts] = useState(initialLayouts);
  const [savedLayouts, setSavedLayouts] =
    useState<SavedLayout[]>(initialLayouts);
  if (initialLayouts !== prevInitialLayouts) {
    setPrevInitialLayouts(initialLayouts);
    setSavedLayouts(initialLayouts);
  }
  const [isFullscreen, setIsFullscreen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const streams = useStreamStore((s) => s.streams);
  const gridPreset = useStreamStore((s) => s.gridPreset);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const isChatOpen = useStreamStore((s) => s.isChatOpen);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const bookmarks = useStreamStore((s) => s.bookmarks);

  const addStream = useStreamStore((s) => s.addStream);
  const setGridPreset = useStreamStore((s) => s.setGridPreset);
  const toggleGlobalAudio = useStreamStore((s) => s.toggleGlobalAudio);
  const toggleChat = useStreamStore((s) => s.toggleChat);
  const clearAllStreams = useStreamStore((s) => s.clearAllStreams);
  const loadStarterStreams = useStreamStore((s) => s.loadStarterStreams);
  const loadWallPack = useStreamStore((s) => s.loadWallPack);
  const triggerSyncAllLive = useStreamStore((s) => s.triggerSyncAllLive);
  const setCommandPaletteOpen = useStreamStore((s) => s.setCommandPaletteOpen);
  const setShortcutsOpen = useStreamStore((s) => s.setShortcutsOpen);
  const setBookmarksOpen = useStreamStore((s) => s.setBookmarksOpen);
  const setEcoMode = useStreamStore((s) => s.setEcoMode);

  // Global "/" shortcut to focus the URL input bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.shiftKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !(document.activeElement as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleAddStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast.error(
        "Please paste a YouTube, Twitch, Kick URL, @handle, or Video ID."
      );
      return;
    }

    const result = addStream(urlInput);
    if (!result.success) {
      toast.error(result.error || "Invalid stream URL or ID");
      return;
    }

    toast.success(`Added stream (${result.videoId}) to grid`);
    setUrlInput("");
  };

  const selectedPresetMeta =
    GRID_PRESET_META.find((p) => p.value === gridPreset) ?? GRID_PRESET_META[2];

  const hasActiveAudio = unmutedVideoIds.length > 0;

  return (
    <header className="relative z-30 flex min-h-14 w-full shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-zinc-200/80 bg-white/85 px-2.5 py-1.5 shadow-2xs backdrop-blur-xl transition-colors duration-200 md:h-15 md:flex-nowrap md:px-3 md:py-0 lg:px-4 dark:border-zinc-800/80 dark:bg-zinc-950/90">
      {/* Subtle top highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent" />

      {/* Left: Brand Logo & Quick Navigation */}
      <div className="order-1 flex shrink-0 items-center gap-1.5 lg:gap-2">
        <Link
          href="/"
          className="group flex items-center gap-2 text-zinc-900 transition hover:opacity-95 dark:text-zinc-100"
        >
          <div className="relative flex size-8.5 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/20 text-emerald-600 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:border-emerald-500/35 dark:text-emerald-400">
            <Tv className="size-4" />
            {streams.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
              </span>
            )}
          </div>
          <div className="flex flex-col md:hidden lg:flex">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                TCT MultiStream
              </span>
              <span className="hidden rounded bg-emerald-500/15 px-1.5 py-0.2 font-mono text-[9px] font-semibold tracking-wider text-emerald-700 uppercase xl:inline-block dark:bg-emerald-500/15 dark:text-emerald-300">
                PRO
              </span>
            </div>
            <span className="hidden text-[10px] leading-tight font-medium whitespace-nowrap text-zinc-500 2xl:block dark:text-zinc-400">
              Broadcast Command Center
            </span>
          </div>
        </Link>

        {/* Active Stream Capacity Pill */}
        <div
          title={`${streams.length} of 9 stream slots active`}
          className="hidden items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-zinc-100/80 px-2 py-1 text-[11px] font-medium text-zinc-700 xl:inline-flex dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-300"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              streams.length > 0
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                : "bg-zinc-400 dark:bg-zinc-600"
            )}
          />
          <span className="font-mono text-[10px] font-semibold">
            {streams.length}/9
          </span>
        </div>

        {/* Explore Community Directory */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/explore"
                aria-label="Browse Explore Community Walls"
                className="hidden h-8 items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-zinc-100/70 px-2 text-[11px] font-medium text-zinc-700 transition hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-indigo-600 lg:inline-flex 2xl:px-2.5 dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
              />
            }
          >
            <Compass className="size-3.5 text-indigo-500" />
            <span className="hidden 2xl:inline">Explore</span>
          </TooltipTrigger>
          <TooltipContent>Browse Explore Community Walls</TooltipContent>
        </Tooltip>

        {/* Spotlight Command Palette Trigger */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Open Spotlight Command Palette"
                className="hidden h-8 items-center gap-1 rounded-lg border border-zinc-200/90 bg-zinc-100/70 px-2 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-200/70 hover:text-zinc-900 sm:inline-flex dark:border-zinc-800/90 dark:bg-zinc-900/70 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              />
            }
          >
            <Command className="size-3" />
            <kbd className="font-mono text-[10px]">K</kbd>
          </TooltipTrigger>
          <TooltipContent>
            Spotlight Command Palette (Ctrl+K / ⌘K)
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Center: Multi-Platform Command Input Bar + 24/7 Quick Channels Menu */}
      <form
        onSubmit={handleAddStreamSubmit}
        className="order-3 flex w-full items-center gap-1.5 md:order-2 md:mx-1 md:w-auto md:max-w-md md:min-w-[200px] md:flex-1 lg:mx-2 lg:max-w-lg lg:min-w-[260px] xl:max-w-xl xl:min-w-[320px] 2xl:max-w-2xl"
      >
        <div className="group/input relative flex min-w-0 flex-1 items-center">
          <Link2 className="pointer-events-none absolute left-2.5 size-3.5 text-zinc-400 transition-colors group-focus-within/input:text-emerald-600 dark:text-zinc-500 dark:group-focus-within/input:text-emerald-400" />
          <Input
            ref={inputRef}
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste stream URL, ID, or @channel (e.g. @nasa)..."
            className="h-8 w-full min-w-0 rounded-lg border-zinc-200/90 bg-zinc-100/75 pr-8 pl-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-500/60 focus-visible:bg-white focus-visible:ring-emerald-500/20 sm:pr-9 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:bg-zinc-900"
          />
          {urlInput ? (
            <button
              type="button"
              onClick={() => {
                setUrlInput("");
                inputRef.current?.focus();
              }}
              aria-label="Clear URL input"
              className="absolute right-1.5 flex size-5 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 hidden h-5 items-center rounded border border-zinc-200 bg-white px-1.5 font-mono text-[10px] font-medium text-zinc-400 shadow-2xs sm:inline-flex dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
              /
            </kbd>
          )}
        </div>

        {/* Submit Add Stream */}
        <Button
          type="submit"
          size="sm"
          className="h-8 shrink-0 gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 text-xs font-semibold text-white shadow-xs transition hover:from-emerald-500 hover:to-teal-500 sm:px-3"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add</span>
        </Button>

        {/* Quick 24/7 Channels & Packs Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 rounded-lg border-zinc-200/90 bg-zinc-100/80 px-2 text-xs font-medium text-zinc-700 hover:border-emerald-500/40 hover:bg-white hover:text-emerald-700 xl:px-2.5 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-emerald-500/40 dark:hover:bg-zinc-800 dark:hover:text-emerald-300"
                    />
                  }
                >
                  <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Channels</span>
                </DropdownMenuTrigger>
              }
            />
            <TooltipContent>
              Quick-add curated YouTube & Twitch live channels & wall packs
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="end"
            className="max-h-[75vh] w-80 overflow-y-auto rounded-xl border border-zinc-200/90 bg-white/95 p-1.5 text-zinc-900 shadow-xl backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:text-zinc-100"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                <span>Instant Multi-Wall Packs</span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  1-Click
                </span>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  loadStarterStreams();
                  toast.success("Loaded 4-Stream Command Wall (1+3 Preset)");
                }}
                className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-emerald-700 focus:bg-emerald-500/10 focus:text-emerald-700 dark:text-emerald-300 dark:focus:bg-emerald-500/15 dark:focus:text-emerald-300"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Play className="size-3 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Launch 4-Stream Demo Wall</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Populates 4 curated feeds in 1+3 mode
                  </div>
                </div>
              </DropdownMenuItem>
              {CURATED_WALL_PACKS.map((pack) => (
                <DropdownMenuItem
                  key={pack.id}
                  onClick={() => {
                    loadWallPack(pack.streams, pack.preset);
                    toast.success(`Launched "${pack.title}" (${pack.preset})`);
                  }}
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{pack.title}</span>
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        {pack.preset}
                      </span>
                    </div>
                    <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                      {pack.subtitle}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 bg-zinc-200/80 dark:bg-zinc-800/80" />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                24/7 Curated Broadcasts (@handles)
              </DropdownMenuLabel>
              {CURATED_LIVE_STREAMS.map((item) => {
                const isAlreadyActive = streams.some(
                  (s) => s.videoId === item.videoId
                );
                const meta = getStreamPlatformMeta(item.videoId);
                return (
                  <DropdownMenuItem
                    key={item.videoId}
                    disabled={isAlreadyActive}
                    onClick={() => {
                      const res = addStream(item.videoId, item.label);
                      if (res.success) {
                        toast.success(`Added "${item.label}"`);
                      } else if (res.error) {
                        toast.error(res.error);
                      }
                    }}
                    className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.label}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono font-semibold">
                          {meta.shortLabel}
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {item.handle}
                        </span>
                      </div>
                    </div>
                    {isAlreadyActive ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" />
                        Active
                      </span>
                    ) : (
                      <Plus className="size-3.5 text-zinc-400" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </form>

      {/* Right: Visual Layout Switcher, Audio Master, Mixer, Share, Cloud Layouts, Tools, Theme & Chat */}
      <div className="order-2 flex shrink-0 items-center gap-1 md:order-3 lg:gap-1.5">
        {/* Ultra-Wide Inline Visual Grid Switcher (1680px+) */}
        <div
          role="group"
          aria-label="Grid layout preset"
          className="hidden items-center rounded-lg border border-zinc-200/90 bg-zinc-100/90 p-0.5 shadow-2xs min-[1680px]:inline-flex dark:border-zinc-800/90 dark:bg-zinc-900/90"
        >
          {GRID_PRESET_META.map((option) => {
            const isSelected = gridPreset === option.value;
            return (
              <Tooltip key={option.value}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setGridPreset(option.value)}
                      aria-pressed={isSelected}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all duration-150",
                        isSelected
                          ? "bg-white text-emerald-700 shadow-xs ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-emerald-300 dark:ring-white/10"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      )}
                    />
                  }
                >
                  <GridPresetIcon preset={option.value} />
                  <span className="font-mono text-[10px] font-semibold">
                    {option.value}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-[10px] opacity-80">
                    {option.description}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Compact Grid Preset Select (<1680px) */}
        <div className="min-[1680px]:hidden">
          <Select
            value={gridPreset}
            onValueChange={(value) => {
              if (value) {
                setGridPreset(value as GridPreset);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-[88px] rounded-lg border-zinc-200/90 bg-zinc-100/80 px-2 text-xs text-zinc-900 sm:w-[114px] sm:px-2.5 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-100"
            >
              <GridPresetIcon
                preset={gridPreset}
                className="shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <SelectValue placeholder="Grid">
                <span className="truncate font-mono text-[11px] sm:font-sans sm:text-xs">
                  <span className="sm:hidden">{gridPreset}</span>
                  <span className="hidden sm:inline">
                    {selectedPresetMeta.shortLabel}
                  </span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              {GRID_PRESET_META.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <GridPresetIcon
                      preset={option.value}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Global Audio Master Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const res = toggleGlobalAudio();
                  if (res.unmuted && res.count > 0) {
                    toast.success(
                      res.count === 1
                        ? "Unmuted 1 stream"
                        : `Unmuted ${res.count} streams`
                    );
                  } else {
                    toast.info("All streams muted");
                  }
                }}
                disabled={streams.length === 0}
                className={cn(
                  "h-8 gap-1.5 rounded-lg px-2 text-xs transition-all 2xl:px-2.5",
                  hasActiveAudio
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950/80"
                    : "border-zinc-200/90 bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              />
            }
          >
            {hasActiveAudio ? (
              <>
                <span className="flex h-3.5 items-end gap-0.5 px-0.5">
                  <span className="w-0.5 rounded-full bg-emerald-600 animate-eq-1 dark:bg-emerald-400" />
                  <span className="w-0.5 rounded-full bg-emerald-600 animate-eq-2 dark:bg-emerald-400" />
                  <span className="w-0.5 rounded-full bg-emerald-600 animate-eq-3 dark:bg-emerald-400" />
                </span>
                <span className="hidden 2xl:inline">
                  Mute ({unmutedVideoIds.length})
                </span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5" />
                <span className="hidden 2xl:inline">Muted</span>
              </>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {hasActiveAudio
              ? `${unmutedVideoIds.length} stream${unmutedVideoIds.length === 1 ? "" : "s"} unmuted — Click to mute all (M)`
              : "All streams muted — Click to unmute (M)"}
          </TooltipContent>
        </Tooltip>

        {/* Central Audio Mixer Console */}
        <AudioMixerSheet />

        {/* Instant Share, QR, JSON Backup & Watch Party */}
        <ShareExportDialog />

        {/* Save Layout Dialog (hidden on very small phones, accessible on sm+) */}
        <div className="hidden sm:inline-flex">
          <SaveLayoutDialog
            currentUser={currentUser}
            githubAuthEnabled={githubAuthEnabled}
            onUserAuthenticated={(user) => setCurrentUser(user)}
            onLayoutSaved={(newLayout) =>
              setSavedLayouts((prev) => [newLayout, ...prev])
            }
          />
        </div>

        {/* Saved Layouts Drawer */}
        <SavedLayoutsDrawer
          currentUser={currentUser}
          initialLayouts={savedLayouts}
          githubAuthEnabled={githubAuthEnabled}
          onLayoutsChange={setSavedLayouts}
          onUserChange={(user) => setCurrentUser(user)}
        />

        {/* Desktop Quick Utilities (xl+) */}
        {streams.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    triggerSyncAllLive();
                    toast.success("Synced all streams to live edge");
                  }}
                  className="hidden size-8 rounded-lg text-zinc-500 hover:bg-sky-500/10 hover:text-sky-600 xl:inline-flex dark:text-zinc-400 dark:hover:bg-sky-500/15 dark:hover:text-sky-400"
                />
              }
            >
              <RefreshCw className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              Sync All Streams to Live Edge (Press S)
            </TooltipContent>
          </Tooltip>
        )}

        {streams.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    clearAllStreams();
                    toast.info("Cleared all streams from grid");
                  }}
                  className="hidden size-8 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-600 xl:inline-flex dark:text-zinc-400 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                />
              }
            >
              <Trash2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Clear all streams from grid</TooltipContent>
          </Tooltip>
        )}

        {/* Keyboard Shortcuts Cheat Sheet Modal (keeps global keydown listener active; button visible on xl+) */}
        <KeyboardShortcutsDialog />

        {/* Fullscreen Studio Mode Toggle (xl+) */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={toggleFullscreen}
                className="hidden size-8 rounded-lg text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 xl:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              />
            }
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {isFullscreen
              ? "Exit Fullscreen Broadcast Mode (F)"
              : "Enter Fullscreen Broadcast Wall (F)"}
          </TooltipContent>
        </Tooltip>

        {/* Responsive Overflow Menu for Studio Tools (< xl) */}
        <div className="xl:hidden">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="More studio tools"
                        className="size-8 rounded-lg border-zinc-200/90 bg-zinc-100/80 text-zinc-600 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                }
              />
              <TooltipContent>More Studio Tools & Actions</TooltipContent>
            </Tooltip>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-zinc-200/90 bg-white/95 p-1.5 text-zinc-900 shadow-xl backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:text-zinc-100"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                  <span>Studio Tools</span>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    {streams.length}/9 Feeds
                  </span>
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => setCommandPaletteOpen(true)}
                  className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <Command className="size-3.5 text-zinc-500" />
                    Command Palette
                  </span>
                  <kbd className="font-mono text-[10px] text-zinc-400">⌘K</kbd>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/explore")}
                  className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <Compass className="size-3.5 text-indigo-500" />
                    Explore Community Walls
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setBookmarksOpen(true)}
                  className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bookmark className="size-3.5 text-amber-500" />
                    Notes & Bookmarks
                  </span>
                  {bookmarks.length > 0 && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.2 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                      {bookmarks.length}
                    </span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const next = !ecoModeEnabled;
                    setEcoMode(next);
                    toast.info(
                      next
                        ? "Eco Bandwidth Saver enabled"
                        : "Eco Bandwidth Saver disabled"
                    );
                  }}
                  className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <Leaf
                      className={cn(
                        "size-3.5",
                        ecoModeEnabled ? "text-emerald-500" : "text-zinc-500"
                      )}
                    />
                    Eco Bandwidth Mode
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {ecoModeEnabled ? "ON" : "OFF"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setShortcutsOpen(true)}
                  className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    <Keyboard className="size-3.5 text-zinc-500" />
                    Keyboard Shortcuts
                  </span>
                  <kbd className="font-mono text-[10px] text-zinc-400">?</kbd>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={toggleFullscreen}
                  className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <span className="inline-flex items-center gap-2">
                    {isFullscreen ? (
                      <Minimize2 className="size-3.5 text-zinc-500" />
                    ) : (
                      <Maximize2 className="size-3.5 text-zinc-500" />
                    )}
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                  </span>
                  <kbd className="font-mono text-[10px] text-zinc-400">F</kbd>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              {streams.length > 0 && (
                <>
                  <DropdownMenuSeparator className="my-1 bg-zinc-200/80 dark:bg-zinc-800/80" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        triggerSyncAllLive();
                        toast.success("Synced all streams to live edge");
                      }}
                      className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs text-sky-600 focus:bg-sky-500/10 focus:text-sky-600 dark:text-sky-400"
                    >
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="size-3.5" />
                        Sync All to Live Edge
                      </span>
                      <kbd className="font-mono text-[10px]">S</kbd>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        clearAllStreams();
                        toast.info("Cleared all streams from grid");
                      }}
                      className="cursor-pointer justify-between rounded-lg px-2.5 py-1.5 text-xs text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Trash2 className="size-3.5" />
                        Clear All Streams
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Light / Dark Theme Switcher */}
        <ThemeToggle />

        {/* Toggle Collapsible Live Chat Sidebar */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={isChatOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleChat}
                className={cn(
                  "h-8 gap-1.5 rounded-lg px-2 text-xs font-medium transition-all 2xl:px-2.5",
                  isChatOpen
                    ? "bg-sky-600 text-white shadow-xs hover:bg-sky-500 dark:bg-sky-600 dark:hover:bg-sky-500"
                    : "border-zinc-200/90 bg-zinc-100/80 text-zinc-700 hover:bg-white dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                )}
              />
            }
          >
            <MessageSquare className="size-3.5" />
            <span className="hidden 2xl:inline">Chat</span>
          </TooltipTrigger>
          <TooltipContent>
            {isChatOpen
              ? "Hide Live Chat Sidebar (C)"
              : "Show Collapsible Live Chat Sidebar (C)"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
