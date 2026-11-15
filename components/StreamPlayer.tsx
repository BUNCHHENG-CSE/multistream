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
  Volume2,
  VolumeX,
  ArrowUpLeft,
  MessageSquare,
  X,
  Radio,
  Pencil,
  Check,
  Play,
  Pause,
  ExternalLink,
  Maximize2,
  Minimize2,
  Settings,
  Gauge,
  SlidersHorizontal,
  Zap,
  RotateCcw,
  RotateCw,
  GripVertical,
  AlertTriangle,
  RefreshCw,
  Leaf,
  PictureInPicture2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CURATED_LIVE_STREAMS,
  getYouTubeEmbedUrl,
  getStreamExternalUrl,
  getStreamPlatform,
  getStreamPlatformMeta,
  sendYouTubeCommand,
  sendYouTubeListening,
  formatYouTubeQualityLabel,
  YOUTUBE_PLAYBACK_SPEEDS,
  YOUTUBE_QUALITY_OPTIONS,
  type YouTubeQualityLevel,
} from "@/lib/youtube";
import { useStreamStore, type StreamItem } from "@/store/useStreamStore";
import { YoutubeFeedSlot } from "@/components/YoutubeFeedSlot";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

interface StreamPlayerProps {
  stream: StreamItem;
  index: number;
  isMainSlot?: boolean;
  isAsymmetricLayout?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  anyTileDragging?: boolean;
  onDragStartTile?: (index: number) => void;
  onDragOverTile?: (e: React.DragEvent, index: number) => void;
  onDropTile?: (index: number) => void;
  onDragEndTile?: () => void;
}

export const StreamPlayer = React.memo(function StreamPlayer({
  stream,
  index,
  isMainSlot = false,
  isAsymmetricLayout = false,
  isDragging = false,
  isDragOver = false,
  anyTileDragging = false,
  onDragStartTile,
  onDragOverTile,
  onDropTile,
  onDragEndTile,
}: StreamPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasStreamError, setHasStreamError] = useState(false);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(stream.label);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [qualitySetting, setQualitySetting] =
    useState<YouTubeQualityLevel>("auto");
  const [reportedQuality, setReportedQuality] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBrowsingYouTube, setIsBrowsingYouTube] = useState(false);

  const embedDomain = useSyncExternalStore(
    emptySubscribe,
    () => window.location.hostname || "localhost",
    () => "localhost"
  );

  // Fine-grained Zustand selectors to prevent unnecessary re-renders
  const isAudioActive = useStreamStore((s) =>
    s.unmutedVideoIds.includes(stream.videoId)
  );
  const focusedVideoId = useStreamStore((s) => s.focusedVideoId);
  const muteSyncVersion = useStreamStore((s) => s.muteSyncVersion);
  const syncLiveVersion = useStreamStore((s) => s.syncLiveVersion);
  const masterVolume = useStreamStore((s) => s.masterVolume);
  const volume = useStreamStore(
    (s) => s.streamVolumes[stream.videoId] ?? 100
  );
  const audioFollowsHover = useStreamStore((s) => s.audioFollowsHover);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const isChatFocused = useStreamStore(
    (s) => s.activeChatVideoId === stream.videoId && s.isChatOpen
  );
  const gridPreset = useStreamStore((s) => s.gridPreset);
  const streamCount = useStreamStore((s) => s.streams.length);
  const pipVideoId = useStreamStore((s) => s.pipVideoId);
  const isSplitterDragging = useStreamStore((s) => s.isSplitterDragging);

  const toggleStreamAudio = useStreamStore((s) => s.toggleStreamAudio);
  const setStreamAudio = useStreamStore((s) => s.setStreamAudio);
  const setStreamVolume = useStreamStore((s) => s.setStreamVolume);
  const toggleSoloFocus = useStreamStore((s) => s.toggleSoloFocus);
  const promoteToMain = useStreamStore((s) => s.promoteToMain);
  const setActiveChatStream = useStreamStore((s) => s.setActiveChatStream);
  const removeStream = useStreamStore((s) => s.removeStream);
  const replaceStream = useStreamStore((s) => s.replaceStream);
  const updateStreamLabel = useStreamStore((s) => s.updateStreamLabel);
  const setGridPreset = useStreamStore((s) => s.setGridPreset);
  const setPipVideoId = useStreamStore((s) => s.setPipVideoId);
  const setStreamQuality = useStreamStore((s) => s.setStreamQuality);
  const addBookmark = useStreamStore((s) => s.addBookmark);
  const isDockedInPip = pipVideoId === stream.videoId;

  const platform = getStreamPlatform(stream.videoId);
  const platformMeta = getStreamPlatformMeta(stream.videoId);
  const isYouTube = platform === "youtube";

  const isFocused = focusedVideoId === stream.videoId;
  const isHalfOptimized = focusedVideoId !== null && !isFocused;
  const isEcoForced = ecoModeEnabled && !isFocused && !isMainSlot;

  const effectiveVolume = isAudioActive
    ? Math.max(
        0,
        Math.round(
          ((volume * masterVolume) / 100) * (isHalfOptimized ? 0.5 : 1)
        )
      )
    : 0;

  const effectiveQuality: YouTubeQualityLevel =
    qualitySetting !== "auto"
      ? qualitySetting
      : isEcoForced
        ? "small"
        : isHalfOptimized
          ? "medium"
          : "auto";

  const qualitySummaryLabel =
    qualitySetting === "auto"
      ? isEcoForced
        ? "Eco (240p)"
        : isHalfOptimized
          ? "Auto (360p Half)"
          : `Auto (${formatYouTubeQualityLabel(reportedQuality)})`
      : (YOUTUBE_QUALITY_OPTIONS.find((q) => q.value === qualitySetting)
          ?.badge ?? "Auto");
  const speedSummaryLabel = playbackRate === 1 ? "Normal" : `${playbackRate}x`;

  const lastCommandSentAtRef = useRef<number>(0);
  const hasConfirmedUnmutedRef = useRef<boolean>(false);
  const isAudioActiveRef = useRef<boolean>(isAudioActive);
  const effectiveVolumeRef = useRef<number>(effectiveVolume);
  const effectiveQualityRef = useRef<YouTubeQualityLevel>(effectiveQuality);
  const qualitySettingRef = useRef<YouTubeQualityLevel>(qualitySetting);
  const playbackRateRef = useRef<number>(playbackRate);
  const prevSyncVersionRef = useRef<number>(syncLiveVersion);

  useEffect(() => {
    isAudioActiveRef.current = isAudioActive;
    effectiveVolumeRef.current = effectiveVolume;
    effectiveQualityRef.current = effectiveQuality;
    qualitySettingRef.current = qualitySetting;
    playbackRateRef.current = playbackRate;
    if (!isAudioActive) {
      hasConfirmedUnmutedRef.current = false;
    }
  }, [
    isAudioActive,
    effectiveVolume,
    effectiveQuality,
    qualitySetting,
    playbackRate,
  ]);

  const applyPlayerQualityAndSpeed = useCallback(
    (
      iframe: HTMLIFrameElement | null,
      effQuality: YouTubeQualityLevel,
      userQuality: YouTubeQualityLevel,
      rate: number
    ) => {
      if (!iframe || !isYouTube) return;
      sendYouTubeCommand(iframe, "setPlaybackRate", [rate]);
      if (effQuality === "auto") {
        sendYouTubeCommand(iframe, "setPlaybackQualityRange", [
          "default",
          "hd1080",
        ]);
        sendYouTubeCommand(iframe, "setPlaybackQuality", ["default"]);
      } else if (effQuality === "medium" && userQuality === "auto") {
        sendYouTubeCommand(iframe, "setPlaybackQualityRange", [
          "small",
          "medium",
        ]);
        sendYouTubeCommand(iframe, "setPlaybackQuality", ["medium"]);
      } else if (effQuality === "small" && userQuality === "auto") {
        sendYouTubeCommand(iframe, "setPlaybackQualityRange", [
          "tiny",
          "small",
        ]);
        sendYouTubeCommand(iframe, "setPlaybackQuality", ["small"]);
      } else {
        sendYouTubeCommand(iframe, "setPlaybackQualityRange", [
          effQuality,
          effQuality,
        ]);
        sendYouTubeCommand(iframe, "setPlaybackQuality", [effQuality]);
      }
    },
    [isYouTube]
  );

  const syncPlayerAudio = useCallback(
    (
      iframe: HTMLIFrameElement | null,
      active: boolean,
      effVol: number,
      effQuality: YouTubeQualityLevel,
      userQuality: YouTubeQualityLevel,
      rate: number
    ) => {
      if (!iframe || !isYouTube) return;
      lastCommandSentAtRef.current = Date.now();
      sendYouTubeListening(iframe, stream.videoId);
      if (active && effVol > 0) {
        sendYouTubeCommand(iframe, "unMute");
        sendYouTubeCommand(iframe, "setVolume", [effVol]);
      } else {
        sendYouTubeCommand(iframe, "mute");
      }

      applyPlayerQualityAndSpeed(iframe, effQuality, userQuality, rate);
    },
    [applyPlayerQualityAndSpeed, isYouTube, stream.videoId]
  );

  // Stable embed URL — never depends on `isAudioActive` so toggling audio never reloads the iframe
  const embedUrl = useMemo(
    () =>
      getYouTubeEmbedUrl(stream.videoId, {
        autoplay: true,
        mute: true,
        domain: embedDomain,
      }),
    [stream.videoId, embedDomain]
  );

  // Sync audio, quality & playback speed via YouTube IFrame Player API postMessage
  useEffect(() => {
    if (!isLoaded || !iframeRef.current || !isYouTube) return;

    const iframe = iframeRef.current;
    syncPlayerAudio(
      iframe,
      isAudioActive,
      effectiveVolume,
      effectiveQuality,
      qualitySetting,
      playbackRate
    );

    const retryTimer1 = window.setTimeout(() => {
      syncPlayerAudio(
        iframe,
        isAudioActive,
        effectiveVolume,
        effectiveQuality,
        qualitySetting,
        playbackRate
      );
    }, 150);

    const retryTimer2 = window.setTimeout(() => {
      syncPlayerAudio(
        iframe,
        isAudioActive,
        effectiveVolume,
        effectiveQuality,
        qualitySetting,
        playbackRate
      );
    }, 500);

    return () => {
      window.clearTimeout(retryTimer1);
      window.clearTimeout(retryTimer2);
    };
  }, [
    isAudioActive,
    isLoaded,
    isYouTube,
    effectiveVolume,
    effectiveQuality,
    qualitySetting,
    playbackRate,
    muteSyncVersion,
    syncPlayerAudio,
  ]);

  // Global Sync-to-Live-Edge command listener
  useEffect(() => {
    if (syncLiveVersion === prevSyncVersionRef.current) return;
    prevSyncVersionRef.current = syncLiveVersion;
    if (!isLoaded || !iframeRef.current) return;

    if (isYouTube) {
      sendYouTubeCommand(iframeRef.current, "seekTo", [999999, true]);
      sendYouTubeCommand(iframeRef.current, "playVideo");
      setIsPaused(false);
    } else {
      setIsLoaded(false);
      setReloadKey((k) => k + 1);
    }
  }, [syncLiveVersion, isLoaded, isYouTube]);

  // Listen for YouTube IFrame Player API readiness, errors & native mute/unmute/quality events
  useEffect(() => {
    if (!isLoaded || !isYouTube) return;

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      let data: unknown = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== "object") return;
      const payload = data as {
        event?: string;
        info?:
          | number
          | {
              muted?: boolean;
              playbackQuality?: string;
              playbackRate?: number;
            };
      };

      if (payload.event === "onError") {
        const code = typeof payload.info === "number" ? payload.info : null;
        setErrorCode(code);
        setHasStreamError(true);
        return;
      }

      if (payload.event === "onReady" || payload.event === "initialDelivery") {
        setHasStreamError(false);
        setErrorCode(null);
        if (
          payload.info &&
          typeof payload.info === "object" &&
          typeof payload.info.playbackQuality === "string" &&
          payload.info.playbackQuality !== "unknown"
        ) {
          setReportedQuality(payload.info.playbackQuality);
          setStreamQuality(stream.videoId, payload.info.playbackQuality);
        }
        syncPlayerAudio(
          iframeRef.current,
          isAudioActiveRef.current,
          effectiveVolumeRef.current,
          effectiveQualityRef.current,
          qualitySettingRef.current,
          playbackRateRef.current
        );
        return;
      }

      if (
        payload.event === "infoDelivery" &&
        payload.info &&
        typeof payload.info === "object"
      ) {
        if (
          typeof payload.info.playbackQuality === "string" &&
          payload.info.playbackQuality !== "unknown"
        ) {
          setReportedQuality(payload.info.playbackQuality);
          setStreamQuality(stream.videoId, payload.info.playbackQuality);
        }

        if (typeof payload.info.muted === "boolean") {
          if (payload.info.muted === false) {
            hasConfirmedUnmutedRef.current = true;
            if (
              !isAudioActiveRef.current &&
              Date.now() - lastCommandSentAtRef.current >= 700
            ) {
              setStreamAudio(stream.videoId, true);
            }
          } else if (payload.info.muted === true) {
            if (isAudioActiveRef.current) {
              if (!hasConfirmedUnmutedRef.current) {
                syncPlayerAudio(
                  iframeRef.current,
                  true,
                  effectiveVolumeRef.current,
                  effectiveQualityRef.current,
                  qualitySettingRef.current,
                  playbackRateRef.current
                );
              } else if (Date.now() - lastCommandSentAtRef.current >= 700) {
                setStreamAudio(stream.videoId, false);
              }
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    isLoaded,
    isYouTube,
    setStreamAudio,
    setStreamQuality,
    stream.videoId,
    syncPlayerAudio,
  ]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    setHasStreamError(false);
    setErrorCode(null);
    if (isYouTube) {
      syncPlayerAudio(
        iframeRef.current,
        isAudioActive,
        effectiveVolume,
        effectiveQuality,
        qualitySetting,
        playbackRate
      );
    }
  };

  const handleReloadStream = () => {
    setHasStreamError(false);
    setErrorCode(null);
    setIsLoaded(false);
    setIsPaused(false);
    setReloadKey((k) => k + 1);
    toast.info(`Reloading "${stream.label}"...`);
  };

  const handleSwapWithCurated = () => {
    const activeIds = new Set(
      useStreamStore.getState().streams.map((item) => item.videoId)
    );
    const candidate = CURATED_LIVE_STREAMS.find(
      (c) => !activeIds.has(c.videoId)
    );
    if (!candidate) {
      toast.error("All curated live feeds are already active in your grid.");
      return;
    }
    const res = replaceStream(
      stream.videoId,
      candidate.videoId,
      candidate.label
    );
    if (res.success) {
      toast.success(`Swapped offline feed with "${candidate.label}"`);
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  const handlePlaybackRateChange = (nextRate: number) => {
    setPlaybackRate(nextRate);
    if (iframeRef.current && isYouTube) {
      sendYouTubeCommand(iframeRef.current, "setPlaybackRate", [nextRate]);
    }
    toast.info(`Playback speed: ${nextRate === 1 ? "Normal" : `${nextRate}x`}`);
  };

  const handleQualityChange = (nextQuality: YouTubeQualityLevel) => {
    setQualitySetting(nextQuality);
    if (iframeRef.current && isYouTube) {
      applyPlayerQualityAndSpeed(
        iframeRef.current,
        nextQuality,
        nextQuality,
        playbackRate
      );
    }
    const label =
      YOUTUBE_QUALITY_OPTIONS.find((q) => q.value === nextQuality)?.label ??
      nextQuality;
    toast.info(`Video quality: ${label}`);
  };

  const handleOptimizeHalfPreset = () => {
    setQualitySetting("medium");
    setPlaybackRate(0.5);
    setStreamVolume(stream.videoId, 50);
    if (iframeRef.current && isYouTube) {
      applyPlayerQualityAndSpeed(iframeRef.current, "medium", "medium", 0.5);
      if (isAudioActive) {
        const nextEffVol = Math.round(
          ((50 * masterVolume) / 100) * (isHalfOptimized ? 0.5 : 1)
        );
        sendYouTubeCommand(iframeRef.current, "setVolume", [nextEffVol]);
      }
    }
    toast.success(`Half Optimized "${stream.label}"`, {
      description: "Quality: 360p • Speed: 0.5x • Volume: 50%",
    });
  };

  const handleResetPlaybackDefaults = () => {
    setQualitySetting("auto");
    setPlaybackRate(1);
    setStreamVolume(stream.videoId, 100);
    if (iframeRef.current && isYouTube) {
      applyPlayerQualityAndSpeed(
        iframeRef.current,
        isHalfOptimized ? "medium" : "auto",
        "auto",
        1
      );
      if (isAudioActive) {
        const nextEffVol = Math.round(
          masterVolume * (isHalfOptimized ? 0.5 : 1)
        );
        sendYouTubeCommand(iframeRef.current, "setVolume", [nextEffVol]);
      }
    }
    toast.info(`Reset "${stream.label}" to Auto (720p60) • Normal`);
  };

  const handleTogglePlayPause = () => {
    if (!iframeRef.current || !isYouTube) return;
    if (isPaused) {
      sendYouTubeCommand(iframeRef.current, "playVideo");
      setIsPaused(false);
    } else {
      sendYouTubeCommand(iframeRef.current, "pauseVideo");
      setIsPaused(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = Number(e.target.value);
    setStreamVolume(stream.videoId, nextVol);
    if (iframeRef.current && isAudioActive && isYouTube) {
      const nextEffVol = Math.max(
        0,
        Math.round(
          ((nextVol * masterVolume) / 100) * (isHalfOptimized ? 0.5 : 1)
        )
      );
      sendYouTubeCommand(iframeRef.current, "setVolume", [nextEffVol]);
    }
  };

  const handleToggleSingleSpotlight = () => {
    if (gridPreset === "1x1") {
      const restored = streamCount <= 2 ? "1x2" : streamCount <= 4 ? "1+3" : "3x3";
      setGridPreset(restored);
      toast.info(`Restored ${restored} multi-stream view`);
    } else {
      if (index > 0) {
        promoteToMain(stream.videoId);
      }
      setGridPreset("1x1");
      toast.info(`Spotlighted "${stream.label}" in 1x1 Cinema view`);
    }
  };

  const handleSaveLabel = () => {
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== stream.label) {
      updateStreamLabel(stream.videoId, trimmed);
      toast.success("Stream label updated");
    } else {
      setDraftLabel(stream.label);
    }
    setIsEditingLabel(false);
  };

  const handleTileMouseEnter = () => {
    if (!audioFollowsHover || anyTileDragging) return;
    if (!isFocused) {
      toggleSoloFocus(stream.videoId);
    } else if (!isAudioActive) {
      setStreamAudio(stream.videoId, true);
    }
  };

  if (isBrowsingYouTube) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#0f0f0f]">
        <YoutubeFeedSlot
          slotIndex={index}
          onClose={() => setIsBrowsingYouTube(false)}
          onSelectVideo={(newId, newTitle) => {
            replaceStream(stream.videoId, newId, newTitle);
            setIsBrowsingYouTube(false);
            toast.success(`Switched to "${newTitle}"`);
          }}
        />
      </div>
    );
  }

  return (
    <div
      onMouseEnter={handleTileMouseEnter}
      onDragOver={(e) => {
        if (onDragOverTile) {
          onDragOverTile(e, index);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onDropTile) {
          onDropTile(index);
        }
      }}
      className={cn(
        "group/tile relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-zinc-950 transition-all duration-200",
        isDragging && "scale-[0.98] opacity-55 ring-2 ring-sky-500/50",
        isDragOver &&
          "border-sky-400 ring-2 ring-sky-400 shadow-xl shadow-sky-500/20",
        !isDragOver &&
          (isHalfOptimized
            ? "border-zinc-800/80 opacity-95 hover:opacity-100"
            : isFocused || isAudioActive
              ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
              : isChatFocused
                ? "border-sky-500/75 ring-1 ring-sky-500/30"
                : "border-zinc-200/90 shadow-xs hover:border-zinc-300 dark:border-zinc-800/90 dark:hover:border-zinc-700")
      )}
    >
      {/* Drag-and-Drop Target Overlay */}
      {isDragOver && !isDragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-sky-950/75 backdrop-blur-xs">
          <div className="rounded-xl border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-center shadow-lg">
            <div className="font-mono text-xs font-bold tracking-wider text-sky-200 uppercase">
              Drop to Swap Position #0{index + 1}
            </div>
            <div className="mt-0.5 text-[11px] text-sky-300/90">
              {stream.label}
            </div>
          </div>
        </div>
      )}

      {/* Persistent subtle telemetry pills when not hovering */}
      <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 flex flex-wrap items-center gap-1.5 transition-opacity duration-200 group-hover/tile:opacity-0">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/70 px-2 py-0.5 text-[11px] font-medium text-zinc-200 backdrop-blur-md">
          <span className="font-mono text-[10px] font-bold text-emerald-400">
            0{index + 1}
          </span>
          <span
            className={cn(
              "rounded border px-1 py-0 text-[9px] font-bold",
              platformMeta.badgeClass
            )}
          >
            {platformMeta.shortLabel}
          </span>
          <span className="max-w-[150px] truncate">{stream.label}</span>
        </span>

        {isAudioActive && isFocused && (
          <Badge className="gap-1.5 border-emerald-500/40 bg-emerald-950/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
            <span className="flex h-2.5 items-end gap-0.5">
              <span className="w-0.5 rounded-full bg-emerald-400 animate-eq-1" />
              <span className="w-0.5 rounded-full bg-emerald-400 animate-eq-2" />
              <span className="w-0.5 rounded-full bg-emerald-400 animate-eq-3" />
            </span>
            SOLO ({effectiveVolume}% • HD)
          </Badge>
        )}

        {isAudioActive && isHalfOptimized && (
          <Badge className="gap-1.5 border-amber-500/40 bg-amber-950/85 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md">
            <span className="flex h-2.5 items-end gap-0.5">
              <span className="w-0.5 rounded-full bg-amber-400 animate-eq-1" />
              <span className="w-0.5 rounded-full bg-amber-400 animate-eq-2" />
            </span>
            HALF MODE ({effectiveVolume}% • ECO)
          </Badge>
        )}

        {isAudioActive && !isFocused && !isHalfOptimized && (
          <Badge className="gap-1.5 border-emerald-500/40 bg-emerald-950/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
            <span className="flex h-2.5 items-end gap-0.5">
              <span className="w-0.5 rounded-full bg-emerald-400 animate-eq-1" />
              <span className="w-0.5 rounded-full bg-emerald-400 animate-eq-2" />
              <span className="w-0.5 rounded-full bg-emerald-400 animate-eq-3" />
            </span>
            AUDIO ON ({effectiveVolume}%)
          </Badge>
        )}

        {!isAudioActive && isHalfOptimized && (
          <Badge className="border-zinc-700/80 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
            MUTED • ECO
          </Badge>
        )}

        {isPaused && (
          <Badge className="border-amber-500/40 bg-amber-950/90 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md">
            PAUSED
          </Badge>
        )}

        {isYouTube && (
          <Badge
            variant="secondary"
            className="border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-300 backdrop-blur-md"
          >
            {isEcoForced && <Leaf className="mr-1 size-2.5 text-amber-400" />}
            {qualitySummaryLabel}
            {playbackRate !== 1 ? ` • ${speedSummaryLabel}` : ""}
          </Badge>
        )}

        {isMainSlot && isAsymmetricLayout && (
          <Badge
            variant="secondary"
            className="border-amber-500/30 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md"
          >
            MAIN STAGE
          </Badge>
        )}

        {isChatFocused && (
          <Badge
            variant="secondary"
            className="border-sky-500/30 bg-sky-950/90 px-2 py-0.5 text-[10px] font-semibold text-sky-300 backdrop-blur-md"
          >
            CHAT ACTIVE
          </Badge>
        )}
      </div>

      {/* Auto-hiding Floating Glassmorphic HUD Header (Single-line, Zero-wrap) */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 bg-gradient-to-b from-black/95 via-black/80 to-transparent px-2.5 pb-6 pt-2 text-zinc-100 opacity-0 transition-opacity duration-200 group-hover/tile:opacity-100 focus-within:opacity-100",
          (isSettingsOpen || isEditingLabel) && "opacity-100"
        )}
      >
        {/* Left: Drag Handle + Stream Index + Platform + Editable Label */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {streamCount > 1 && (
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(index));
                onDragStartTile?.(index);
              }}
              onDragEnd={() => onDragEndTile?.()}
              title="Drag to reorder stream tile"
              className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded-md bg-zinc-900/80 text-zinc-400 ring-1 ring-white/10 transition hover:bg-zinc-800 hover:text-zinc-100 active:cursor-grabbing"
            >
              <GripVertical className="size-3.5" />
            </button>
          )}

          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            0{index + 1}
          </span>

          <span
            className={cn(
              "hidden shrink-0 rounded border px-1 py-0 text-[9px] font-bold sm:inline-flex",
              platformMeta.badgeClass
            )}
          >
            {platformMeta.shortLabel}
          </span>

          {isEditingLabel ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveLabel();
              }}
              className="flex min-w-0 flex-1 items-center gap-1"
            >
              <input
                type="text"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                onBlur={handleSaveLabel}
                autoFocus
                className="h-6 w-full max-w-[180px] rounded-md border border-zinc-700 bg-zinc-900/95 px-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
              />
              <Button
                type="submit"
                size="icon-xs"
                variant="ghost"
                className="text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300"
              >
                <Check className="size-3.5" />
              </Button>
            </form>
          ) : (
            <div className="flex min-w-0 items-center gap-1">
              <span
                className="max-w-[120px] truncate text-xs font-semibold text-zinc-100 drop-shadow sm:max-w-[180px] md:max-w-[260px]"
                title={stream.label}
              >
                {stream.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraftLabel(stream.label);
                  setIsEditingLabel(true);
                }}
                className="rounded p-0.5 text-zinc-400 opacity-60 transition hover:bg-white/10 hover:text-zinc-100 hover:opacity-100"
                title="Rename stream label"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Streamlined Control Bar (Essential Quick Actions + Organized Menu) */}
        <div className="flex shrink-0 items-center gap-1">
          {/* 1. Solo Focus + Independent Audio Mute/Unmute + Volume Slider */}
          {isYouTube && (
            <div className="flex items-center rounded-md bg-zinc-900/90 p-0.5 ring-1 ring-white/10 backdrop-blur-md">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="xs"
                      variant={isFocused ? "default" : "secondary"}
                      onClick={() => {
                        const nowFocused = toggleSoloFocus(stream.videoId);
                        if (nowFocused) {
                          toast.success(`Solo Focus: ${stream.label}`, {
                            description:
                              "Playing at 100% — other streams set to 50% volume, Eco quality & half size.",
                          });
                        } else {
                          toast.info(
                            "Exited Solo Focus — restored equal stream volume & layout"
                          );
                        }
                      }}
                      className={cn(
                        "h-6 gap-1 rounded-sm px-2 text-[11px] font-semibold transition-all shadow-2xs",
                        isFocused
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      )}
                    />
                  }
                >
                  <Volume2
                    className={cn(
                      "size-3.5",
                      isFocused ? "text-white" : "text-emerald-400"
                    )}
                  />
                  <span>
                    {isFocused ? "Solo On" : "Solo"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {isFocused
                    ? "Exit Solo Focus (restore equal volume, quality & grid size)"
                    : "Solo Focus: 100% audio & HD here, duck other streams"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        const nowUnmuted = toggleStreamAudio(stream.videoId);
                        if (nowUnmuted) {
                          toast.success(`Unmuted "${stream.label}"`);
                        } else {
                          toast.info(`Muted "${stream.label}"`);
                        }
                      }}
                      className={cn(
                        "size-6 rounded-sm transition-colors",
                        isAudioActive
                          ? "text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      )}
                    />
                  }
                >
                  {isAudioActive ? (
                    <Volume2 className="size-3.5" />
                  ) : (
                    <VolumeX className="size-3.5" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {isAudioActive
                    ? "Mute this stream"
                    : "Unmute this stream (keeps other streams playing)"}
                </TooltipContent>
              </Tooltip>

              {isAudioActive && (
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={volume}
                  onChange={handleVolumeChange}
                  aria-label="Stream volume"
                  title={
                    isHalfOptimized
                      ? `Volume: ${effectiveVolume}% (50% Half Mode)`
                      : `Volume: ${effectiveVolume}%`
                  }
                  className="mr-1 hidden h-1 w-12 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-emerald-400 sm:inline-block"
                />
              )}
            </div>
          )}

          {/* 2. Spotlight 1x1 Cinema View */}
          {streamCount > 1 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    onClick={handleToggleSingleSpotlight}
                    className={cn(
                      "bg-zinc-900/90 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white",
                      gridPreset === "1x1" &&
                        "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40"
                    )}
                  />
                }
              >
                {gridPreset === "1x1" ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {gridPreset === "1x1"
                  ? "Return to multi-stream grid"
                  : "Spotlight this stream in 1x1 Cinema view"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* 3. Live Chat Focus */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  onClick={() => {
                    setActiveChatStream(stream.videoId, true);
                  }}
                  className={cn(
                    "bg-zinc-900/90 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white",
                    isChatFocused &&
                      "bg-sky-500/25 text-sky-300 ring-sky-500/50"
                  )}
                />
              }
            >
              <MessageSquare className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Focus Live Chat on this stream</TooltipContent>
          </Tooltip>

          {/* 4. Consolidated Stream Options & Controls Menu */}
          <DropdownMenu
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        className={cn(
                          "relative bg-zinc-900/90 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white",
                          (qualitySetting !== "auto" ||
                            playbackRate !== 1 ||
                            isDockedInPip ||
                            isPaused) &&
                            "text-emerald-300 ring-emerald-500/40"
                        )}
                      />
                    }
                  >
                    <MoreHorizontal className="size-3.5" />
                    {(qualitySetting !== "auto" ||
                      playbackRate !== 1 ||
                      isDockedInPip) && (
                      <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-400" />
                    )}
                  </DropdownMenuTrigger>
                }
              />
              <TooltipContent>Stream options & settings</TooltipContent>
            </Tooltip>

            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-64 rounded-xl border border-white/15 bg-zinc-900/95 p-1.5 text-zinc-100 shadow-2xl backdrop-blur-xl"
            >
              {/* Playback & Feed Actions */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  Playback & Feed
                </DropdownMenuLabel>

                {isYouTube && (
                  <DropdownMenuItem
                    onClick={handleTogglePlayPause}
                    className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                  >
                    {isPaused ? (
                      <>
                        <Play className="size-3.5 fill-current text-emerald-400" />
                        <span>Resume Playback</span>
                      </>
                    ) : (
                      <>
                        <Pause className="size-3.5 text-zinc-300" />
                        <span>Pause Playback</span>
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={handleReloadStream}
                  className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                >
                  <RotateCw className="size-3.5 text-zinc-300" />
                  <span>Reload & Resync Stream</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    if (isDockedInPip) {
                      setPipVideoId(null);
                      toast.info(`Returned "${stream.label}" to grid`);
                    } else {
                      setPipVideoId(stream.videoId);
                      toast.success(`Floated "${stream.label}" into PiP Dock`);
                    }
                  }}
                  className={cn(
                    "cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white",
                    isDockedInPip && "text-emerald-300"
                  )}
                >
                  <PictureInPicture2 className="size-3.5 text-zinc-300" />
                  <span>
                    {isDockedInPip
                      ? "Return from PiP Dock"
                      : "Float in PiP Mini-Player"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsBrowsingYouTube(true)}
                  className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                >
                  <Radio className="size-3.5 text-red-400" />
                  <span>Browse & Switch Feed</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1 bg-white/10" />

              {/* Layout & Stage Positioning */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  Layout & Stage
                </DropdownMenuLabel>

                {index > 0 && (
                  <DropdownMenuItem
                    onClick={() => {
                      promoteToMain(stream.videoId);
                      toast.info(`Promoted "${stream.label}" to Main Stage`);
                    }}
                    className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:bg-amber-500/15 focus:text-amber-200"
                  >
                    <ArrowUpLeft className="size-3.5 text-amber-400" />
                    <span>Promote to Main Stage</span>
                  </DropdownMenuItem>
                )}

                {gridPreset === "1x2" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        const target = index === 0 ? 65 : 35;
                        useStreamStore.getState().setSplit1x2Ratio(target);
                        toast.success(`Enlarged ${stream.label} to 65%`);
                      }}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-300 focus:bg-emerald-500/15 focus:text-emerald-200"
                    >
                      <Maximize2 className="size-3.5 text-emerald-400" />
                      <span>Enlarge Screen (65% Focus)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        useStreamStore.getState().setSplit1x2Ratio(50);
                        toast.info("Equalized dual screens (50:50)");
                      }}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:bg-white/10 focus:text-white"
                    >
                      <RotateCcw className="size-3.5 text-zinc-400" />
                      <span>Equalize Screens (50:50)</span>
                    </DropdownMenuItem>
                  </>
                )}

                {gridPreset === "1+3" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        useStreamStore.getState().setMainStageRatio(80);
                        toast.success("Enlarged Main Stage to 80%");
                      }}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-300 focus:bg-emerald-500/15 focus:text-emerald-200"
                    >
                      <Maximize2 className="size-3.5 text-emerald-400" />
                      <span>Enlarge Main Stage (80%)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        useStreamStore.getState().setMainStageRatio(70);
                        toast.info("Reset Main Stage to 70%");
                      }}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:bg-white/10 focus:text-white"
                    >
                      <RotateCcw className="size-3.5 text-zinc-400" />
                      <span>Default Stage (70%)</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>

              {isYouTube && (
                <>
                  <DropdownMenuSeparator className="my-1 bg-white/10" />

                  {/* Quality & Speed */}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Quality & Speed
                    </DropdownMenuLabel>

                    {/* Quality Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white data-open:bg-white/10 data-open:text-white">
                        <SlidersHorizontal className="size-3.5 text-zinc-300" />
                        <span>Quality</span>
                        <span className="ml-auto pr-1 text-xs text-emerald-400">
                          {qualitySummaryLabel}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 rounded-xl border border-white/15 bg-zinc-900/95 p-1 text-zinc-100 shadow-2xl backdrop-blur-xl">
                        <DropdownMenuRadioGroup
                          value={qualitySetting}
                          onValueChange={(value) => {
                            handleQualityChange(value as YouTubeQualityLevel);
                          }}
                        >
                          {YOUTUBE_QUALITY_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.value}
                              value={option.value}
                              className="cursor-pointer rounded-lg py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white"
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Playback speed submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white data-open:bg-white/10 data-open:text-white">
                        <Gauge className="size-3.5 text-zinc-300" />
                        <span>Speed</span>
                        <span className="ml-auto pr-1 text-xs text-zinc-400">
                          {speedSummaryLabel}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-44 rounded-xl border border-white/15 bg-zinc-900/95 p-1 text-zinc-100 shadow-2xl backdrop-blur-xl">
                        <DropdownMenuRadioGroup
                          value={String(playbackRate)}
                          onValueChange={(value) => {
                            const next = Number(value);
                            if (!Number.isNaN(next)) {
                              handlePlaybackRateChange(next);
                            }
                          }}
                        >
                          {YOUTUBE_PLAYBACK_SPEEDS.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.value}
                              value={String(option.value)}
                              className="cursor-pointer rounded-lg py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white"
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem
                      onClick={handleOptimizeHalfPreset}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-300 focus:bg-amber-500/15 focus:text-amber-200"
                    >
                      <Zap className="size-3.5 text-amber-400" />
                      <span>Optimize Half (360p • 50% Vol)</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleResetPlaybackDefaults}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:bg-white/10 focus:text-white"
                    >
                      <RotateCcw className="size-3.5 text-zinc-400" />
                      <span>Reset Defaults</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}

              <DropdownMenuSeparator className="my-1 bg-white/10" />

              {/* Tools & Bookmarks */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  Tools & External
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => {
                    const bm = addBookmark(
                      stream.videoId,
                      `Moment captured on ${stream.label}`
                    );
                    if (bm) {
                      toast.success(
                        `Bookmarked [${bm.elapsedLabel}] on ${stream.label}`
                      );
                    }
                  }}
                  className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                >
                  <Bookmark className="size-3.5 text-amber-400" />
                  <span>Bookmark Timestamp</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    window.open(
                      getStreamExternalUrl(stream.videoId),
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                >
                  <ExternalLink className="size-3.5 text-zinc-300" />
                  <span>Open on {platformMeta.label}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 5. Remove Stream */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  onClick={() => {
                    removeStream(stream.videoId);
                    toast(`Removed "${stream.label}"`);
                  }}
                  className="bg-zinc-900/90 text-zinc-400 ring-1 ring-white/10 hover:bg-red-500/25 hover:text-red-300"
                />
              }
            >
              <X className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Remove stream from grid</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Loading skeleton underneath iframe until loaded */}
      {!isDockedInPip && !isLoaded && !hasStreamError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-zinc-950 text-zinc-400">
          <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Radio className="size-5 animate-pulse" />
          </div>
          <span className="font-mono text-xs text-zinc-400">
            Connecting {platformMeta.label} feed ({stream.videoId})...
          </span>
        </div>
      )}

      {/* Offline / Stream Error Recovery Slate */}
      {!isDockedInPip && hasStreamError && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center gap-3 bg-zinc-950/95 p-6 text-center backdrop-blur-md">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <Badge className="mb-1.5 border-amber-500/40 bg-amber-500/15 font-mono text-[10px] text-amber-300">
              BROADCAST SIGNAL INTERRUPTED {errorCode ? `(CODE ${errorCode})` : ""}
            </Badge>
            <h3 className="text-sm font-bold text-zinc-100">{stream.label}</h3>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              This stream may have ended, gone offline, or restricted embedding.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              size="xs"
              onClick={handleReloadStream}
              className="gap-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-100 hover:bg-zinc-700"
            >
              <RefreshCw className="size-3" />
              Retry Feed
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={handleSwapWithCurated}
              className="gap-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <Radio className="size-3" />
              Swap Curated Live Feed
            </Button>
          </div>
        </div>
      )}

      {/* Docked in Floating PiP Slate (prevents duplicate iframe playback) */}
      {isDockedInPip ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-950/95 p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            <PictureInPicture2 className="size-5" />
          </div>
          <div>
            <Badge className="mb-1.5 border-emerald-500/40 bg-emerald-500/15 font-mono text-[10px] text-emerald-300">
              FLOATING PIP DOCK ACTIVE
            </Badge>
            <h3 className="text-sm font-bold text-zinc-100">{stream.label}</h3>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Playing in the draggable corner mini-player to save bandwidth.
            </p>
          </div>
          <Button
            type="button"
            size="xs"
            onClick={() => {
              setPipVideoId(null);
              toast.info(`Returned "${stream.label}" to grid`);
            }}
            className="gap-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <Minimize2 className="size-3" />
            Return to Grid Slot
          </Button>
        </div>
      ) : (
        /* Multi-Platform Player Embed */
        <iframe
          key={`${stream.videoId}-${reloadKey}`}
          ref={iframeRef}
          src={embedUrl}
          title={stream.label}
          onLoad={handleIframeLoad}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={cn(
            "h-full w-full flex-1 border-0 bg-black",
            (anyTileDragging || isSplitterDragging) && "pointer-events-none"
          )}
        />
      )}
    </div>
  );
});
