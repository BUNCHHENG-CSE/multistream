"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  MessageSquare,
  PanelRightClose,
  ExternalLink,
  Radio,
  PictureInPicture2,
  Rows2,
  Headphones,
  RotateCw,
  ArrowUpDown,
  Zap,
  ChevronsUp,
  ChevronsDown,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getYouTubeLiveChatUrl,
  getStreamExternalUrl,
  getStreamPlatformMeta,
} from "@/lib/youtube";
import { useStreamStore, type StreamItem } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
const MAX_WARM_CHAT_IFRAMES = 4;

interface ChatPaneProps {
  streams: StreamItem[];
  selectedVideoId: string | null;
  onSelectStream: (videoId: string) => void;
  embedDomain: string;
  isDark: boolean;
  labelPrefix?: string;
  isSplitterDragging?: boolean;
  unmutedVideoIds: string[];
  keepChatAlive: boolean;
  ecoModeEnabled: boolean;
  isCompact: boolean;
  onPopout: (videoId: string) => void;
  onSwapPanes?: () => void;
  showSwapButton?: boolean;
  paneStyle?: React.CSSProperties;
}

function ChatPane({
  streams,
  selectedVideoId,
  onSelectStream,
  embedDomain,
  isDark,
  labelPrefix,
  isSplitterDragging,
  unmutedVideoIds,
  keepChatAlive,
  ecoModeEnabled,
  isCompact,
  onPopout,
  onSwapPanes,
  showSwapButton,
  paneStyle,
}: ChatPaneProps) {
  const [cachedOrder, setCachedOrder] = useState<string[]>([]);
  const [reloadCounts, setReloadCounts] = useState<Record<string, number>>({});
  const [loadedKeys, setLoadedKeys] = useState<Record<string, boolean>>({});
  const [slowKeys, setSlowKeys] = useState<Record<string, boolean>>({});

  const activeStream = streams.find((s) => s.videoId === selectedVideoId);
  const activeIndex = streams.findIndex((s) => s.videoId === selectedVideoId);
  const activeMeta = selectedVideoId
    ? getStreamPlatformMeta(selectedVideoId)
    : null;
  const maxCached = keepChatAlive && !ecoModeEnabled ? MAX_WARM_CHAT_IFRAMES : 1;

  // Keep recently visited chat iframes warm in DOM so switching channels is 0ms
  // and preserves YouTube's "Live chat" mode, scroll position, and draft text.
  const warmPool = useMemo(() => {
    const validIds = new Set(streams.map((s) => s.videoId));
    if (!selectedVideoId || !validIds.has(selectedVideoId)) {
      return [];
    }
    if (maxCached <= 1) {
      return [selectedVideoId];
    }
    const preserved = cachedOrder.filter(
      (id) => id !== selectedVideoId && validIds.has(id)
    );
    return [...preserved, selectedVideoId].slice(-maxCached);
  }, [cachedOrder, streams, selectedVideoId, maxCached]);

  const currentReloadVersion = selectedVideoId
    ? (reloadCounts[selectedVideoId] ?? 0)
    : 0;
  const currentIframeKey = selectedVideoId
    ? `${selectedVideoId}-${embedDomain}-${isDark ? "dark" : "light"}-${currentReloadVersion}`
    : null;
  const isCurrentLoaded = currentIframeKey
    ? Boolean(loadedKeys[currentIframeKey])
    : true;
  const isCurrentSlow = currentIframeKey
    ? Boolean(slowKeys[currentIframeKey])
    : false;

  // Show non-blocking recovery prompt if a third-party chat iframe takes >4.5s to respond
  useEffect(() => {
    if (!currentIframeKey || isCurrentLoaded) return;
    const timer = window.setTimeout(() => {
      setSlowKeys((prev) =>
        prev[currentIframeKey] ? prev : { ...prev, [currentIframeKey]: true }
      );
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [currentIframeKey, isCurrentLoaded]);

  const handleSelect = (nextId: string) => {
    if (maxCached > 1) {
      setCachedOrder((prev) => {
        const filtered = prev.filter((id) => id !== nextId && id !== selectedVideoId);
        if (selectedVideoId) filtered.push(selectedVideoId);
        filtered.push(nextId);
        return filtered.slice(-maxCached);
      });
    }
    onSelectStream(nextId);
  };

  const handleReloadActiveChat = () => {
    if (!selectedVideoId) return;
    setReloadCounts((prev) => ({
      ...prev,
      [selectedVideoId]: (prev[selectedVideoId] ?? 0) + 1,
    }));
    toast.info(`Reloading chat for "${activeStream?.label ?? selectedVideoId}"`);
  };

  const showPaneHeader =
    streams.length > 0 && (Boolean(labelPrefix) || !isCompact || streams.length > 1);

  return (
    <div style={paneStyle} className="flex min-h-0 flex-1 flex-col">
      {/* Unified Slim Stream Switcher / Pane Header */}
      {showPaneHeader && (
        <div
          className={cn(
            "flex items-center gap-1.5 border-b border-zinc-200/80 bg-zinc-50/70 px-2 dark:border-zinc-800/80 dark:bg-zinc-900/50",
            isCompact && !labelPrefix ? "py-1" : "py-1.5"
          )}
        >
          {labelPrefix && (
            <span className="shrink-0 rounded bg-zinc-200/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
              {labelPrefix}
            </span>
          )}

          {/* Dual-Chat Mode OR Multi-Stream Compact Selector */}
          {labelPrefix ? (
            <Select
              value={selectedVideoId ?? ""}
              onValueChange={(value) => {
                if (value) handleSelect(value);
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-6.5 min-w-0 flex-1 rounded-md border-zinc-200/90 bg-white px-2 text-[11px] text-zinc-900 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100"
              >
                <SelectValue placeholder="Select stream chat">
                  {activeStream ? (
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          unmutedVideoIds.includes(activeStream.videoId)
                            ? "bg-emerald-500"
                            : "bg-sky-500"
                        )}
                      />
                      <span className="truncate font-medium">
                        #{activeIndex + 1} {activeStream.label}
                      </span>
                    </span>
                  ) : (
                    "Select stream chat"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {streams.map((s, idx) => {
                  const meta = getStreamPlatformMeta(s.videoId);
                  return (
                    <SelectItem
                      key={s.videoId}
                      value={s.videoId}
                      className="text-xs"
                    >
                      <span className="font-mono text-zinc-400 dark:text-zinc-500">
                        0{idx + 1}
                      </span>
                      <span className="font-mono text-[10px] opacity-70">
                        [{meta.shortLabel}]
                      </span>
                      <span className="truncate">{s.label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : streams.length === 1 && activeStream && activeMeta ? (
            /* Single stream: slim inline status strip (saves ~40px vs Select box) */
            <div className="flex min-w-0 flex-1 items-center gap-1.5 px-0.5">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  unmutedVideoIds.includes(activeStream.videoId)
                    ? "bg-emerald-500"
                    : "bg-sky-500"
                )}
              />
              <span className="shrink-0 rounded border border-zinc-200/80 bg-white px-1 py-0 font-mono text-[9px] font-bold text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-950 dark:text-zinc-300">
                {activeMeta.shortLabel}
              </span>
              <span
                className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-200"
                title={activeStream.label}
              >
                {activeStream.label}
              </span>
            </div>
          ) : (
            /* Multiple streams: single compact tab strip + quick jump dropdown */
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {streams.map((s, idx) => {
                  const isSelected = s.videoId === selectedVideoId;
                  const isUnmuted = unmutedVideoIds.includes(s.videoId);
                  const isWarm = warmPool.includes(s.videoId);
                  return (
                    <button
                      key={s.videoId}
                      type="button"
                      onClick={() => handleSelect(s.videoId)}
                      title={`${s.label}${isUnmuted ? " (Audio Active)" : ""}${isWarm && !isSelected ? " • Cached" : ""}`}
                      className={cn(
                        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-medium transition-all",
                        isSelected
                          ? "border-sky-500/45 bg-sky-500/15 text-sky-700 shadow-2xs dark:border-sky-500/45 dark:bg-sky-500/20 dark:text-sky-300"
                          : "border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                      )}
                    >
                      {isUnmuted ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      ) : isWarm && !isSelected ? (
                        <span className="size-1 shrink-0 rounded-full bg-sky-400/70" />
                      ) : null}
                      <span className="font-mono text-[9px] opacity-70">
                        #{idx + 1}
                      </span>
                      <span className="max-w-[78px] truncate">
                        {s.label.split("—")[0].trim()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {streams.length > 2 && (
                <Select
                  value={selectedVideoId ?? ""}
                  onValueChange={(value) => {
                    if (value) handleSelect(value);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Jump to stream chat"
                    title="Jump to any stream chat"
                    className="h-6 w-6 shrink-0 justify-center rounded-md border-zinc-200/80 bg-white p-0 text-zinc-600 shadow-none hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 [&_[data-slot=select-value]]:hidden [&>svg]:hidden"
                  >
                    <SelectValue />
                    <ChevronDown className="size-3.5" />
                  </SelectTrigger>
                  <SelectContent
                    align="end"
                    className="w-60 rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {streams.map((s, idx) => {
                      const meta = getStreamPlatformMeta(s.videoId);
                      return (
                        <SelectItem
                          key={s.videoId}
                          value={s.videoId}
                          className="text-xs"
                        >
                          <span className="font-mono text-zinc-400 dark:text-zinc-500">
                            0{idx + 1}
                          </span>
                          <span className="font-mono text-[10px] opacity-70">
                            [{meta.shortLabel}]
                          </span>
                          <span className="truncate">{s.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Per-Pane Quick Utility Actions */}
          <div className="flex shrink-0 items-center gap-0.5">
            {showSwapButton && onSwapPanes && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={onSwapPanes}
                      className="size-6 rounded-md text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    />
                  }
                >
                  <ArrowUpDown className="size-3" />
                </TooltipTrigger>
                <TooltipContent>Swap CH A ↔ CH B</TooltipContent>
              </Tooltip>
            )}

            {selectedVideoId && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleReloadActiveChat}
                      className="size-6 rounded-md text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    />
                  }
                >
                  <RotateCw
                    className={cn(
                      "size-3",
                      !isCurrentLoaded && "animate-spin text-sky-500"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>Reload chat feed</TooltipContent>
              </Tooltip>
            )}

            {selectedVideoId && labelPrefix && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onPopout(selectedVideoId)}
                      className="size-6 rounded-md text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    />
                  }
                >
                  <PictureInPicture2 className="size-3" />
                </TooltipTrigger>
                <TooltipContent>Pop out {labelPrefix} chat</TooltipContent>
              </Tooltip>
            )}

            {selectedVideoId && !labelPrefix && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={getStreamExternalUrl(selectedVideoId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    />
                  }
                >
                  <ExternalLink className="size-3" />
                </TooltipTrigger>
                <TooltipContent>Open watch page</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Embedded Multi-Platform Live Chat Pool */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {selectedVideoId && warmPool.length > 0 ? (
          <>
            {warmPool.map((videoId) => {
              const isCurrent = videoId === selectedVideoId;
              const reloadVersion = reloadCounts[videoId] ?? 0;
              const iframeKey = `${videoId}-${embedDomain}-${isDark ? "dark" : "light"}-${reloadVersion}`;
              const streamLabel =
                streams.find((s) => s.videoId === videoId)?.label ?? videoId;

              return (
                <div
                  key={iframeKey}
                  aria-hidden={!isCurrent}
                  className={cn(
                    "absolute inset-0 flex flex-col bg-white dark:bg-zinc-950",
                    isCurrent
                      ? "visible z-10 opacity-100"
                      : "invisible pointer-events-none z-0 opacity-0"
                  )}
                >
                  <iframe
                    src={getYouTubeLiveChatUrl(videoId, embedDomain, isDark)}
                    title={`Live Chat (${streamLabel})`}
                    onLoad={() => {
                      setLoadedKeys((prev) =>
                        prev[iframeKey] ? prev : { ...prev, [iframeKey]: true }
                      );
                    }}
                    className={cn(
                      "h-full w-full flex-1 border-0 bg-white dark:bg-zinc-950",
                      (isSplitterDragging || !isCurrent) && "pointer-events-none"
                    )}
                  />
                </div>
              );
            })}

            {/* Non-blocking connection skeleton + delayed popout fallback */}
            {!isCurrentLoaded && (
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 bg-zinc-50/90 p-5 text-center backdrop-blur-[2px] dark:bg-zinc-950/90">
                <div className="flex size-9 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-500">
                  <Loader2 className="size-4 animate-spin" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    Connecting {activeMeta?.label ?? "Live"} Chat...
                  </p>
                  <p className="max-w-[220px] truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {activeStream?.label ?? selectedVideoId}
                  </p>
                </div>

                {isCurrentSlow && (
                  <div className="pointer-events-auto mt-1 flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={handleReloadActiveChat}
                      className="h-6.5 gap-1 rounded-md text-[11px]"
                    >
                      <RotateCw className="size-3" />
                      Retry
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => onPopout(selectedVideoId)}
                      className="h-6.5 gap-1 rounded-md bg-sky-600 text-[11px] text-white hover:bg-sky-500"
                    >
                      <PictureInPicture2 className="size-3" />
                      Pop out chat
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center text-zinc-500">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600">
              <Radio className="size-6" />
            </div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              No Active Stream Selected
            </p>
            <p className="max-w-[220px] text-[11px] leading-relaxed text-zinc-500">
              Add a YouTube, Twitch, or Kick live stream to view and participate
              in its live chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveChatSidebar() {
  const streams = useStreamStore((s) => s.streams);
  const unmutedVideoIds = useStreamStore((s) => s.unmutedVideoIds);
  const activeChatVideoId = useStreamStore((s) => s.activeChatVideoId);
  const secondaryChatVideoId = useStreamStore((s) => s.secondaryChatVideoId);
  const isChatOpen = useStreamStore((s) => s.isChatOpen);
  const isSplitChat = useStreamStore((s) => s.isSplitChat);
  const isCompactChat = useStreamStore((s) => s.isCompactChat);
  const splitChatRatio = useStreamStore((s) => s.splitChatRatio);
  const keepChatAlive = useStreamStore((s) => s.keepChatAlive);
  const hasChatActivated = useStreamStore((s) => s.hasChatActivated);
  const ecoModeEnabled = useStreamStore((s) => s.ecoModeEnabled);
  const audioFollowsChat = useStreamStore((s) => s.audioFollowsChat);
  const chatSidebarWidth = useStreamStore((s) => s.chatSidebarWidth);
  const isSplitterDragging = useStreamStore((s) => s.isSplitterDragging);

  const setActiveChatStream = useStreamStore((s) => s.setActiveChatStream);
  const setSecondaryChatStream = useStreamStore(
    (s) => s.setSecondaryChatStream
  );
  const setChatOpen = useStreamStore((s) => s.setChatOpen);
  const setSplitChat = useStreamStore((s) => s.setSplitChat);
  const setCompactChat = useStreamStore((s) => s.setCompactChat);
  const setSplitChatRatio = useStreamStore((s) => s.setSplitChatRatio);
  const setKeepChatAlive = useStreamStore((s) => s.setKeepChatAlive);
  const swapSplitChatStreams = useStreamStore((s) => s.swapSplitChatStreams);
  const setAudioFollowsChat = useStreamStore((s) => s.setAudioFollowsChat);
  const setChatSidebarWidth = useStreamStore((s) => s.setChatSidebarWidth);
  const setSplitterDragging = useStreamStore((s) => s.setSplitterDragging);

  const [isResizing, setIsResizing] = useState(false);
  const [isSplitResizing, setIsSplitResizing] = useState(false);
  const panesContainerRef = useRef<HTMLDivElement | null>(null);

  // Horizontal sidebar width resizer
  useEffect(() => {
    if (!isResizing) return;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (e: PointerEvent) => {
      const nextWidth = window.innerWidth - e.clientX;
      setChatSidebarWidth(nextWidth);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      setSplitterDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isResizing, setChatSidebarWidth, setSplitterDragging]);

  // Vertical Dual-Split Chat resizer
  useEffect(() => {
    if (!isSplitResizing) return;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (e: PointerEvent) => {
      const container = panesContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return;
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setSplitChatRatio(pct);
    };

    const onPointerUp = () => {
      setIsSplitResizing(false);
      setSplitterDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isSplitResizing, setSplitChatRatio, setSplitterDragging]);

  const { resolvedTheme } = useTheme();
  const embedDomain = useSyncExternalStore(
    emptySubscribe,
    () => window.location.hostname || "localhost",
    () => "localhost"
  );
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Keep sidebar mounted offscreen after first activation when keepChatAlive is on
  // (and Eco Mode is off), so collapsing/reopening chat with "C" is instantaneous.
  const keepWarmOffscreen =
    !isChatOpen &&
    hasChatActivated &&
    keepChatAlive &&
    !ecoModeEnabled &&
    streams.length > 0;

  if (!isChatOpen && !keepWarmOffscreen) {
    return null;
  }

  const isDark = !mounted || resolvedTheme === "dark";

  const resolvedPrimaryId =
    streams.find((s) => s.videoId === activeChatVideoId)?.videoId ??
    streams[0]?.videoId ??
    null;

  const resolvedSecondaryId =
    streams.find((s) => s.videoId === secondaryChatVideoId)?.videoId ??
    streams[1]?.videoId ??
    streams[0]?.videoId ??
    null;

  const primaryStream = streams.find((s) => s.videoId === resolvedPrimaryId);
  const primaryIndex = streams.findIndex((s) => s.videoId === resolvedPrimaryId);
  const showDualSplit = isSplitChat && streams.length > 1;
  const isWarmActive = keepChatAlive && !ecoModeEnabled;

  const handlePopoutChat = (targetVideoId: string | null = resolvedPrimaryId) => {
    if (!targetVideoId) return;
    const chatUrl = getYouTubeLiveChatUrl(targetVideoId, embedDomain, isDark);
    window.open(
      chatUrl,
      `TCT_LiveChat_${targetVideoId}`,
      "width=420,height=720,resizable=yes,scrollbars=yes"
    );
    toast.info("Opened Live Chat in pop-out window");
  };

  return (
    <aside
      aria-hidden={keepWarmOffscreen}
      inert={keepWarmOffscreen}
      style={
        {
          "--chat-w": `${chatSidebarWidth}px`,
        } as React.CSSProperties
      }
      className={cn(
        "flex shrink-0 flex-col border-l border-zinc-200/80 bg-white transition-colors duration-200 dark:border-zinc-800/90 dark:bg-zinc-950",
        keepWarmOffscreen
          ? "fixed top-16 -left-[9999px] h-[calc(100vh-4rem)] w-[var(--chat-w)] invisible pointer-events-none"
          : "fixed inset-x-0 top-16 bottom-0 z-40 w-full sm:static sm:inset-auto sm:z-auto sm:h-[calc(100vh-4rem)] sm:w-[var(--chat-w)]"
      )}
    >
      {/* Draggable Left Resizer Handle */}
      {!keepWarmOffscreen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Live Chat Sidebar (double-click to reset)"
          onPointerDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
            setSplitterDragging(true);
          }}
          onDoubleClick={() => {
            setChatSidebarWidth(360);
            toast.info("Reset Live Chat width to default (360px)");
          }}
          title="Drag to resize Live Chat width (double-click to reset to 360px)"
          className={cn(
            "group/resize absolute inset-y-0 -left-1 z-30 hidden w-2 cursor-col-resize items-center justify-center sm:flex",
            isResizing && "bg-emerald-500/20"
          )}
        >
          <div
            className={cn(
              "h-12 w-1 rounded-full transition-all",
              isResizing
                ? "h-24 bg-emerald-500"
                : "bg-zinc-300/60 opacity-0 group-hover/resize:bg-emerald-500/80 group-hover/resize:opacity-100 dark:bg-zinc-700/80"
            )}
          />
          {isResizing && (
            <span className="pointer-events-none absolute top-3 -left-12 rounded-md border border-emerald-500/40 bg-zinc-900/95 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300 shadow-md">
              {chatSidebarWidth}px
            </span>
          )}
        </div>
      )}

      {/* Sleek Compact Top Chat Control Header */}
      <div className="flex items-center justify-between gap-1.5 border-b border-zinc-200/80 bg-zinc-50/90 px-2.5 py-1.5 dark:border-zinc-800/90 dark:bg-zinc-900/75">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <MessageSquare className="size-3" />
          </span>
          <span className="shrink-0 text-[11px] font-bold tracking-wide text-zinc-900 uppercase dark:text-zinc-100">
            {showDualSplit ? "Dual Chat" : "Live Chat"}
          </span>
          {resolvedPrimaryId && (
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          )}
          {isCompactChat && !showDualSplit && primaryStream && (
            <span className="truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              • #{primaryIndex + 1} {primaryStream.label.split("—")[0].trim()}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* Audio Follows Chat Quick Toggle */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    const next = !audioFollowsChat;
                    setAudioFollowsChat(next);
                    toast.info(
                      next
                        ? "Audio synced to active Live Chat"
                        : "Audio-follows-Chat disabled"
                    );
                  }}
                  className={cn(
                    "size-6.5 rounded-md transition",
                    audioFollowsChat
                      ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                      : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  )}
                />
              }
            >
              <Headphones className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              {audioFollowsChat
                ? "Audio follows Chat: ON"
                : "Sync Audio with Chat Selection"}
            </TooltipContent>
          </Tooltip>

          {/* Keep Chats Warm Toggle (Instant 0ms Switch) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    const next = !keepChatAlive;
                    setKeepChatAlive(next);
                    toast.info(
                      next
                        ? "Instant Chat Cache ON (keeps Live Chat mode & scroll)"
                        : "Instant Chat Cache OFF (frees background chat RAM)"
                    );
                  }}
                  className={cn(
                    "size-6.5 rounded-md transition",
                    isWarmActive
                      ? "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                      : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  )}
                />
              }
            >
              <Zap className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              {ecoModeEnabled
                ? "Instant Chat Cache paused by Eco Mode"
                : keepChatAlive
                  ? "Instant Chat Cache: ON (0ms switch, keeps Live Chat filter)"
                  : "Instant Chat Cache: OFF (unmounts inactive chats)"}
            </TooltipContent>
          </Tooltip>

          {/* Split Dual-Chat Toggle */}
          {streams.length > 1 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      const next = !isSplitChat;
                      setSplitChat(next);
                      toast.info(
                        next
                          ? "Split Dual-Chat enabled"
                          : "Single Live Chat mode"
                      );
                    }}
                    className={cn(
                      "size-6.5 rounded-md transition",
                      isSplitChat
                        ? "bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 dark:text-sky-400"
                        : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    )}
                  />
                }
              >
                <Rows2 className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                {isSplitChat
                  ? "Switch to Single Chat view (Shift+C)"
                  : "Split Dual-Chat (2 streams stacked, Shift+C)"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Compact / Zen Header Toggle */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    const next = !isCompactChat;
                    setCompactChat(next);
                    toast.info(
                      next
                        ? "Compact Chat mode (maximized message area)"
                        : "Standard Chat header restored"
                    );
                  }}
                  className={cn(
                    "size-6.5 rounded-md transition",
                    isCompactChat
                      ? "bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 dark:text-sky-400"
                      : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  )}
                />
              }
            >
              {isCompactChat ? (
                <ChevronsDown className="size-3.5" />
              ) : (
                <ChevronsUp className="size-3.5" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isCompactChat
                ? "Expand stream info bar"
                : "Compact mode (maximize chat reading space)"}
            </TooltipContent>
          </Tooltip>

          {/* Pop-out Native Chat Window */}
          {resolvedPrimaryId && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handlePopoutChat(resolvedPrimaryId)}
                    className="size-6.5 rounded-md text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  />
                }
              >
                <PictureInPicture2 className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>Pop out chat into separate window</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setChatOpen(false)}
                  className="size-6.5 rounded-md text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                />
              }
            >
              <PanelRightClose className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Collapse Live Chat (C)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Primary Chat Pane (and Optional Resizable Secondary Split Chat Pane) */}
      <div
        ref={panesContainerRef}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ChatPane
          streams={streams}
          selectedVideoId={resolvedPrimaryId}
          onSelectStream={(id) => setActiveChatStream(id, true)}
          embedDomain={embedDomain}
          isDark={isDark}
          labelPrefix={showDualSplit ? "CH A" : undefined}
          isSplitterDragging={isSplitterDragging}
          unmutedVideoIds={unmutedVideoIds}
          keepChatAlive={keepChatAlive}
          ecoModeEnabled={ecoModeEnabled}
          isCompact={isCompactChat}
          onPopout={handlePopoutChat}
          onSwapPanes={() => {
            swapSplitChatStreams();
            toast.info("Swapped CH A ↔ CH B chats");
          }}
          showSwapButton={showDualSplit}
          paneStyle={
            showDualSplit
              ? { flex: `0 0 ${splitChatRatio}%` }
              : undefined
          }
        />

        {showDualSplit && (
          <>
            {/* Draggable Horizontal Splitter between CH A and CH B */}
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize Dual Live Chat split (double-click to reset)"
              onPointerDown={(e) => {
                e.preventDefault();
                setIsSplitResizing(true);
                setSplitterDragging(true);
              }}
              onDoubleClick={() => {
                setSplitChatRatio(50);
                toast.info("Reset Dual Chat split to 50 / 50");
              }}
              title="Drag to resize CH A / CH B split (double-click to reset)"
              className={cn(
                "group/split-chat relative z-30 flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-zinc-200/90 bg-zinc-100/80 transition dark:border-zinc-800/90 dark:bg-zinc-900/80",
                isSplitResizing && "bg-sky-500/20"
              )}
            >
              <div
                className={cn(
                  "h-0.5 w-10 rounded-full transition-all",
                  isSplitResizing
                    ? "w-20 bg-sky-500"
                    : "bg-zinc-400/60 group-hover/split-chat:w-16 group-hover/split-chat:bg-sky-500 dark:bg-zinc-600"
                )}
              />
              {isSplitResizing && (
                <span className="pointer-events-none absolute right-2 rounded bg-zinc-900/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sky-300 shadow">
                  {splitChatRatio}% / {100 - splitChatRatio}%
                </span>
              )}
            </div>

            <ChatPane
              streams={streams}
              selectedVideoId={resolvedSecondaryId}
              onSelectStream={(id) => setSecondaryChatStream(id)}
              embedDomain={embedDomain}
              isDark={isDark}
              labelPrefix="CH B"
              isSplitterDragging={isSplitterDragging}
              unmutedVideoIds={unmutedVideoIds}
              keepChatAlive={keepChatAlive}
              ecoModeEnabled={ecoModeEnabled}
              isCompact={isCompactChat}
              onPopout={handlePopoutChat}
              paneStyle={{ flex: "1 1 0%" }}
            />
          </>
        )}
      </div>
    </aside>
  );
}
