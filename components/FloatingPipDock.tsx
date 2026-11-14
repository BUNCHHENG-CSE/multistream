"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  GripHorizontal,
  Volume2,
  VolumeX,
  Minimize2,
  X,
  PictureInPicture2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getStreamPlatform,
  getStreamPlatformMeta,
  getYouTubeEmbedUrl,
  sendYouTubeCommand,
  sendYouTubeListening,
} from "@/lib/youtube";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

type PipSize = "sm" | "md" | "lg";

const PIP_WIDTH_MAP: Record<PipSize, number> = {
  sm: 320,
  md: 420,
  lg: 520,
};

export function FloatingPipDock() {
  const pipVideoId = useStreamStore((s) => s.pipVideoId);
  const streams = useStreamStore((s) => s.streams);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const masterVolume = useStreamStore((s) => s.masterVolume);
  const streamVolumes = useStreamStore((s) => s.streamVolumes);
  const setPipVideoId = useStreamStore((s) => s.setPipVideoId);
  const toggleStreamAudio = useStreamStore((s) => s.toggleStreamAudio);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pipSize, setPipSize] = useState<PipSize>("md");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const embedDomain = useSyncExternalStore(
    emptySubscribe,
    () => window.location.hostname || "localhost",
    () => "localhost"
  );

  const pipStream = useMemo(
    () => streams.find((s) => s.videoId === pipVideoId) ?? null,
    [streams, pipVideoId]
  );

  const isYouTube = pipStream
    ? getStreamPlatform(pipStream.videoId) === "youtube"
    : false;
  const isAudioActive = pipStream
    ? unmutedVideoIds.includes(pipStream.videoId)
    : false;
  const effectiveVolume = pipStream
    ? Math.round(
        ((streamVolumes[pipStream.videoId] ?? 100) * masterVolume) / 100
      )
    : 0;

  const embedUrl = useMemo(() => {
    if (!pipStream) return "";
    return getYouTubeEmbedUrl(pipStream.videoId, {
      autoplay: true,
      mute: true,
      domain: embedDomain,
    });
  }, [pipStream, embedDomain]);

  // Sync audio to Floating PiP YouTube player
  useEffect(() => {
    if (!isLoaded || !iframeRef.current || !pipStream || !isYouTube) return;
    const iframe = iframeRef.current;
    const apply = () => {
      sendYouTubeListening(iframe, `${pipStream.videoId}-pip`);
      if (isAudioActive && effectiveVolume > 0) {
        sendYouTubeCommand(iframe, "unMute");
        sendYouTubeCommand(iframe, "setVolume", [effectiveVolume]);
      } else {
        sendYouTubeCommand(iframe, "mute");
      }
    };
    apply();
    const t = window.setTimeout(apply, 250);
    return () => window.clearTimeout(t);
  }, [isLoaded, pipStream, isYouTube, isAudioActive, effectiveVolume]);

  const widthPx = PIP_WIDTH_MAP[pipSize];
  const heightPx = Math.round((widthPx * 9) / 16) + 38;

  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
      const currentX =
        position?.x ??
        rect?.left ??
        Math.max(16, window.innerWidth - widthPx - 24);
      const currentY =
        position?.y ??
        rect?.top ??
        Math.max(76, window.innerHeight - heightPx - 64);

      dragOffsetRef.current = {
        dx: e.clientX - currentX,
        dy: e.clientY - currentY,
      };
      setPosition({ x: currentX, y: currentY });
      setIsDragging(true);
    },
    [position, widthPx, heightPx]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      const maxX = Math.max(12, window.innerWidth - widthPx - 12);
      const maxY = Math.max(68, window.innerHeight - heightPx - 12);
      const nextX = Math.max(
        12,
        Math.min(maxX, e.clientX - dragOffsetRef.current.dx)
      );
      const nextY = Math.max(
        68,
        Math.min(maxY, e.clientY - dragOffsetRef.current.dy)
      );
      setPosition({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, widthPx, heightPx]);

  if (!pipStream) {
    return null;
  }

  const platformMeta = getStreamPlatformMeta(pipStream.videoId);

  return (
    <div
      style={{
        width: `${widthPx}px`,
        ...(position
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : { right: "1.25rem", bottom: "4rem" }),
      }}
      className={cn(
        "fixed z-45 flex flex-col overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl transition-shadow",
        isDragging && "ring-2 ring-emerald-400 shadow-emerald-500/20"
      )}
    >
      {/* Draggable Title Bar */}
      <div
        onPointerDown={handleDragStart}
        className="flex h-9.5 cursor-grab items-center justify-between gap-2 border-b border-white/10 bg-zinc-900/95 px-2.5 text-zinc-100 select-none active:cursor-grabbing"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <GripHorizontal className="size-3.5 shrink-0 text-zinc-400" />
          <PictureInPicture2 className="size-3.5 shrink-0 text-emerald-400" />
          <span
            className={cn(
              "shrink-0 rounded border px-1 py-0 text-[9px] font-bold",
              platformMeta.badgeClass
            )}
          >
            {platformMeta.shortLabel}
          </span>
          <span className="truncate text-[11px] font-semibold">
            {pipStream.label}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Size Switcher */}
          <div className="hidden items-center rounded-md border border-white/10 bg-black/40 p-0.5 sm:inline-flex">
            {(["sm", "md", "lg"] as PipSize[]).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setPipSize(sz)}
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase transition",
                  pipSize === sz
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {sz === "sm" ? "S" : sz === "md" ? "M" : "L"}
              </button>
            ))}
          </div>

          {isYouTube && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => toggleStreamAudio(pipStream.videoId)}
              title={isAudioActive ? "Mute PiP stream" : "Unmute PiP stream"}
              className={cn(
                "size-6 rounded-md",
                isAudioActive
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-zinc-400 hover:bg-white/10 hover:text-white"
              )}
            >
              {isAudioActive ? (
                <Volume2 className="size-3.5" />
              ) : (
                <VolumeX className="size-3.5" />
              )}
            </Button>
          )}

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => {
              setPipVideoId(null);
              toast.info(`Returned "${pipStream.label}" to grid`);
            }}
            title="Dock back into grid"
            className="size-6 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Minimize2 className="size-3.5" />
          </Button>

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => setPipVideoId(null)}
            title="Close Floating PiP Dock"
            className="size-6 rounded-md text-zinc-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 16:9 Floating Video Viewport */}
      <div className="relative aspect-video w-full bg-black">
        <iframe
          key={`pip-${pipStream.videoId}`}
          ref={iframeRef}
          src={embedUrl}
          title={`PiP: ${pipStream.label}`}
          onLoad={() => setIsLoaded(true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={cn(
            "h-full w-full border-0",
            isDragging && "pointer-events-none"
          )}
        />
      </div>
    </div>
  );
}
