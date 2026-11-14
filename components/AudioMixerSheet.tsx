"use client";

import React, { useEffect } from "react";
import {
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  RotateCcw,
  Headphones,
  MousePointerClick,
  MessageSquare,
  Leaf,
  Sparkles,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStreamPlatformMeta } from "@/lib/youtube";
import { SOUNDSCAPE_PRESETS, soundscapeEngine } from "@/lib/soundscape";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

function formatDecibels(vol: number): string {
  if (vol <= 0) return "-∞ dB";
  if (vol >= 100) return "0.0 dB";
  const db = 20 * Math.log10(vol / 100);
  return `${db.toFixed(1)} dB`;
}

export function AudioMixerSheet() {
  const streams = useStreamStore((s) => s.streams);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const focusedVideoId = useStreamStore((s) => s.focusedVideoId);
  const masterVolume = useStreamStore((s) => s.masterVolume);
  const streamVolumes = useStreamStore((s) => s.streamVolumes);
  const audioFollowsHover = useStreamStore((s) => s.audioFollowsHover);
  const audioFollowsChat = useStreamStore((s) => s.audioFollowsChat);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const isAudioMixerOpen = useStreamStore((s) => s.isAudioMixerOpen);
  const soundscapeType = useStreamStore((s) => s.soundscapeType);
  const soundscapeVolume = useStreamStore((s) => s.soundscapeVolume);

  const setAudioMixerOpen = useStreamStore((s) => s.setAudioMixerOpen);
  const setMasterVolume = useStreamStore((s) => s.setMasterVolume);
  const setStreamVolume = useStreamStore((s) => s.setStreamVolume);
  const toggleStreamAudio = useStreamStore((s) => s.toggleStreamAudio);
  const toggleSoloFocus = useStreamStore((s) => s.toggleSoloFocus);
  const toggleGlobalAudio = useStreamStore((s) => s.toggleGlobalAudio);
  const resetAllVolumes = useStreamStore((s) => s.resetAllVolumes);
  const duckBackgroundStreams = useStreamStore((s) => s.duckBackgroundStreams);
  const setAudioFollowsHover = useStreamStore((s) => s.setAudioFollowsHover);
  const setAudioFollowsChat = useStreamStore((s) => s.setAudioFollowsChat);
  const setEcoMode = useStreamStore((s) => s.setEcoMode);
  const triggerSyncAllLive = useStreamStore((s) => s.triggerSyncAllLive);
  const setSoundscapeType = useStreamStore((s) => s.setSoundscapeType);
  const setSoundscapeVolume = useStreamStore((s) => s.setSoundscapeVolume);

  useEffect(() => {
    soundscapeEngine.update(soundscapeType, soundscapeVolume);
  }, [soundscapeType, soundscapeVolume]);

  const hasActiveAudio = unmutedVideoIds.length > 0;

  return (
    <Sheet open={isAudioMixerOpen} onOpenChange={setAudioMixerOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1 rounded-lg px-2 text-xs font-medium transition-all sm:px-2.5",
                    isAudioMixerOpen || hasActiveAudio
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-zinc-200/90 bg-zinc-100/80 text-zinc-700 hover:bg-white dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  )}
                />
              }
            >
              <Sliders className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden 2xl:inline">Mixer</span>
              <span className="hidden font-mono text-[10px] opacity-80 sm:inline">
                {masterVolume}%
              </span>
            </SheetTrigger>
          }
        />
        <TooltipContent>
          Broadcast Audio Mixer Console (Press A)
        </TooltipContent>
      </Tooltip>

      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-zinc-200 bg-white p-0 text-zinc-900 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <SheetHeader className="border-b border-zinc-200/80 bg-zinc-50/85 p-4 dark:border-zinc-800/90 dark:bg-zinc-900/60">
          <SheetTitle className="flex items-center justify-between pr-8 text-base font-bold text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Headphones className="size-4" />
              </span>
              <span>Audio Mixing Console</span>
            </div>
            {hasActiveAudio && (
              <span className="flex h-3.5 items-end gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
                <span className="w-0.5 rounded-full bg-emerald-500 animate-eq-1" />
                <span className="w-0.5 rounded-full bg-emerald-500 animate-eq-2" />
                <span className="w-0.5 rounded-full bg-emerald-500 animate-eq-3" />
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Control master output gain, per-channel faders, smart audio routing,
            and live-edge synchronization across all streams.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Master Bus Fader */}
          <section className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                  Master Bus
                </span>
                <Badge
                  variant="secondary"
                  className="bg-white font-mono text-[10px] text-zinc-700 shadow-2xs dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {unmutedVideoIds.length}/{streams.length} Live
                </Badge>
              </div>
              <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {masterVolume}%{" "}
                <span className="text-[10px] font-normal text-zinc-500">
                  ({formatDecibels(masterVolume)})
                </span>
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Button
                type="button"
                size="icon-sm"
                variant={hasActiveAudio ? "default" : "outline"}
                disabled={streams.length === 0}
                onClick={() => {
                  const res = toggleGlobalAudio();
                  toast.info(
                    res.unmuted
                      ? `Unmuted ${res.count} stream${res.count === 1 ? "" : "s"}`
                      : "Muted all streams"
                  );
                }}
                className={cn(
                  "shrink-0 rounded-lg",
                  hasActiveAudio
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800"
                )}
              >
                {hasActiveAudio ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
              </Button>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                aria-label="Master output volume"
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-emerald-500 dark:bg-zinc-800"
              />
            </div>

            {/* Quick Console Actions */}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={streams.length === 0}
                onClick={() => {
                  duckBackgroundStreams();
                  toast.success("Audio ducked: Lead 100% / Background 30%");
                }}
                className="gap-1 rounded-lg border-zinc-200 bg-white text-[11px] font-medium text-zinc-700 hover:border-amber-500/40 hover:text-amber-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-amber-300"
              >
                <Sparkles className="size-3 text-amber-500" />
                Duck 30%
              </Button>

              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={streams.length === 0}
                onClick={() => {
                  resetAllVolumes();
                  toast.info("Reset all channel faders to 100%");
                }}
                className="gap-1 rounded-lg border-zinc-200 bg-white text-[11px] font-medium text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-emerald-300"
              >
                <RotateCcw className="size-3" />
                Reset 100%
              </Button>

              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={streams.length === 0}
                onClick={() => {
                  triggerSyncAllLive();
                  toast.success("Synced all feeds to live edge");
                }}
                className="gap-1 rounded-lg border-zinc-200 bg-white text-[11px] font-medium text-zinc-700 hover:border-sky-500/40 hover:text-sky-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-sky-300"
              >
                <Radio className="size-3 text-sky-500" />
                Sync Live
              </Button>
            </div>
          </section>

          {/* Smart Audio & Bandwidth Automation */}
          <section className="space-y-2 rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Smart Routing & Eco Automation
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-950/80">
              <div className="flex items-start gap-2.5">
                <MousePointerClick className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div>
                  <div className="text-xs font-semibold">Hover-to-Listen</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Auto-solo audio when hovering any stream tile
                  </p>
                </div>
              </div>
              <Switch
                checked={audioFollowsHover}
                onCheckedChange={(checked) => {
                  setAudioFollowsHover(Boolean(checked));
                  toast.info(
                    checked
                      ? "Hover-to-Listen enabled"
                      : "Hover-to-Listen disabled"
                  );
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-950/80">
              <div className="flex items-start gap-2.5">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-sky-500" />
                <div>
                  <div className="text-xs font-semibold">
                    Audio Follows Active Chat
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Switching Live Chat automatically focuses stream audio
                  </p>
                </div>
              </div>
              <Switch
                checked={audioFollowsChat}
                onCheckedChange={(checked) => {
                  setAudioFollowsChat(Boolean(checked));
                  toast.info(
                    checked
                      ? "Audio Follows Chat enabled"
                      : "Audio Follows Chat disabled"
                  );
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-950/80">
              <div className="flex items-start gap-2.5">
                <Leaf className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold">
                    Eco Bandwidth Saver (240p)
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Drop non-focused feeds to 240p & pause when tab hidden
                  </p>
                </div>
              </div>
              <Switch
                checked={ecoModeEnabled}
                onCheckedChange={(checked) => {
                  setEcoMode(Boolean(checked));
                  toast.info(
                    checked
                      ? "Eco Bandwidth Saver enabled"
                      : "Eco Bandwidth Saver disabled"
                  );
                }}
              />
            </div>
          </section>

          {/* Studio Ambient Soundscapes (Zero-Bandwidth Web Audio Layer) */}
          <section className="space-y-2.5 rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                <Music2 className="size-3.5 text-purple-500" />
                <span>Studio Soundscape Layer</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">
                {soundscapeType === "off" ? "Muted" : `${soundscapeVolume}%`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {SOUNDSCAPE_PRESETS.map((preset) => {
                const isSelected = soundscapeType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSoundscapeType(preset.id);
                      if (preset.id === "off") {
                        toast.info("Ambient soundscape turned off");
                      } else {
                        toast.success(`Soundscape: ${preset.label}`);
                      }
                    }}
                    title={preset.description}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-center text-[10px] font-semibold transition",
                      isSelected
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-700 dark:text-purple-300"
                        : "border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                  >
                    {preset.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {soundscapeType !== "off" && (
              <div className="flex items-center gap-2.5 pt-1">
                <span className="font-mono text-[10px] text-zinc-500">Gain</span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={soundscapeVolume}
                  onChange={(e) => setSoundscapeVolume(Number(e.target.value))}
                  aria-label="Ambient soundscape volume"
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-purple-500 dark:bg-zinc-800"
                />
                <span className="w-8 text-right font-mono text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  {soundscapeVolume}%
                </span>
              </div>
            )}
          </section>

          {/* Individual Channel Strips */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Channel Strips ({streams.length})
              </span>
              {streams.length > 0 && (
                <span className="font-mono text-[10px] text-zinc-400">
                  S = Solo • M = Mute
                </span>
              )}
            </div>

            {streams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
                Add streams to the theater grid to mix individual channel levels.
              </div>
            ) : (
              <div className="space-y-2">
                {streams.map((stream, idx) => {
                  const isUnmuted = unmutedVideoIds.includes(stream.videoId);
                  const isFocused = focusedVideoId === stream.videoId;
                  const channelVol = streamVolumes[stream.videoId] ?? 100;
                  const effectivePct = isUnmuted
                    ? Math.round((channelVol * masterVolume) / 100)
                    : 0;
                  const platformMeta = getStreamPlatformMeta(stream.videoId);

                  return (
                    <div
                      key={stream.videoId}
                      className={cn(
                        "rounded-xl border p-3 transition-all",
                        isFocused
                          ? "border-emerald-500/60 bg-emerald-500/8 dark:bg-emerald-950/25"
                          : isUnmuted
                            ? "border-zinc-300 bg-white shadow-2xs dark:border-zinc-700 dark:bg-zinc-900/80"
                            : "border-zinc-200/80 bg-zinc-50/70 opacity-85 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-zinc-200/80 font-mono text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            0{idx + 1}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded border px-1 py-0.2 font-mono text-[9px] font-bold",
                              platformMeta.platform === "youtube"
                                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
                                : platformMeta.platform === "twitch"
                                  ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300"
                                  : "border-lime-500/30 bg-lime-500/10 text-lime-700 dark:text-lime-300"
                            )}
                          >
                            {platformMeta.shortLabel}
                          </span>
                          <span className="truncate text-xs font-semibold">
                            {stream.label}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant={isFocused ? "default" : "outline"}
                            onClick={() => toggleSoloFocus(stream.videoId)}
                            className={cn(
                              "size-6 rounded-md font-mono text-[10px] font-bold",
                              isFocused
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "border-zinc-200 dark:border-zinc-800"
                            )}
                            title="Solo Focus this channel"
                          >
                            S
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant={isUnmuted ? "secondary" : "outline"}
                            onClick={() => toggleStreamAudio(stream.videoId)}
                            className={cn(
                              "size-6 rounded-md font-mono text-[10px] font-bold",
                              isUnmuted
                                ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300"
                                : "border-zinc-200 text-zinc-400 dark:border-zinc-800"
                            )}
                            title={isUnmuted ? "Mute channel" : "Unmute channel"}
                          >
                            M
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2.5">
                        <input
                          type="range"
                          min={5}
                          max={100}
                          step={5}
                          value={channelVol}
                          onChange={(e) =>
                            setStreamVolume(
                              stream.videoId,
                              Number(e.target.value)
                            )
                          }
                          aria-label={`${stream.label} channel volume`}
                          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-emerald-500 dark:bg-zinc-800"
                        />
                        <span className="w-16 text-right font-mono text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          {channelVol}%{" "}
                          {isUnmuted && masterVolume < 100 && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ({effectivePct})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
