"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  RefreshCw,
  Timer,
  MousePointerClick,
  Leaf,
  Sliders,
  Keyboard,
  Clock,
  Activity,
  Bookmark,
  SunMedium,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { estimateQualityMbps } from "@/lib/youtube";
import { useStreamStore, type AutoCycleInterval } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function formatZoneTime(now: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone,
    }).format(now);
  } catch {
    return "--:--:--";
  }
}

function formatDuration(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function StudioTelemetryBar() {
  const streams = useStreamStore((s) => s.streams);
  const focusedVideoId = useStreamStore((s) => s.focusedVideoId);
  const autoCycleEnabled = useStreamStore((s) => s.autoCycleEnabled);
  const autoCycleIntervalSec = useStreamStore((s) => s.autoCycleIntervalSec);
  const audioFollowsHover = useStreamStore((s) => s.audioFollowsHover);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const masterVolume = useStreamStore((s) => s.masterVolume);
  const ambilightEnabled = useStreamStore((s) => s.ambilightEnabled);
  const showTelemetryTicker = useStreamStore((s) => s.showTelemetryTicker);
  const sessionStartedAt = useStreamStore((s) => s.sessionStartedAt);
  const streamQualities = useStreamStore((s) => s.streamQualities);
  const bookmarks = useStreamStore((s) => s.bookmarks);
  const soundscapeType = useStreamStore((s) => s.soundscapeType);

  const triggerSyncAllLive = useStreamStore((s) => s.triggerSyncAllLive);
  const setAutoCycle = useStreamStore((s) => s.setAutoCycle);
  const setAudioFollowsHover = useStreamStore((s) => s.setAudioFollowsHover);
  const setEcoMode = useStreamStore((s) => s.setEcoMode);
  const setAmbilightEnabled = useStreamStore((s) => s.setAmbilightEnabled);
  const setShowTelemetryTicker = useStreamStore((s) => s.setShowTelemetryTicker);
  const setAudioMixerOpen = useStreamStore((s) => s.setAudioMixerOpen);
  const setShortcutsOpen = useStreamStore((s) => s.setShortcutsOpen);
  const setBookmarksOpen = useStreamStore((s) => s.setBookmarksOpen);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [mounted]);

  const estimatedMbps = useMemo(() => {
    if (streams.length === 0) return 0;
    const total = streams.reduce((acc, s, idx) => {
      const isMain = focusedVideoId ? s.videoId === focusedVideoId : idx === 0;
      const reported = streamQualities[s.videoId];
      if (reported) {
        return acc + estimateQualityMbps(reported);
      }
      if (ecoModeEnabled && !isMain) {
        return acc + 0.35;
      }
      if (focusedVideoId && !isMain) {
        return acc + 0.7;
      }
      return acc + 2.6;
    }, 0);
    return Number(total.toFixed(1));
  }, [streams, focusedVideoId, streamQualities, ecoModeEnabled]);

  const nowDate = new Date(nowMs);
  const elapsedSec = Math.max(0, Math.floor((nowMs - sessionStartedAt) / 1000));

  return (
    <div className="mt-1.5 flex shrink-0 flex-col gap-1.5">
      {/* Optional World Clock & Stream Health Telemetry Ticker */}
      {showTelemetryTicker && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-1 text-[10px] shadow-2xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/70">
          {/* Left: Multi-Timezone Broadcast Clocks */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-zinc-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Clock className="size-3" />
              {mounted ? formatZoneTime(nowDate) : "--:--:--"}
              <span className="text-[9px] opacity-75">LOCAL</span>
            </span>
            <span className="opacity-30">|</span>
            <span>
              <strong className="text-zinc-800 dark:text-zinc-200">UTC</strong>{" "}
              {mounted ? formatZoneTime(nowDate, "UTC") : "--:--:--"}
            </span>
            <span className="hidden sm:inline">
              <strong className="text-zinc-800 dark:text-zinc-200">NYC</strong>{" "}
              {mounted ? formatZoneTime(nowDate, "America/New_York") : "--:--:--"}
            </span>
            <span className="hidden md:inline">
              <strong className="text-zinc-800 dark:text-zinc-200">LON</strong>{" "}
              {mounted ? formatZoneTime(nowDate, "Europe/London") : "--:--:--"}
            </span>
            <span className="hidden lg:inline">
              <strong className="text-zinc-800 dark:text-zinc-200">TYO</strong>{" "}
              {mounted ? formatZoneTime(nowDate, "Asia/Tokyo") : "--:--:--"}
            </span>
          </div>

          {/* Right: Live Bitrate, Session Uptime & Ambilight Indicator */}
          <div className="flex items-center gap-2.5 font-mono">
            <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
              <Activity className="size-3 text-sky-500" />
              <span>~{estimatedMbps} Mbps</span>
              <span className="hidden text-zinc-400 sm:inline">
                ({streams.length} {streams.length === 1 ? "feed" : "feeds"})
              </span>
            </span>
            <span className="hidden opacity-30 sm:inline">|</span>
            <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
              ON AIR {mounted ? formatDuration(elapsedSec) : "00:00"}
            </span>
          </div>
        </div>
      )}

      {/* Main Broadcast Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white/85 px-3 py-1.5 text-[11px] shadow-2xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/75">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => {
              triggerSyncAllLive();
              toast.success("Synced all streams to live edge");
            }}
            className="h-6.5 gap-1.5 rounded-md border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700 hover:border-sky-500/50 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-sky-300"
          >
            <RefreshCw className="size-3 text-sky-500" />
            Sync Live Edge
          </Button>

          {streams.length > 1 && (
            <div className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => {
                  const next = !autoCycleEnabled;
                  setAutoCycle(next);
                  toast.info(
                    next
                      ? `Auto-Cycle Carousel active (${autoCycleIntervalSec}s)`
                      : "Auto-Cycle Carousel paused"
                  );
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition",
                  autoCycleEnabled
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <Timer
                  className={cn("size-3", autoCycleEnabled && "animate-spin")}
                />
                <span>{autoCycleEnabled ? "Cycling" : "Auto-Cycle"}</span>
              </button>
              {([15, 30, 60] as AutoCycleInterval[]).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setAutoCycle(true, sec);
                    toast.info(`Auto-Cycle set to ${sec}s`);
                  }}
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold transition",
                    autoCycleIntervalSec === sec
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const next = !audioFollowsHover;
              setAudioFollowsHover(next);
              toast.info(
                next
                  ? "Hover-to-Listen enabled"
                  : "Hover-to-Listen disabled"
              );
            }}
            className={cn(
              "inline-flex h-6.5 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition",
              audioFollowsHover
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <MousePointerClick className="size-3" />
            <span className="hidden sm:inline">Hover Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !ecoModeEnabled;
              setEcoMode(next);
              toast.info(
                next
                  ? "Eco 240p Saver enabled for background feeds"
                  : "Eco Mode disabled"
              );
            }}
            className={cn(
              "inline-flex h-6.5 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition",
              ecoModeEnabled
                ? "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <Leaf className="size-3" />
            <span className="hidden sm:inline">Eco 240p</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !ambilightEnabled;
              setAmbilightEnabled(next);
              toast.info(
                next
                  ? "Ambilight Theater Glow enabled"
                  : "Ambilight Theater Glow disabled"
              );
            }}
            className={cn(
              "inline-flex h-6.5 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition",
              ambilightEnabled
                ? "border-purple-500/45 bg-purple-500/12 text-purple-700 dark:text-purple-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <SunMedium className="size-3" />
            <span className="hidden md:inline">Ambilight</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBookmarksOpen(true)}
            className={cn(
              "inline-flex h-6.5 items-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold transition",
              bookmarks.length > 0
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
            title="Stream Notes & Timestamp Bookmarks (B)"
          >
            <Bookmark className="size-3" />
            <span className="hidden sm:inline">Notes</span>
            {bookmarks.length > 0 && (
              <span className="rounded bg-amber-500/20 px-1 font-mono text-[10px] font-bold">
                {bookmarks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowTelemetryTicker(!showTelemetryTicker)}
            className={cn(
              "hidden h-6.5 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition sm:inline-flex",
              showTelemetryTicker
                ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
            )}
            title="Toggle World Clocks & Telemetry Ticker (T)"
          >
            <Clock className="size-3" />
            <span className="hidden lg:inline">Clocks</span>
          </button>

          <button
            type="button"
            onClick={() => setAudioMixerOpen(true)}
            className="inline-flex h-6.5 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 font-mono text-[11px] font-semibold text-zinc-700 transition hover:border-emerald-500/40 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-emerald-300"
          >
            <Sliders className="size-3 text-emerald-500" />
            <span>Master {masterVolume}%</span>
            {soundscapeType !== "off" && (
              <Music2 className="size-3 animate-pulse text-purple-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden h-6.5 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-900 md:inline-flex dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Keyboard className="size-3" />
            <kbd className="font-mono text-[10px]">?</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
