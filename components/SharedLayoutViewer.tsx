"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tv,
  Copy,
  ArrowLeft,
  VolumeX,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreamGrid } from "@/components/StreamGrid";
import { LiveChatSidebar } from "@/components/LiveChatSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GridPresetIcon } from "@/components/GridPresetIcon";
import { useStreamStore } from "@/store/useStreamStore";
import type { PublicLayoutDetail } from "@/actions/layouts";
import { cn } from "@/lib/utils";

interface SharedLayoutViewerProps {
  layout: PublicLayoutDetail;
}

export function SharedLayoutViewer({ layout }: SharedLayoutViewerProps) {
  const router = useRouter();
  const loadLayoutConfig = useStreamStore((s) => s.loadLayoutConfig);
  const streams = useStreamStore((s) => s.streams);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const hasActiveAudio = unmutedVideoIds.length > 0;
  const isChatOpen = useStreamStore((s) => s.isChatOpen);
  const toggleGlobalAudio = useStreamStore((s) => s.toggleGlobalAudio);
  const toggleChat = useStreamStore((s) => s.toggleChat);

  useEffect(() => {
    loadLayoutConfig({
      gridPreset: layout.gridPreset,
      streams: layout.streams,
    });
  }, [layout.gridPreset, layout.streams, loadLayoutConfig]);

  const handleCopyShareUrl = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Shared layout URL copied to clipboard!");
  };

  const handleCloneToStudio = () => {
    loadLayoutConfig({
      gridPreset: layout.gridPreset,
      streams: layout.streams,
    });
    toast.success(`Cloned "${layout.title}" into your local studio!`);
    router.push("/");
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Shared Theater Header Bar (h-16) */}
      <header className="relative z-30 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/85 px-4 shadow-2xs backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent" />

        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-zinc-100/80 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Studio Home</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
              <Tv className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {layout.title}
                </h1>
                <Badge
                  variant="secondary"
                  className="gap-1 bg-zinc-100 font-mono text-[10px] text-emerald-700 dark:bg-zinc-800 dark:text-emerald-300"
                >
                  <GridPresetIcon
                    preset={layout.gridPreset}
                    className="size-3"
                  />
                  {layout.gridPreset}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <User className="size-3 text-zinc-400 dark:text-zinc-500" />
                <span>Curated by {layout.authorName || "Studio Director"}</span>
                <span>•</span>
                <span>
                  {layout.streams.length} stream
                  {layout.streams.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
              "h-8 gap-1.5 rounded-lg text-xs",
              hasActiveAudio
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-zinc-200/90 bg-zinc-100/80 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            )}
          >
            {hasActiveAudio ? (
              <>
                <span className="flex h-3.5 items-end gap-0.5 px-0.5">
                  <span className="w-0.5 rounded-full bg-emerald-600 animate-eq-1 dark:bg-emerald-400" />
                  <span className="w-0.5 rounded-full bg-emerald-600 animate-eq-2 dark:bg-emerald-400" />
                  <span className="w-0.5 rounded-full bg-emerald-600 animate-eq-3 dark:bg-emerald-400" />
                </span>
                <span className="hidden md:inline">
                  Mute All ({unmutedVideoIds.length})
                </span>
              </>
            ) : (
              <>
                <VolumeX className="size-3.5" />
                <span className="hidden md:inline">Muted</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareUrl}
            className="h-8 gap-1.5 rounded-lg border-zinc-200/90 bg-zinc-100/80 text-xs text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Copy className="size-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleCloneToStudio}
            className="h-8 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Open in Full Studio</span>
          </Button>

          <ThemeToggle />

          <Button
            type="button"
            variant={isChatOpen ? "default" : "outline"}
            size="sm"
            onClick={toggleChat}
            className={cn(
              "h-8 gap-1.5 rounded-lg text-xs",
              isChatOpen
                ? "bg-sky-600 text-white hover:bg-sky-500"
                : "border-zinc-200/90 bg-zinc-100/80 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            )}
          >
            <MessageSquare className="size-3.5" />
            <span className="hidden lg:inline">Live Chat</span>
          </Button>
        </div>
      </header>

      {/* Main Theater Viewport */}
      <main className="flex min-h-0 w-full flex-1 overflow-hidden">
        <StreamGrid />
        <LiveChatSidebar />
      </main>
    </div>
  );
}
