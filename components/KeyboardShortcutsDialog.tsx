"use client";

import React, { useEffect } from "react";
import { Keyboard, Volume2, LayoutGrid, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStreamStore } from "@/store/useStreamStore";
import type { GridPreset } from "@/db/schema";

const PRESET_ORDER: GridPreset[] = ["1x1", "1x2", "2x2", "1+3", "3x3"];

const SHORTCUT_GROUPS: Array<{
  title: string;
  icon: React.ReactNode;
  items: Array<{ keys: string[]; description: string }>;
}> = [
  {
    title: "Audio & Mixing",
    icon: <Volume2 className="size-3.5 text-emerald-500" />,
    items: [
      { keys: ["1", "–", "9"], description: "Solo Audio Focus on Feed #1–#9" },
      { keys: ["M"], description: "Toggle Global Mute / Unmute All" },
      { keys: ["A"], description: "Open / Close Audio Mixer Console" },
    ],
  },
  {
    title: "Stage & Grid Control",
    icon: <LayoutGrid className="size-3.5 text-sky-500" />,
    items: [
      { keys: ["G"], description: "Cycle Grid Preset (1x1 → 1x2 → 2x2 → 1+3 → 3x3)" },
      { keys: ["C"], description: "Toggle Live Chat Sidebar" },
      { keys: ["Shift", "C"], description: "Toggle Dual Split Live Chat" },
      { keys: ["[" , "]"], description: "Switch Previous / Next Live Chat Stream" },
      { keys: ["F"], description: "Toggle Fullscreen Theater Mode" },
    ],
  },
  {
    title: "Navigation & Automation",
    icon: <Zap className="size-3.5 text-amber-500" />,
    items: [
      { keys: ["Ctrl/⌘", "K"], description: "Open Spotlight Command Palette" },
      { keys: ["/"], description: "Focus Top Stream Command Input" },
      { keys: ["S"], description: "Sync All Streams to Live Edge" },
      { keys: ["R"], description: "Toggle Auto-Cycle Carousel Mode" },
      { keys: ["E"], description: "Toggle Eco 240p Bandwidth Saver" },
      { keys: ["B"], description: "Open Broadcast Notes & Bookmarks" },
      { keys: ["L"], description: "Toggle Ambilight Theater Glow" },
      { keys: ["T"], description: "Toggle World Clocks & Telemetry Bar" },
      { keys: ["?"], description: "Show / Hide This Shortcuts Matrix" },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const isShortcutsOpen = useStreamStore((s) => s.isShortcutsOpen);
  const setShortcutsOpen = useStreamStore((s) => s.setShortcutsOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const state = useStreamStore.getState();

      if (e.shiftKey && e.key.toLowerCase() === "c") {
        if (state.streams.length > 1) {
          e.preventDefault();
          const next = !state.isSplitChat;
          state.setSplitChat(next);
          if (!state.isChatOpen) state.setChatOpen(true);
          toast.info(next ? "Dual Split Live Chat enabled" : "Single Live Chat mode");
        }
        return;
      }

      if (e.key === "[" || e.key === "]") {
        if (state.streams.length > 1) {
          e.preventDefault();
          state.cycleChatStream(e.key === "]" ? 1 : -1);
        }
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        state.setShortcutsOpen(!state.isShortcutsOpen);
        return;
      }

      // 1-9 Solo audio focus
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const targetStream = state.streams[idx];
        if (targetStream) {
          e.preventDefault();
          const nowFocused = state.toggleSoloFocus(targetStream.videoId);
          toast.info(
            nowFocused
              ? `Solo Focus #0${idx + 1}: ${targetStream.label}`
              : "Exited Solo Focus"
          );
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m": {
          if (state.streams.length > 0) {
            e.preventDefault();
            const res = state.toggleGlobalAudio();
            toast.info(
              res.unmuted
                ? `Unmuted ${res.count} stream${res.count === 1 ? "" : "s"}`
                : "All streams muted"
            );
          }
          break;
        }
        case "a": {
          e.preventDefault();
          state.setAudioMixerOpen(!state.isAudioMixerOpen);
          break;
        }
        case "c": {
          e.preventDefault();
          state.toggleChat();
          break;
        }
        case "s": {
          if (state.streams.length > 0) {
            e.preventDefault();
            state.triggerSyncAllLive();
            toast.success("Synced all feeds to live edge");
          }
          break;
        }
        case "r": {
          if (state.streams.length > 1) {
            e.preventDefault();
            const next = !state.autoCycleEnabled;
            state.setAutoCycle(next);
            toast.info(
              next
                ? `Auto-Cycle enabled (${state.autoCycleIntervalSec}s)`
                : "Auto-Cycle paused"
            );
          }
          break;
        }
        case "e": {
          e.preventDefault();
          const next = !state.ecoModeEnabled;
          state.setEcoMode(next);
          toast.info(
            next ? "Eco Bandwidth Saver enabled" : "Eco Bandwidth Saver disabled"
          );
          break;
        }
        case "g": {
          e.preventDefault();
          const currentIdx = PRESET_ORDER.indexOf(state.gridPreset);
          const nextPreset =
            PRESET_ORDER[(currentIdx + 1) % PRESET_ORDER.length];
          state.setGridPreset(nextPreset);
          toast.info(`Switched layout to ${nextPreset}`);
          break;
        }
        case "f": {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        }
        case "b": {
          e.preventDefault();
          state.setBookmarksOpen(!state.isBookmarksOpen);
          break;
        }
        case "l": {
          e.preventDefault();
          const nextGlow = !state.ambilightEnabled;
          state.setAmbilightEnabled(nextGlow);
          toast.info(
            nextGlow ? "Ambilight Theater Glow enabled" : "Ambilight Theater Glow disabled"
          );
          break;
        }
        case "t": {
          e.preventDefault();
          const nextTicker = !state.showTelemetryTicker;
          state.setShowTelemetryTicker(nextTicker);
          toast.info(
            nextTicker ? "Telemetry & World Clocks visible" : "Telemetry bar compact"
          );
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={isShortcutsOpen} onOpenChange={setShortcutsOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="hidden size-8 rounded-lg text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 xl:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                />
              }
            >
              <Keyboard className="size-3.5" />
            </DialogTrigger>
          }
        />
        <TooltipContent>Keyboard Shortcuts (Press ?)</TooltipContent>
      </Tooltip>

      <DialogContent className="rounded-2xl border-zinc-200/90 bg-white text-zinc-900 shadow-2xl sm:max-w-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Keyboard className="size-4" />
            </span>
            Command Center Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Instant broadcast hotkeys available anywhere outside text inputs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 last:sm:col-span-2 dark:border-zinc-800/80 dark:bg-zinc-900/50"
            >
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-zinc-800 uppercase dark:text-zinc-200">
                {group.icon}
                <span>{group.title}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.keys.map((k, i) =>
                        k === "–" ? (
                          <span
                            key={`${item.description}-sep-${i}`}
                            className="text-zinc-400"
                          >
                            –
                          </span>
                        ) : (
                          <kbd
                            key={`${item.description}-${k}`}
                            className="inline-flex min-w-6 items-center justify-center rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
