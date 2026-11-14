"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  LayoutGrid,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Rows2,
  Leaf,
  MousePointerClick,
  Compass,
  Bookmark,
  SunMedium,
  PictureInPicture2,
  Radio,
  Keyboard,
  CornerDownLeft,
  Tv,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CURATED_LIVE_STREAMS,
  CURATED_WALL_PACKS,
  extractYouTubeVideoId,
  getStreamPlatformMeta,
} from "@/lib/youtube";
import { GRID_PRESET_META } from "@/components/GridPresetIcon";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  keywords: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const isOpen = useStreamStore((s) => s.isCommandPaletteOpen);
  const setOpen = useStreamStore((s) => s.setCommandPaletteOpen);

  const streams = useStreamStore((s) => s.streams);
  const gridPreset = useStreamStore((s) => s.gridPreset);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const ambilightEnabled = useStreamStore((s) => s.ambilightEnabled);
  const showTelemetryTicker = useStreamStore((s) => s.showTelemetryTicker);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const audioFollowsHover = useStreamStore((s) => s.audioFollowsHover);
  const isChatOpen = useStreamStore((s) => s.isChatOpen);
  const isSplitChat = useStreamStore((s) => s.isSplitChat);
  const isCompactChat = useStreamStore((s) => s.isCompactChat);
  const keepChatAlive = useStreamStore((s) => s.keepChatAlive);

  const addStream = useStreamStore((s) => s.addStream);
  const removeStream = useStreamStore((s) => s.removeStream);
  const setGridPreset = useStreamStore((s) => s.setGridPreset);
  const toggleSoloFocus = useStreamStore((s) => s.toggleSoloFocus);
  const toggleGlobalAudio = useStreamStore((s) => s.toggleGlobalAudio);
  const duckBackgroundStreams = useStreamStore((s) => s.duckBackgroundStreams);
  const triggerSyncAllLive = useStreamStore((s) => s.triggerSyncAllLive);
  const setAudioMixerOpen = useStreamStore((s) => s.setAudioMixerOpen);
  const setShortcutsOpen = useStreamStore((s) => s.setShortcutsOpen);
  const setBookmarksOpen = useStreamStore((s) => s.setBookmarksOpen);
  const setAmbilightEnabled = useStreamStore((s) => s.setAmbilightEnabled);
  const setShowTelemetryTicker = useStreamStore((s) => s.setShowTelemetryTicker);
  const setEcoMode = useStreamStore((s) => s.setEcoMode);
  const setAudioFollowsHover = useStreamStore((s) => s.setAudioFollowsHover);
  const toggleChat = useStreamStore((s) => s.toggleChat);
  const setSplitChat = useStreamStore((s) => s.setSplitChat);
  const setCompactChat = useStreamStore((s) => s.setCompactChat);
  const setKeepChatAlive = useStreamStore((s) => s.setKeepChatAlive);
  const setPipVideoId = useStreamStore((s) => s.setPipVideoId);
  const loadWallPack = useStreamStore((s) => s.loadWallPack);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global Ctrl+K / Cmd+K hotkey
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useStreamStore.getState().isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  };

  const detectedStreamId = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    return extractYouTubeVideoId(trimmed);
  }, [query]);

  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    if (detectedStreamId) {
      const meta = getStreamPlatformMeta(detectedStreamId);
      items.push({
        id: `add-direct-${detectedStreamId}`,
        group: "Instant Stream Input",
        title: `Add ${meta.label} Feed (${detectedStreamId})`,
        subtitle: "Press Enter to launch directly into your grid",
        badge: meta.shortLabel,
        icon: <Plus className="size-4 text-emerald-500" />,
        keywords: `${query} add stream url`,
        onSelect: () => {
          const res = addStream(query.trim());
          if (res.success) {
            toast.success(`Added stream (${res.videoId}) to grid`);
          } else if (res.error) {
            toast.error(res.error);
          }
          setOpen(false);
        },
      });
    }

    // Studio Controls
    items.push(
      {
        id: "action-mixer",
        group: "Studio Controls",
        title: "Open Broadcast Audio Mixer & Soundscapes",
        subtitle: "Master gain, channel faders & ambient Web Audio beds",
        badge: "A",
        icon: <Sliders className="size-4 text-emerald-500" />,
        keywords: "audio mixer volume soundscape rain vinyl space brown noise",
        onSelect: () => {
          setOpen(false);
          setAudioMixerOpen(true);
        },
      },
      {
        id: "action-bookmarks",
        group: "Studio Controls",
        title: "Open Stream Notes & Timestamp Bookmarks",
        subtitle: "Log key broadcast moments and export Markdown logs",
        badge: "B",
        icon: <Bookmark className="size-4 text-amber-500" />,
        keywords: "bookmarks notes timestamps log moment",
        onSelect: () => {
          setOpen(false);
          setBookmarksOpen(true);
        },
      },
      {
        id: "action-ambilight",
        group: "Studio Controls",
        title: ambilightEnabled
          ? "Disable Ambilight Theater Glow"
          : "Enable Ambilight Theater Glow",
        subtitle: "Reactive ambient backlight tuned to the lead stream",
        badge: "L",
        icon: <SunMedium className="size-4 text-emerald-400" />,
        keywords: "ambilight glow theater backlight",
        onSelect: () => {
          setAmbilightEnabled(!ambilightEnabled);
          toast.info(
            !ambilightEnabled
              ? "Ambilight Theater Glow enabled"
              : "Ambilight Theater Glow disabled"
          );
          setOpen(false);
        },
      },
      {
        id: "action-telemetry",
        group: "Studio Controls",
        title: showTelemetryTicker
          ? "Hide World Clock & Telemetry Ticker"
          : "Show World Clock & Telemetry Ticker",
        subtitle: "UTC/NYC/TYO clocks, live Mbps & stream health strip",
        badge: "T",
        icon: <Radio className="size-4 text-sky-500" />,
        keywords: "telemetry world clock utc time bandwidth mbps",
        onSelect: () => {
          setShowTelemetryTicker(!showTelemetryTicker);
          setOpen(false);
        },
      },
      {
        id: "action-explore",
        group: "Studio Controls",
        title: "Browse Community Wall Directory (/explore)",
        subtitle: "Discover & launch public multi-stream setups",
        icon: <Compass className="size-4 text-sky-500" />,
        keywords: "explore community gallery public walls directory",
        onSelect: () => {
          setOpen(false);
          router.push("/explore");
        },
      }
    );

    if (streams.length > 0) {
      const hasAudio = unmutedVideoIds.length > 0;
      items.push(
        {
          id: "action-mute-toggle",
          group: "Studio Controls",
          title: hasAudio ? "Mute All Streams" : "Unmute Restored Streams",
          subtitle: `${unmutedVideoIds.length} currently unmuted`,
          badge: "M",
          icon: hasAudio ? (
            <VolumeX className="size-4 text-red-400" />
          ) : (
            <Volume2 className="size-4 text-emerald-500" />
          ),
          keywords: "mute unmute global audio",
          onSelect: () => {
            const res = toggleGlobalAudio();
            toast.info(
              res.unmuted ? `Unmuted ${res.count} streams` : "All streams muted"
            );
            setOpen(false);
          },
        },
        {
          id: "action-duck",
          group: "Studio Controls",
          title: "Duck Background Streams (Lead 100% / Others 30%)",
          subtitle: "Highlight main commentary while keeping ambience low",
          icon: <Sparkles className="size-4 text-amber-500" />,
          keywords: "duck 30 background audio focus",
          onSelect: () => {
            duckBackgroundStreams();
            toast.success("Audio ducked: Lead 100% / Background 30%");
            setOpen(false);
          },
        },
        {
          id: "action-sync",
          group: "Studio Controls",
          title: "Sync All Streams to Live Edge",
          subtitle: "Jump all active feeds to real-time live edge",
          badge: "S",
          icon: <RefreshCw className="size-4 text-sky-500" />,
          keywords: "sync live edge latency",
          onSelect: () => {
            triggerSyncAllLive();
            toast.success("Synced all streams to live edge");
            setOpen(false);
          },
        }
      );
    }

    items.push(
      {
        id: "action-chat",
        group: "Studio Controls",
        title: isChatOpen ? "Hide Live Chat Sidebar" : "Open Live Chat Sidebar",
        badge: "C",
        icon: <MessageSquare className="size-4 text-sky-500" />,
        keywords: "live chat sidebar",
        onSelect: () => {
          toggleChat();
          setOpen(false);
        },
      },
      {
        id: "action-split-chat",
        group: "Studio Controls",
        title: isSplitChat
          ? "Switch to Single Chat Pane"
          : "Enable Dual Split Live Chat",
        badge: "⇧C",
        icon: <Rows2 className="size-4 text-sky-400" />,
        keywords: "dual split chat two chats",
        onSelect: () => {
          setSplitChat(!isSplitChat);
          if (!isChatOpen) toggleChat();
          setOpen(false);
        },
      },
      {
        id: "action-compact-chat",
        group: "Studio Controls",
        title: isCompactChat
          ? "Expand Live Chat Header"
          : "Compact / Zen Live Chat Mode",
        subtitle: "Maximize vertical space for reading chat messages",
        icon: <MessageSquare className="size-4 text-sky-500" />,
        keywords: "compact zen live chat height header",
        onSelect: () => {
          setCompactChat(!isCompactChat);
          if (!isChatOpen) toggleChat();
          setOpen(false);
        },
      },
      {
        id: "action-warm-chat",
        group: "Studio Controls",
        title: keepChatAlive
          ? "Disable Instant Live Chat Cache"
          : "Enable Instant Live Chat Cache",
        subtitle: "Keep visited chats warm for 0ms switching & Live Chat mode",
        icon: <Sparkles className="size-4 text-amber-500" />,
        keywords: "keep alive warm chat cache instant switch",
        onSelect: () => {
          setKeepChatAlive(!keepChatAlive);
          toast.info(
            !keepChatAlive
              ? "Instant Live Chat Cache enabled"
              : "Instant Live Chat Cache disabled"
          );
          setOpen(false);
        },
      },
      {
        id: "action-eco",
        group: "Studio Controls",
        title: ecoModeEnabled
          ? "Disable Eco 240p Bandwidth Saver"
          : "Enable Eco 240p Bandwidth Saver",
        badge: "E",
        icon: <Leaf className="size-4 text-amber-500" />,
        keywords: "eco bandwidth saver 240p",
        onSelect: () => {
          setEcoMode(!ecoModeEnabled);
          setOpen(false);
        },
      },
      {
        id: "action-hover-audio",
        group: "Studio Controls",
        title: audioFollowsHover
          ? "Disable Hover-to-Listen Audio"
          : "Enable Hover-to-Listen Audio",
        icon: <MousePointerClick className="size-4 text-emerald-500" />,
        keywords: "hover audio solo mouse",
        onSelect: () => {
          setAudioFollowsHover(!audioFollowsHover);
          setOpen(false);
        },
      },
      {
        id: "action-shortcuts",
        group: "Studio Controls",
        title: "View All Keyboard Shortcuts",
        badge: "?",
        icon: <Keyboard className="size-4 text-zinc-400" />,
        keywords: "keyboard shortcuts hotkeys help",
        onSelect: () => {
          setOpen(false);
          setShortcutsOpen(true);
        },
      }
    );

    // Active Stream Quick Actions
    streams.forEach((s, idx) => {
      items.push({
        id: `stream-solo-${s.videoId}`,
        group: "Active Feeds",
        title: `Solo Focus #0${idx + 1}: ${s.label}`,
        subtitle: "Expand tile & focus 100% audio",
        badge: String(idx + 1),
        icon: <Tv className="size-4 text-emerald-500" />,
        keywords: `solo focus ${s.label} ${s.videoId}`,
        onSelect: () => {
          toggleSoloFocus(s.videoId);
          setOpen(false);
        },
      });
      items.push({
        id: `stream-pip-${s.videoId}`,
        group: "Active Feeds",
        title: `Float in PiP Mini-Player: ${s.label}`,
        subtitle: "Detach into draggable corner dock",
        icon: <PictureInPicture2 className="size-4 text-sky-500" />,
        keywords: `pip mini player float dock ${s.label}`,
        onSelect: () => {
          setPipVideoId(s.videoId);
          toast.success(`Popped "${s.label}" into Floating PiP Dock`);
          setOpen(false);
        },
      });
      items.push({
        id: `stream-remove-${s.videoId}`,
        group: "Active Feeds",
        title: `Remove Feed: ${s.label}`,
        icon: <X className="size-4 text-red-400" />,
        keywords: `remove close delete ${s.label}`,
        onSelect: () => {
          removeStream(s.videoId);
          toast(`Removed "${s.label}"`);
          setOpen(false);
        },
      });
    });

    // Grid Presets
    GRID_PRESET_META.forEach((preset) => {
      items.push({
        id: `preset-${preset.value}`,
        group: "Grid Geometry",
        title: `Switch Grid to ${preset.label}`,
        subtitle: preset.description,
        badge: gridPreset === preset.value ? "ACTIVE" : preset.value,
        icon: <LayoutGrid className="size-4 text-emerald-500" />,
        keywords: `grid layout preset ${preset.value} ${preset.label}`,
        onSelect: () => {
          setGridPreset(preset.value);
          toast.info(`Switched layout to ${preset.label}`);
          setOpen(false);
        },
      });
    });

    // Wall Packs
    CURATED_WALL_PACKS.forEach((pack) => {
      items.push({
        id: `pack-${pack.id}`,
        group: "1-Click Wall Packs",
        title: `Launch "${pack.title}"`,
        subtitle: pack.subtitle,
        badge: pack.preset,
        icon: <Sparkles className="size-4 text-emerald-500" />,
        keywords: `wall pack ${pack.title} ${pack.subtitle} ${pack.badge}`,
        onSelect: () => {
          loadWallPack(pack.streams, pack.preset);
          toast.success(`Launched "${pack.title}" (${pack.preset})`);
          setOpen(false);
        },
      });
    });

    // Curated Channels
    CURATED_LIVE_STREAMS.forEach((channel) => {
      const alreadyActive = streams.some((s) => s.videoId === channel.videoId);
      items.push({
        id: `channel-${channel.videoId}`,
        group: "24/7 Curated Channels",
        title: channel.label,
        subtitle: `${channel.category} • ${channel.handle}`,
        badge: alreadyActive ? "ACTIVE" : channel.platform.toUpperCase(),
        icon: <Plus className="size-4 text-sky-500" />,
        keywords: `channel ${channel.label} ${channel.category} ${channel.handle} ${channel.platform}`,
        onSelect: () => {
          const res = addStream(channel.videoId, channel.label);
          if (res.success) {
            toast.success(`Added "${channel.label}"`);
          } else if (res.error) {
            toast.error(res.error);
          }
          setOpen(false);
        },
      });
    });

    return items;
  }, [
    detectedStreamId,
    query,
    ambilightEnabled,
    showTelemetryTicker,
    streams,
    unmutedVideoIds.length,
    isChatOpen,
    isSplitChat,
    isCompactChat,
    keepChatAlive,
    ecoModeEnabled,
    audioFollowsHover,
    gridPreset,
    addStream,
    setOpen,
    setAudioMixerOpen,
    setBookmarksOpen,
    setAmbilightEnabled,
    setShowTelemetryTicker,
    router,
    toggleGlobalAudio,
    duckBackgroundStreams,
    triggerSyncAllLive,
    toggleChat,
    setSplitChat,
    setCompactChat,
    setKeepChatAlive,
    setEcoMode,
    setAudioFollowsHover,
    setShortcutsOpen,
    toggleSoloFocus,
    setPipVideoId,
    removeStream,
    setGridPreset,
    loadWallPack,
  ]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 18);
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        (item.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [allItems, query]);

  const safeSelectedIndex = Math.min(
    selectedIndex,
    Math.max(0, filteredItems.length - 1)
  );

  const groupedItems = useMemo(() => {
    const groups: Array<{ name: string; items: Array<PaletteItem & { flatIndex: number }> }> = [];
    const map = new Map<string, Array<PaletteItem & { flatIndex: number }>>();
    filteredItems.forEach((item, idx) => {
      const list = map.get(item.group) ?? [];
      list.push({ ...item, flatIndex: idx });
      if (!map.has(item.group)) {
        map.set(item.group, list);
        groups.push({ name: item.group, items: list });
      }
    });
    return groups;
  }, [filteredItems]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0
          ? (prev - 1 + filteredItems.length) % filteredItems.length
          : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = filteredItems[safeSelectedIndex];
      if (chosen) {
        chosen.onSelect();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden rounded-2xl border-zinc-200/90 bg-white/95 p-0 text-zinc-900 shadow-2xl backdrop-blur-2xl sm:max-w-xl dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100"
      >
        <DialogTitle className="sr-only">Studio Command Palette</DialogTitle>

        {/* Search Input Header */}
        <div className="flex items-center gap-2.5 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
          <Search className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search channels, layouts, actions — or paste YouTube / Twitch / Kick URL..."
            className="h-7 flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <kbd className="hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 sm:inline-flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-zinc-500">
              <Radio className="mb-2 size-6 text-zinc-400 opacity-60" />
              No matching channels or studio commands for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-3">
              {groupedItems.map((group) => (
                <div key={group.name}>
                  <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                    {group.name}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = item.flatIndex === safeSelectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(item.flatIndex)}
                          onClick={item.onSelect}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                            isActive
                              ? "bg-emerald-500/12 text-zinc-950 dark:bg-emerald-500/15 dark:text-white"
                              : "text-zinc-700 hover:bg-zinc-100/80 dark:text-zinc-300 dark:hover:bg-zinc-900/70"
                          )}
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                            {item.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 bg-zinc-200/70 px-1.5 py-0 font-mono text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {isActive && (
                            <CornerDownLeft className="size-3.5 shrink-0 text-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/80 px-4 py-2 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-zinc-300 bg-white px-1 font-mono text-[10px] dark:border-zinc-700 dark:bg-zinc-950">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="rounded border border-zinc-300 bg-white px-1 font-mono text-[10px] dark:border-zinc-700 dark:bg-zinc-950">
                ↵
              </kbd>{" "}
              Execute
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
            TCT Command Palette
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
