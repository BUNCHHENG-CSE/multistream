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
  Captions,
  CaptionsOff,
  Repeat,
  Languages,
  Type,
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
  ListVideo,
  SkipForward,
  Trash2,
  Link2,
} from "lucide-react";
import { usePlaybackStore, formatClock } from "@/store/usePlaybackStore";
import {
  setPlayerClock,
  clearPlayerClock,
  getPlayerClock,
} from "@/lib/player-clock";
import { loadTwitchPlayerApi, type TwitchPlayer } from "@/lib/twitch-player";
import {
  emitLocalPlayback,
  onRemotePlayback,
  suppressLocalPlayback,
} from "@/lib/party-client";
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
  getStreamRawId,
  sendYouTubeCommand,
  sendYouTubeListening,
  applyYouTubeCaptions,
  formatYouTubeQualityLabel,
  YOUTUBE_CAPTION_LANGUAGES,
  YOUTUBE_CAPTION_SIZES,
  YOUTUBE_PLAYBACK_SPEEDS,
  YOUTUBE_QUALITY_OPTIONS,
  YT_PLAYER_STATE,
  type YouTubeQualityLevel,
} from "@/lib/youtube";
import { useStreamStore, type StreamItem } from "@/store/useStreamStore";
import { YoutubeFeedSlot } from "@/components/YoutubeFeedSlot";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/**
 * Finds a live stream to take over a tile whose broadcast ended:
 * live-now from the user's YouTube subscriptions first, then the curated list.
 */
async function findLiveReplacement(
  currentVideoId: string
): Promise<{ videoId: string; title: string; fromSubscriptions: boolean } | null> {
  const active = new Set(
    useStreamStore.getState().streams.map((s) => s.videoId)
  );
  active.add(currentVideoId);

  try {
    let region = "KH";
    try {
      region = localStorage.getItem("tct_yt_feed_region") || "KH";
    } catch {
      // storage unavailable
    }
    const res = await fetch(
      `/api/youtube-feed?feed=subscriptions&region=${encodeURIComponent(region)}`
    );
    if (res.ok) {
      const data = (await res.json()) as {
        feed?: string;
        videos?: Array<{ videoId: string; title: string; isLive: boolean }>;
      };
      if (data.feed === "subscriptions") {
        const live = data.videos?.find((v) => v.isLive && !active.has(v.videoId));
        if (live) {
          return { videoId: live.videoId, title: live.title, fromSubscriptions: true };
        }
      }
    }
  } catch {
    // fall through to curated
  }

  const curated = CURATED_LIVE_STREAMS.find((c) => !active.has(c.videoId));
  return curated
    ? { videoId: curated.videoId, title: curated.label, fromSubscriptions: false }
    : null;
}

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
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState("");
  const [captionSize, setCaptionSize] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

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

  // Playback features: resume, queue, sleep-timer pause, auto-replace
  const queue = usePlaybackStore((s) => s.queues[stream.videoId]);
  const queueLength = queue?.length ?? 0;
  const pauseAllVersion = usePlaybackStore((s) => s.pauseAllVersion);
  const autoReplaceEnded = usePlaybackStore((s) => s.autoReplaceEnded);
  const [autoReplaceIn, setAutoReplaceIn] = useState<number | null>(null);
  const [twitchReadyVersion, setTwitchReadyVersion] = useState(0);

  const platform = getStreamPlatform(stream.videoId);
  const platformMeta = getStreamPlatformMeta(stream.videoId);
  const isYouTube = platform === "youtube";
  const isTwitch = platform === "twitch";
  /** Platforms whose player we can control (audio, play/pause) */
  const hasPlayerControl = isYouTube || isTwitch;

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
  const captionsRef = useRef({
    enabled: captionsEnabled,
    languageCode: captionLanguage,
    fontSize: captionSize,
  });
  const isLoopingRef = useRef<boolean>(isLooping);
  const lastPlayerStateRef = useRef<number | null>(null);
  // Live detection: YouTube doesn't always say, so watch whether duration keeps growing
  const isLiveRef = useRef<boolean | null>(null);
  const durationSampleRef = useRef<{ d: number; at: number } | null>(null);
  const lastDurationRef = useRef(0);
  const watchRecordedRef = useRef(false);
  // Watch Party: last stable user-facing state + last time sample (for seek detection)
  const stableStateRef = useRef<"playing" | "paused" | null>(null);
  const lastSampleRef = useRef<{ t: number; at: number } | null>(null);
  const resumePendingRef = useRef(true);
  const lastProgressSaveRef = useRef(0);
  const stallTimerRef = useRef<number | null>(null);
  const stallRetriesRef = useRef(0);
  // Latest-closure handlers called from the long-lived message listener
  const onVideoEndedRef = useRef<() => void>(() => {});
  const onStalledRef = useRef<() => void>(() => {});
  const onStreamErrorRef = useRef<() => void>(() => {});
  const runAutoReplaceRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    isAudioActiveRef.current = isAudioActive;
    effectiveVolumeRef.current = effectiveVolume;
    effectiveQualityRef.current = effectiveQuality;
    qualitySettingRef.current = qualitySetting;
    playbackRateRef.current = playbackRate;
    captionsRef.current = {
      enabled: captionsEnabled,
      languageCode: captionLanguage,
      fontSize: captionSize,
    };
    isLoopingRef.current = isLooping;
    if (!isAudioActive) {
      hasConfirmedUnmutedRef.current = false;
    }
  }, [
    isAudioActive,
    effectiveVolume,
    effectiveQuality,
    qualitySetting,
    playbackRate,
    captionsEnabled,
    captionLanguage,
    captionSize,
    isLooping,
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
              playerState?: number;
              currentTime?: number;
              duration?: number;
              videoData?: { isLive?: boolean };
            };
      };

      const clearStallTimer = () => {
        if (stallTimerRef.current !== null) {
          window.clearTimeout(stallTimerRef.current);
          stallTimerRef.current = null;
        }
      };

      const handlePlayerState = (state: number) => {
        const prev = lastPlayerStateRef.current;
        if (state === prev) return;
        lastPlayerStateRef.current = state;

        // Stall recovery: buffering for 15s straight → reconnect (max 3 tries)
        clearStallTimer();
        if (state === YT_PLAYER_STATE.BUFFERING) {
          stallTimerRef.current = window.setTimeout(() => {
            if (lastPlayerStateRef.current === YT_PLAYER_STATE.BUFFERING) {
              onStalledRef.current();
            }
          }, 15_000);
          return;
        }

        if (state === YT_PLAYER_STATE.ENDED) {
          if (isLoopingRef.current) {
            sendYouTubeCommand(iframeRef.current, "seekTo", [0, true]);
            sendYouTubeCommand(iframeRef.current, "playVideo");
            setIsPaused(false);
            return;
          }
          onVideoEndedRef.current();
          return;
        }
        if (state === YT_PLAYER_STATE.PAUSED) {
          setIsPaused(true);
          if (stableStateRef.current !== "paused") {
            stableStateRef.current = "paused";
            if (isLiveRef.current === false) {
              emitLocalPlayback({
                videoId: stream.videoId,
                state: "paused",
                time: lastSampleRef.current?.t ?? 0,
                at: Date.now(),
              });
            }
          }
          return;
        }
        if (state === YT_PLAYER_STATE.PLAYING) {
          stallRetriesRef.current = 0;
          if (stableStateRef.current !== "playing") {
            const wasPaused = stableStateRef.current === "paused";
            stableStateRef.current = "playing";
            // Only a resume from pause is a user action (not the initial autoplay)
            if (wasPaused && isLiveRef.current === false) {
              emitLocalPlayback({
                videoId: stream.videoId,
                state: "playing",
                time: lastSampleRef.current?.t ?? 0,
                at: Date.now(),
              });
            }
          }
          if (!watchRecordedRef.current) {
            watchRecordedRef.current = true;
            usePlaybackStore.getState().recordWatch(stream.videoId, stream.label);
          }
          setIsPaused(false);
          // Captions module only loads once playback has started
          if (captionsRef.current.enabled) {
            applyYouTubeCaptions(iframeRef.current, captionsRef.current);
          }
        }
      };

      const handlePlaybackTime = (
        currentTime: number,
        reportedDuration: number | undefined,
        reportedLive: boolean | undefined
      ) => {
        const now = Date.now();
        if (typeof reportedDuration === "number") {
          lastDurationRef.current = reportedDuration;
        }
        const duration = lastDurationRef.current;

        // Decide live vs. regular video once
        if (isLiveRef.current === null) {
          if (typeof reportedLive === "boolean") {
            isLiveRef.current = reportedLive;
          } else if (duration > 0) {
            const sample = durationSampleRef.current;
            if (!sample) {
              durationSampleRef.current = { d: duration, at: now };
            } else if (now - sample.at >= 2500) {
              isLiveRef.current = Math.abs(duration - sample.d) > 1;
            }
          }
        }
        const isLive = isLiveRef.current === true;
        setPlayerClock(stream.videoId, { currentTime, duration, isLive });

        // Watch Party: a jump in position that playback can't explain = user seek
        const last = lastSampleRef.current;
        lastSampleRef.current = { t: currentTime, at: now };
        const steadyState =
          (stableStateRef.current === "playing" &&
            lastPlayerStateRef.current === YT_PLAYER_STATE.PLAYING) ||
          (stableStateRef.current === "paused" &&
            lastPlayerStateRef.current === YT_PLAYER_STATE.PAUSED);
        if (last && isLiveRef.current === false && stableStateRef.current && steadyState) {
          const expected =
            stableStateRef.current === "playing"
              ? last.t + ((now - last.at) / 1000) * playbackRateRef.current
              : last.t;
          if (Math.abs(currentTime - expected) > 3) {
            emitLocalPlayback({
              videoId: stream.videoId,
              state: stableStateRef.current,
              time: currentTime,
              at: now,
            });
          }
        }

        if (isLiveRef.current !== false || duration < 60) return;

        // Resume where you left off (only right after the video starts)
        if (resumePendingRef.current) {
          resumePendingRef.current = false;
          const resumeAt = usePlaybackStore
            .getState()
            .getResumeTime(stream.videoId);
          if (resumeAt !== null && currentTime < 20) {
            suppressLocalPlayback(stream.videoId);
            sendYouTubeCommand(iframeRef.current, "seekTo", [resumeAt, true]);
            toast.info(`Resumed "${stream.label}" at ${formatClock(resumeAt)}`, {
              action: {
                label: "Start over",
                onClick: () =>
                  sendYouTubeCommand(iframeRef.current, "seekTo", [0, true]),
              },
            });
            return;
          }
        }

        if (now - lastProgressSaveRef.current >= 5000 && currentTime > 0) {
          lastProgressSaveRef.current = now;
          usePlaybackStore
            .getState()
            .saveProgress(stream.videoId, Math.floor(currentTime), Math.floor(duration));
        }
      };

      if (payload.event === "onStateChange" && typeof payload.info === "number") {
        handlePlayerState(payload.info);
        return;
      }

      if (payload.event === "onError") {
        const code = typeof payload.info === "number" ? payload.info : null;
        setErrorCode(code);
        setHasStreamError(true);
        onStreamErrorRef.current();
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

        if (typeof payload.info.playerState === "number") {
          handlePlayerState(payload.info.playerState);
        }

        if (typeof payload.info.currentTime === "number") {
          handlePlaybackTime(
            payload.info.currentTime,
            payload.info.duration,
            payload.info.videoData?.isLive
          );
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
    return () => {
      window.removeEventListener("message", handleMessage);
      if (stallTimerRef.current !== null) {
        window.clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    };
  }, [
    isLoaded,
    isYouTube,
    stream.label,
    setStreamAudio,
    setStreamQuality,
    stream.videoId,
    syncPlayerAudio,
  ]);

  const handleIframeLoad = () => {
    lastPlayerStateRef.current = null;
    isLiveRef.current = null;
    durationSampleRef.current = null;
    lastDurationRef.current = 0;
    resumePendingRef.current = true;
    watchRecordedRef.current = false;
    stableStateRef.current = null;
    lastSampleRef.current = null;
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
    setAutoReplaceIn(null);
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

  /** Switch this tile to another video, keeping its "Up next" queue attached. */
  const swapTileTo = (newId: string, title: string) => {
    const oldId = stream.videoId;
    const res = replaceStream(oldId, newId, title);
    if (res.success && res.videoId) {
      usePlaybackStore.getState().moveQueue(oldId, res.videoId);
    }
    return res;
  };

  const playNextInQueue = (): boolean => {
    const active = new Set(
      useStreamStore.getState().streams.map((s) => s.videoId)
    );
    const next = usePlaybackStore
      .getState()
      .takeNext(stream.videoId, (id) => !active.has(id));
    if (!next) return false;
    const res = replaceStream(stream.videoId, next.videoId, next.title);
    if (res.success) {
      toast.success(`Up next: "${next.title}"`);
      return true;
    }
    if (res.error) toast.error(res.error);
    return false;
  };

  const runAutoReplace = async () => {
    const replacement = await findLiveReplacement(stream.videoId);
    if (!replacement) {
      toast.info("No other live stream available to replace this one.");
      return;
    }
    const res = swapTileTo(replacement.videoId, replacement.title);
    if (res.success) {
      toast.success(`Stream ended — now playing "${replacement.title}"`, {
        description: replacement.fromSubscriptions
          ? "Live now from your subscriptions"
          : "From the curated live list",
      });
    }
  };

  const handleVideoEnded = () => {
    if (isLiveRef.current === false) {
      usePlaybackStore.getState().clearProgress(stream.videoId);
    }
    if (playNextInQueue()) return;
    if (isLiveRef.current === true && autoReplaceEnded) {
      setAutoReplaceIn(10);
    }
  };

  const handleStreamError = () => {
    if (playNextInQueue()) return;
    if (autoReplaceEnded) setAutoReplaceIn(10);
  };

  const handleStalled = () => {
    if (stallRetriesRef.current >= 3) return;
    stallRetriesRef.current += 1;
    toast.info(`"${stream.label}" stalled — reconnecting…`);
    setIsLoaded(false);
    setReloadKey((k) => k + 1);
  };

  // Keep listener-facing refs pointing at the latest handlers
  useEffect(() => {
    onVideoEndedRef.current = handleVideoEnded;
    onStalledRef.current = handleStalled;
    onStreamErrorRef.current = handleStreamError;
    runAutoReplaceRef.current = runAutoReplace;
  });

  // Auto-replace countdown (cancellable from the offline slate)
  useEffect(() => {
    if (autoReplaceIn === null) return;
    const id = window.setTimeout(() => {
      if (autoReplaceIn > 1) {
        setAutoReplaceIn(autoReplaceIn - 1);
      } else {
        setAutoReplaceIn(null);
        void runAutoReplaceRef.current();
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [autoReplaceIn]);

  // Sleep timer → pause every player
  const prevPauseAllRef = useRef(pauseAllVersion);
  useEffect(() => {
    if (pauseAllVersion === prevPauseAllRef.current) return;
    prevPauseAllRef.current = pauseAllVersion;
    if (iframeRef.current && isYouTube) {
      suppressLocalPlayback(stream.videoId);
      sendYouTubeCommand(iframeRef.current, "pauseVideo");
    }
    twitchPlayerRef.current?.pause();
  }, [pauseAllVersion, isYouTube, stream.videoId]);

  // ── Twitch: official Embed Player API (mute/volume/play/pause + offline events) ──
  const twitchHostRef = useRef<HTMLDivElement | null>(null);
  const twitchPlayerRef = useRef<TwitchPlayer | null>(null);
  const twitchChannel = isTwitch ? getStreamRawId(stream.videoId) : null;

  useEffect(() => {
    const host = twitchHostRef.current;
    if (!twitchChannel || !host || isDockedInPip) return;
    let disposed = false;

    loadTwitchPlayerApi()
      .then((Twitch) => {
        if (disposed || !twitchHostRef.current) return;
        host.innerHTML = "";
        const player = new Twitch.Player(host, {
          channel: twitchChannel,
          parent: [embedDomain.replace(/:\d+$/, "")],
          width: "100%",
          height: "100%",
          autoplay: true,
          muted: true,
        });
        twitchPlayerRef.current = player;

        player.addEventListener(Twitch.Player.READY, () => {
          setIsLoaded(true);
          setHasStreamError(false);
          setTwitchReadyVersion((v) => v + 1);
        });
        player.addEventListener(Twitch.Player.PLAYING, () => setIsPaused(false));
        player.addEventListener(Twitch.Player.PAUSE, () => setIsPaused(true));
        player.addEventListener(Twitch.Player.ONLINE, () => {
          setHasStreamError(false);
          setErrorCode(null);
        });
        player.addEventListener(Twitch.Player.OFFLINE, () => {
          setHasStreamError(true);
          onStreamErrorRef.current();
        });
        player.addEventListener(Twitch.Player.ENDED, () => {
          isLiveRef.current = true;
          onVideoEndedRef.current();
        });
      })
      .catch(() => {
        // Script blocked (e.g. by an extension) → show the offline slate with retry
        if (!disposed) {
          setIsLoaded(true);
          setHasStreamError(true);
        }
      });

    return () => {
      disposed = true;
      twitchPlayerRef.current = null;
      host.innerHTML = "";
    };
  }, [twitchChannel, reloadKey, isDockedInPip, embedDomain]);

  // Twitch audio follows the same Solo / mute / volume model as YouTube
  useEffect(() => {
    const player = twitchPlayerRef.current;
    if (!player) return;
    const audible = isAudioActive && effectiveVolume > 0;
    player.setMuted(!audible);
    if (audible) player.setVolume(Math.min(1, effectiveVolume / 100));
  }, [isAudioActive, effectiveVolume, muteSyncVersion, twitchReadyVersion]);

  // Watch Party: follow play / pause / seek from other viewers (regular videos)
  useEffect(() => {
    if (!isYouTube) return;
    return onRemotePlayback(stream.videoId, (ev) => {
      const iframe = iframeRef.current;
      if (!iframe || isLiveRef.current === true) return;
      const target =
        ev.time +
        (ev.state === "playing" ? Math.max(0, (Date.now() - ev.at) / 1000) : 0);
      const current = lastSampleRef.current?.t;
      if (current === undefined || Math.abs(current - target) > 2) {
        sendYouTubeCommand(iframe, "seekTo", [target, true]);
      }
      sendYouTubeCommand(iframe, ev.state === "playing" ? "playVideo" : "pauseVideo");
    });
  }, [isYouTube, stream.videoId]);

  // Drop this tile's clock when it leaves the grid
  useEffect(() => {
    const id = stream.videoId;
    return () => clearPlayerClock(id);
  }, [stream.videoId]);

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

  const updateCaptions = (
    next: Partial<{ enabled: boolean; languageCode: string; fontSize: number }>
  ) => {
    const merged = {
      enabled: next.enabled ?? captionsEnabled,
      languageCode: next.languageCode ?? captionLanguage,
      fontSize: next.fontSize ?? captionSize,
    };
    setCaptionsEnabled(merged.enabled);
    setCaptionLanguage(merged.languageCode);
    setCaptionSize(merged.fontSize);
    captionsRef.current = merged;
    if (iframeRef.current && isYouTube) {
      applyYouTubeCaptions(iframeRef.current, merged);
    }
    return merged;
  };

  const handleToggleCaptions = () => {
    const merged = updateCaptions({ enabled: !captionsEnabled });
    toast.info(
      merged.enabled
        ? `Captions on for "${stream.label}"`
        : `Captions off for "${stream.label}"`,
      merged.enabled
        ? { description: "Shown when the video provides a caption track." }
        : undefined
    );
  };

  const handleToggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    isLoopingRef.current = next;
    toast.info(next ? `Loop on for "${stream.label}"` : "Loop off");
  };

  /** Copies a share link; regular YouTube videos include the current moment (&t=). */
  const handleCopyMomentLink = async () => {
    let url = getStreamExternalUrl(stream.videoId);
    let label = "Link copied";
    const clock = isYouTube ? getPlayerClock(stream.videoId) : undefined;
    if (clock && !clock.isLive && clock.currentTime >= 1) {
      const t = Math.floor(clock.currentTime);
      url = `https://youtu.be/${encodeURIComponent(stream.videoId)}?t=${t}`;
      label = `Link copied at ${formatClock(t)}`;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(label, { description: url });
    } catch {
      toast.error("Couldn't access the clipboard", { description: url });
    }
  };

  const handleTogglePlayPause = () => {
    if (isTwitch) {
      const player = twitchPlayerRef.current;
      if (!player) return;
      if (isPaused) player.play();
      else player.pause();
      setIsPaused(!isPaused);
      return;
    }
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
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0f0f0f]">
        <YoutubeFeedSlot
          slotIndex={index}
          onClose={() => setIsBrowsingYouTube(false)}
          onSelectVideo={(newId, newTitle) => {
            const res = swapTileTo(newId, newTitle);
            setIsBrowsingYouTube(false);
            if (res.success) toast.success(`Switched to "${newTitle}"`);
            else if (res.error) toast.error(res.error);
          }}
          onQueueVideo={(newId, newTitle) => {
            const added = usePlaybackStore
              .getState()
              .enqueue(stream.videoId, { videoId: newId, title: newTitle });
            if (added) toast.success(`Added to Up next: "${newTitle}"`);
            else toast.info("Already in this tile's queue");
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
        "group/tile @container relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-zinc-950 transition-all duration-200",
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

        {isYouTube && (captionsEnabled || isLooping) && (
          <Badge
            variant="secondary"
            className="gap-1 border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-300 backdrop-blur-md"
          >
            {captionsEnabled && <Captions className="size-2.5 text-emerald-400" />}
            {captionsEnabled && "CC"}
            {captionsEnabled && isLooping && " • "}
            {isLooping && <Repeat className="size-2.5 text-emerald-400" />}
            {isLooping && "LOOP"}
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
          {hasPlayerControl && (
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

          {/* 3. Closed Captions + Loop quick toggles */}
          {isYouTube && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="secondary"
                      onClick={handleToggleCaptions}
                      aria-pressed={captionsEnabled}
                      aria-label={captionsEnabled ? "Turn captions off" : "Turn captions on"}
                      className={cn(
                        "hidden bg-zinc-900/90 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white @sm:inline-flex",
                        captionsEnabled &&
                          "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40"
                      )}
                    />
                  }
                >
                  {captionsEnabled ? (
                    <Captions className="size-3.5" />
                  ) : (
                    <CaptionsOff className="size-3.5" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {captionsEnabled ? "Captions on (CC)" : "Turn on captions (CC)"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="secondary"
                      onClick={handleToggleLoop}
                      aria-pressed={isLooping}
                      aria-label={isLooping ? "Turn loop off" : "Turn loop on"}
                      className={cn(
                        "hidden bg-zinc-900/90 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white @sm:inline-flex",
                        isLooping &&
                          "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40"
                      )}
                    />
                  }
                >
                  <Repeat className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  {isLooping ? "Loop on — replays when the video ends" : "Loop this video"}
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* 4. Live Chat Focus */}
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
                      captionsEnabled ||
                      isLooping ||
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

                {hasPlayerControl && (
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
                  <span>Browse, Switch or Queue</span>
                </DropdownMenuItem>

                {/* Up next queue */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white data-open:bg-white/10 data-open:text-white">
                    <ListVideo className="size-3.5 text-zinc-300" />
                    <span>Up next</span>
                    <span
                      className={cn(
                        "ml-auto pr-1 font-mono text-xs",
                        queueLength ? "text-emerald-400" : "text-zinc-500"
                      )}
                    >
                      {queueLength}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 rounded-xl border border-white/15 bg-zinc-900/95 p-1 text-zinc-100 shadow-2xl backdrop-blur-xl">
                    {queueLength === 0 ? (
                      <div className="px-2.5 py-2 text-xs text-zinc-400">
                        Queue is empty. Use{" "}
                        <span className="text-zinc-200">Browse, Switch or Queue</span>{" "}
                        and press <span className="text-zinc-200">+ Queue</span> on a
                        video.
                      </div>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() => playNextInQueue()}
                          className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-300 focus:bg-emerald-500/15 focus:text-emerald-200"
                        >
                          <SkipForward className="size-3.5" />
                          <span>Play next now</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-white/10" />
                        {queue?.map((item, i) => (
                          <DropdownMenuItem
                            key={item.videoId}
                            closeOnClick={false}
                            onClick={() =>
                              usePlaybackStore
                                .getState()
                                .dequeueAt(stream.videoId, i)
                            }
                            title="Remove from queue"
                            className="group/q cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                          >
                            <span className="w-4 shrink-0 font-mono text-[10px] text-zinc-500">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {item.title}
                            </span>
                            <X className="size-3 shrink-0 text-zinc-500 group-hover/q:text-red-400" />
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-1 bg-white/10" />
                        <DropdownMenuItem
                          onClick={() =>
                            usePlaybackStore.getState().clearQueue(stream.videoId)
                          }
                          className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-300 focus:bg-red-500/15 focus:text-red-200"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Clear queue</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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

                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="my-1 bg-white/10" />

                  {/* Captions & Loop */}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                      Captions & Loop
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                      closeOnClick={false}
                      onClick={handleToggleCaptions}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                    >
                      {captionsEnabled ? (
                        <Captions className="size-3.5 text-emerald-400" />
                      ) : (
                        <CaptionsOff className="size-3.5 text-zinc-300" />
                      )}
                      <span>Captions (CC)</span>
                      <span
                        className={cn(
                          "ml-auto pr-1 text-xs",
                          captionsEnabled ? "text-emerald-400" : "text-zinc-500"
                        )}
                      >
                        {captionsEnabled ? "On" : "Off"}
                      </span>
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white data-open:bg-white/10 data-open:text-white">
                        <Languages className="size-3.5 text-zinc-300" />
                        <span>Caption language</span>
                        <span className="ml-auto max-w-[80px] truncate pr-1 text-xs text-zinc-400">
                          {YOUTUBE_CAPTION_LANGUAGES.find(
                            (l) => l.value === captionLanguage
                          )?.label ?? "Default"}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-52 rounded-xl border border-white/15 bg-zinc-900/95 p-1 text-zinc-100 shadow-2xl backdrop-blur-xl">
                        <DropdownMenuRadioGroup
                          value={captionLanguage}
                          onValueChange={(value) => {
                            const lang = String(value);
                            updateCaptions({ enabled: true, languageCode: lang });
                            toast.info(
                              `Captions: ${
                                YOUTUBE_CAPTION_LANGUAGES.find((l) => l.value === lang)
                                  ?.label ?? lang
                              }`,
                              {
                                description:
                                  "Applies only if the video has a track in this language.",
                              }
                            );
                          }}
                        >
                          {YOUTUBE_CAPTION_LANGUAGES.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.value || "default"}
                              value={option.value}
                              className="cursor-pointer rounded-lg py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white"
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:bg-white/10 focus:text-white data-open:bg-white/10 data-open:text-white">
                        <Type className="size-3.5 text-zinc-300" />
                        <span>Caption size</span>
                        <span className="ml-auto pr-1 text-xs text-zinc-400">
                          {YOUTUBE_CAPTION_SIZES.find((s) => s.value === captionSize)
                            ?.label ?? "Normal"}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-40 rounded-xl border border-white/15 bg-zinc-900/95 p-1 text-zinc-100 shadow-2xl backdrop-blur-xl">
                        <DropdownMenuRadioGroup
                          value={String(captionSize)}
                          onValueChange={(value) => {
                            const size = Number(value);
                            if (!Number.isNaN(size)) {
                              updateCaptions({ enabled: true, fontSize: size });
                            }
                          }}
                        >
                          {YOUTUBE_CAPTION_SIZES.map((option) => (
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
                      closeOnClick={false}
                      onClick={handleToggleLoop}
                      className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                    >
                      <Repeat
                        className={cn(
                          "size-3.5",
                          isLooping ? "text-emerald-400" : "text-zinc-300"
                        )}
                      />
                      <span>Loop video</span>
                      <span
                        className={cn(
                          "ml-auto pr-1 text-xs",
                          isLooping ? "text-emerald-400" : "text-zinc-500"
                        )}
                      >
                        {isLooping ? "On" : "Off"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="my-1 bg-white/10" />

                  <DropdownMenuGroup>
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
                  onClick={() => void handleCopyMomentLink()}
                  className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
                >
                  <Link2 className="size-3.5 text-sky-400" />
                  <span>
                    {isYouTube ? "Copy link at current time" : "Copy stream link"}
                  </span>
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
          {autoReplaceIn !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
              <RefreshCw className="size-3 animate-spin" />
              <span>Switching to another live stream in {autoReplaceIn}s</span>
              <button
                type="button"
                onClick={() => setAutoReplaceIn(null)}
                className="font-semibold text-emerald-300 underline-offset-2 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
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

      {/* Live broadcast ended normally → cancellable auto-replace banner */}
      {!isDockedInPip && !hasStreamError && autoReplaceIn !== null && (
        <div className="absolute inset-x-3 bottom-3 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-100 shadow-xl backdrop-blur-md">
          <span className="flex items-center gap-2">
            <Radio className="size-3.5 text-emerald-400" />
            Broadcast ended — switching to another live stream in {autoReplaceIn}s
          </span>
          <span className="flex items-center gap-1.5">
            <Button
              type="button"
              size="xs"
              onClick={() => {
                setAutoReplaceIn(null);
                void runAutoReplace();
              }}
              className="h-6 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
            >
              Switch now
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setAutoReplaceIn(null)}
              className="h-6 rounded-md px-2 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
          </span>
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
      ) : isTwitch ? (
        /* Twitch Embed Player API mounts its own iframe here */
        <div
          key={`${stream.videoId}-${reloadKey}`}
          ref={twitchHostRef}
          className={cn(
            "h-full w-full flex-1 bg-black [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0",
            (anyTileDragging || isSplitterDragging) && "pointer-events-none"
          )}
        />
      ) : (
        /* YouTube / Kick Player Embed */
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
