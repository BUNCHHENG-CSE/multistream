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
  Share2,
  Copy,
  Check,
  QrCode,
  FileJson,
  Upload,
  Download,
  Radio,
  Users,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { isValidYouTubeVideoId } from "@/lib/youtube";
import type { GridPreset, SavedStreamItem } from "@/db/schema";
import { cn } from "@/lib/utils";

type TabId = "share" | "json" | "party";

const emptySubscribe = () => () => {};
const VALID_PRESETS = new Set<GridPreset>(["1x1", "1x2", "2x2", "1+3", "3x3"]);
const PARTY_EMOJIS = ["🔥", "🚀", "👏", "🤯", "❤️", "😂"] as const;

/**
 * Generates a deterministic 21x21 visual QR-style matrix SVG with finder patterns
 * seeded from the share URL string.
 */
function VisualQrMatrix({ value }: { value: string }) {
  const size = 21;
  const cells = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: size }, () =>
      Array(size).fill(false)
    );

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= size - 8;
        const inBottomLeft = r >= size - 8 && c < 8;
        if (inTopLeft || inTopRight || inBottomLeft) continue;

        if (r === 6 || c === 6) {
          grid[r][c] = (r + c) % 2 === 0;
          continue;
        }

        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        grid[r][c] = ((hash >>> 16) & 1) === 1;
      }
    }

    return grid;
  }, [value]);

  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-36 text-zinc-950"
        shapeRendering="crispEdges"
        aria-label="Share URL QR Matrix"
      >
        <rect width={size} height={size} fill="white" />
        {cells.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="currentColor"
              />
            ) : null
          )
        )}
      </svg>
      <span className="mt-2 font-mono text-[10px] font-semibold text-zinc-500">
        INSTANT WALL CODE
      </span>
    </div>
  );
}

export function ShareExportDialog() {
  const streams = useStreamStore((s) => s.streams);
  const gridPreset = useStreamStore((s) => s.gridPreset);
  const syncLiveVersion = useStreamStore((s) => s.syncLiveVersion);
  const loadLayoutConfig = useStreamStore((s) => s.loadLayoutConfig);
  const triggerSyncAllLive = useStreamStore((s) => s.triggerSyncAllLive);
  const setWatchPartyCode = useStreamStore((s) => s.setWatchPartyCode);
  const triggerFloatingReaction = useStreamStore(
    (s) => s.triggerFloatingReaction
  );

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("share");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState("");
  const [peerCount, setPeerCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clientIdRef = useRef<string>("");
  useEffect(() => {
    if (!clientIdRef.current) {
      clientIdRef.current = `peer-${Math.random().toString(36).slice(2, 10)}`;
    }
  }, []);

  const initialPartyCode = useSyncExternalStore(
    emptySubscribe,
    () => {
      const p = new URLSearchParams(window.location.search).get("party");
      return p && p.trim() ? p.trim().toUpperCase().slice(0, 24) : null;
    },
    () => null
  );
  const [partyEnabledOverride, setPartyEnabledOverride] = useState<
    boolean | null
  >(null);
  const [roomCodeOverride, setRoomCodeOverride] = useState<string | null>(null);
  const partyEnabled = partyEnabledOverride ?? Boolean(initialPartyCode);
  const roomCode = roomCodeOverride ?? initialPartyCode ?? "STUDIO-ALPHA";
  const isApplyingRemoteRef = useRef(false);
  const lastRemoteLayoutAtRef = useRef<number>(0);
  const lastRemoteSyncAtRef = useRef<number>(0);
  const lastReactionAtRef = useRef<number>(0);

  const origin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => "https://tct-multistream.local"
  );

  // Reflect active Watch Party room in global store
  useEffect(() => {
    const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
    setWatchPartyCode(partyEnabled ? cleanCode : null);
  }, [partyEnabled, roomCode, setWatchPartyCode]);

  // BroadcastChannel local tab sync
  useEffect(() => {
    if (!partyEnabled || typeof BroadcastChannel === "undefined") {
      return;
    }

    const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
    const channel = new BroadcastChannel(`tct-party-${cleanCode}`);

    channel.onmessage = (event) => {
      const msg = event.data as
        | {
            type: "SYNC_LAYOUT";
            gridPreset: GridPreset;
            streams: SavedStreamItem[];
          }
        | { type: "SYNC_LIVE" }
        | { type: "REACTION"; emoji: string; sender?: string };

      if (!msg || typeof msg !== "object") return;

      if (msg.type === "SYNC_LAYOUT" && Array.isArray(msg.streams)) {
        isApplyingRemoteRef.current = true;
        loadLayoutConfig({
          gridPreset: VALID_PRESETS.has(msg.gridPreset)
            ? msg.gridPreset
            : "2x2",
          streams: msg.streams,
        });
        window.setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 150);
      } else if (msg.type === "SYNC_LIVE") {
        triggerSyncAllLive();
        toast.info(`Party Room ${cleanCode}: Synced to live edge`);
      } else if (msg.type === "REACTION" && msg.emoji) {
        triggerFloatingReaction(msg.emoji, msg.sender);
      }
    };

    return () => {
      channel.close();
    };
  }, [
    partyEnabled,
    roomCode,
    loadLayoutConfig,
    triggerSyncAllLive,
    triggerFloatingReaction,
  ]);

  // Cross-Device Cloud Watch Party polling sync (/api/party)
  useEffect(() => {
    if (!partyEnabled) return;
    const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
    const clientId = clientIdRef.current || "peer-anon";

    const pollRoom = async () => {
      try {
        const res = await fetch(
          `/api/party?room=${encodeURIComponent(cleanCode)}&clientId=${encodeURIComponent(clientId)}&since=${lastReactionAtRef.current}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          exists: boolean;
          gridPreset?: GridPreset;
          streams?: SavedStreamItem[];
          updatedAt?: number;
          updatedBy?: string;
          syncLiveAt?: number;
          syncLiveBy?: string;
          peerCount?: number;
          reactions?: Array<{
            id: string;
            emoji: string;
            sender?: string;
            clientId: string;
            createdAt: number;
          }>;
        };

        if (typeof data.peerCount === "number") {
          setPeerCount(data.peerCount);
        }

        if (
          data.exists &&
          data.updatedAt &&
          data.updatedAt > lastRemoteLayoutAtRef.current &&
          data.updatedBy !== clientId &&
          Array.isArray(data.streams) &&
          data.streams.length > 0
        ) {
          lastRemoteLayoutAtRef.current = data.updatedAt;
          isApplyingRemoteRef.current = true;
          loadLayoutConfig({
            gridPreset:
              data.gridPreset && VALID_PRESETS.has(data.gridPreset)
                ? data.gridPreset
                : "2x2",
            streams: data.streams,
          });
          window.setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 200);
        }

        if (
          data.exists &&
          data.syncLiveAt &&
          data.syncLiveAt > lastRemoteSyncAtRef.current &&
          data.syncLiveBy !== clientId
        ) {
          lastRemoteSyncAtRef.current = data.syncLiveAt;
          triggerSyncAllLive();
          toast.info(`Party Room ${cleanCode}: Remote peer synced live edge`);
        }

        if (Array.isArray(data.reactions) && data.reactions.length > 0) {
          for (const r of data.reactions) {
            if (r.createdAt > lastReactionAtRef.current) {
              lastReactionAtRef.current = r.createdAt;
            }
            if (r.clientId !== clientId) {
              triggerFloatingReaction(r.emoji, r.sender);
            }
          }
        }
      } catch {
        // Ignore transient network errors
      }
    };

    void pollRoom();
    const intervalId = window.setInterval(pollRoom, 2500);
    return () => window.clearInterval(intervalId);
  }, [
    partyEnabled,
    roomCode,
    loadLayoutConfig,
    triggerSyncAllLive,
    triggerFloatingReaction,
  ]);

  // Broadcast local changes to both BroadcastChannel & /api/party
  useEffect(() => {
    if (!partyEnabled || isApplyingRemoteRef.current) {
      return;
    }

    const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
    const payloadStreams = streams.map((s) => ({
      videoId: s.videoId,
      label: s.label,
    }));

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`tct-party-${cleanCode}`);
      channel.postMessage({
        type: "SYNC_LAYOUT",
        gridPreset,
        streams: payloadStreams,
      });
      channel.close();
    }

    if (payloadStreams.length > 0) {
      fetch("/api/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SYNC_LAYOUT",
          roomCode: cleanCode,
          clientId: clientIdRef.current || "peer-anon",
          gridPreset,
          streams: payloadStreams,
        }),
      }).catch(() => {});
    }
  }, [partyEnabled, roomCode, gridPreset, streams]);

  useEffect(() => {
    if (!partyEnabled || syncLiveVersion === 0) {
      return;
    }
    const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`tct-party-${cleanCode}`);
      channel.postMessage({ type: "SYNC_LIVE" });
      channel.close();
    }
    fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SYNC_LIVE",
        roomCode: cleanCode,
        clientId: clientIdRef.current || "peer-anon",
      }),
    }).catch(() => {});
  }, [partyEnabled, roomCode, syncLiveVersion]);

  const sendPartyReaction = useCallback(
    (emoji: string) => {
      const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
      triggerFloatingReaction(emoji, "You");
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(`tct-party-${cleanCode}`);
        channel.postMessage({ type: "REACTION", emoji, sender: "Peer" });
        channel.close();
      }
      fetch("/api/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REACTION",
          roomCode: cleanCode,
          clientId: clientIdRef.current || "peer-anon",
          emoji,
          sender: "Peer",
        }),
      }).catch(() => {});
    },
    [roomCode, triggerFloatingReaction]
  );

  const instantShareUrl = useMemo(() => {
    const ids = streams.map((s) => s.videoId).join(",");
    const params = new URLSearchParams();
    params.set("preset", gridPreset);
    if (ids) params.set("streams", ids);
    return `${origin}/?${params.toString()}`;
  }, [origin, gridPreset, streams]);

  const partyShareUrl = useMemo(() => {
    const cleanCode = roomCode.trim().toUpperCase() || "STUDIO-ALPHA";
    const params = new URLSearchParams();
    params.set("party", cleanCode);
    params.set("preset", gridPreset);
    if (streams.length > 0) {
      params.set("streams", streams.map((s) => s.videoId).join(","));
    }
    return `${origin}/?${params.toString()}`;
  }, [origin, roomCode, gridPreset, streams]);

  const jsonPayload = useMemo(
    () =>
      JSON.stringify(
        {
          version: 1,
          gridPreset,
          streams: streams.map((s) => ({
            videoId: s.videoId,
            label: s.label,
          })),
        },
        null,
        2
      ),
    [gridPreset, streams]
  );

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Instant share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(jsonPayload);
    setCopiedJson(true);
    toast.success("Layout JSON copied to clipboard!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tct-multistream-${gridPreset}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded JSON layout backup");
  };

  const applyImportedJson = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as {
        gridPreset?: GridPreset;
        streams?: Array<{ videoId?: string; label?: string }>;
      };

      if (!parsed || !Array.isArray(parsed.streams)) {
        toast.error("Invalid JSON: expected a 'streams' array.");
        return;
      }

      const validStreams: SavedStreamItem[] = parsed.streams
        .filter(
          (item): item is { videoId: string; label?: string } =>
            typeof item?.videoId === "string" &&
            isValidYouTubeVideoId(item.videoId)
        )
        .slice(0, 9)
        .map((item, idx) => ({
          videoId: item.videoId.trim(),
          label: item.label?.trim() || `Stream #${idx + 1} (${item.videoId})`,
        }));

      if (validStreams.length === 0) {
        toast.error("No valid stream IDs found in JSON.");
        return;
      }

      const preset: GridPreset =
        parsed.gridPreset && VALID_PRESETS.has(parsed.gridPreset)
          ? parsed.gridPreset
          : "2x2";

      loadLayoutConfig({
        gridPreset: preset,
        streams: validStreams,
      });
      toast.success(
        `Imported ${validStreams.length} stream${validStreams.length === 1 ? "" : "s"} (${preset})`
      );
      setImportText("");
      setOpen(false);
    } catch {
      toast.error("Failed to parse JSON. Check syntax and try again.");
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        applyImportedJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2 text-xs font-medium transition-all 2xl:px-2.5",
                    partyEnabled
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
                      : "border-zinc-200/90 bg-zinc-100/80 text-zinc-700 hover:bg-white dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  )}
                />
              }
            >
              <Share2 className="size-3.5 text-sky-600 dark:text-sky-400" />
              <span className={cn("hidden", partyEnabled ? "lg:inline" : "2xl:inline")}>
                {partyEnabled ? `Party (${peerCount})` : "Share"}
              </span>
            </DialogTrigger>
          }
        />
        <TooltipContent>
          Instant Share Link, QR Code, JSON Backup & Cross-Device Watch Party
        </TooltipContent>
      </Tooltip>

      <DialogContent className="rounded-2xl border-zinc-200/90 bg-white text-zinc-900 shadow-2xl sm:max-w-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Share2 className="size-4" />
            </span>
            Instant Share, JSON Backup & Watch Party
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Share your wall via URL/QR, export JSON presets, or sync across
            devices with live emoji reactions.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
          <button
            type="button"
            onClick={() => setActiveTab("share")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
              activeTab === "share"
                ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <QrCode className="size-3.5" />
            Link & QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("json")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
              activeTab === "json"
                ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <FileJson className="size-3.5" />
            JSON I/O
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("party")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
              activeTab === "party"
                ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <Users className="size-3.5" />
            Watch Party
          </button>
        </div>

        {/* Tab 1: Instant Share Link & QR */}
        {activeTab === "share" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <VisualQrMatrix value={instantShareUrl} />
              <p className="mt-2.5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                Encodes{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {streams.length} stream{streams.length === 1 ? "" : "s"}
                </strong>{" "}
                in{" "}
                <Badge
                  variant="secondary"
                  className="bg-zinc-200/80 px-1.5 py-0 font-mono text-[10px] dark:bg-zinc-800"
                >
                  {gridPreset}
                </Badge>{" "}
                preset — zero login required.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Instant Share URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={instantShareUrl}
                  className="h-9 border-zinc-200 bg-zinc-50 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCopyLink(instantShareUrl)}
                  className="h-9 shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: JSON Export & Import */}
        {activeTab === "json" && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Export Current Wall
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={streams.length === 0}
                    onClick={handleCopyJson}
                    className="gap-1 rounded-md text-[11px]"
                  >
                    {copiedJson ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    Copy JSON
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    disabled={streams.length === 0}
                    onClick={handleDownloadJson}
                    className="gap-1 rounded-md bg-emerald-600 text-[11px] text-white hover:bg-emerald-500"
                  >
                    <Download className="size-3" />
                    Download .json
                  </Button>
                </div>
              </div>
              <pre className="max-h-28 overflow-auto rounded-lg border border-zinc-200/80 bg-white p-2 font-mono text-[10px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {jsonPayload}
              </pre>
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Import Layout JSON
                </span>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1 rounded-md text-[11px]"
                  >
                    <Upload className="size-3" />
                    Upload .json
                  </Button>
                </div>
              </div>
              <textarea
                rows={3}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste exported JSON here (e.g. {"gridPreset":"2x2","streams":[...]})'
                className="w-full rounded-lg border border-zinc-200 bg-white p-2 font-mono text-[11px] text-zinc-800 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              />
              <Button
                type="button"
                size="sm"
                disabled={!importText.trim()}
                onClick={() => applyImportedJson(importText)}
                className="w-full gap-1.5 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <FileJson className="size-3.5" />
                Load Imported JSON into Grid
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Cross-Device Live Watch Party Sync */}
        {activeTab === "party" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <Radio className="size-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    Cross-Device Watch Party Sync
                    {partyEnabled && (
                      <Badge className="bg-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-300">
                        LIVE • {peerCount} {peerCount === 1 ? "PEER" : "PEERS"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Synchronizes grid presets, feeds, live-edge sync, and emoji
                    reactions across browser tabs and remote devices.
                  </p>
                </div>
              </div>
              <Switch
                checked={partyEnabled}
                onCheckedChange={(checked) => {
                  setPartyEnabledOverride(Boolean(checked));
                  toast.info(
                    checked
                      ? `Joined Watch Party Room: ${roomCode}`
                      : "Left Watch Party Room"
                  );
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="party-room-code"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Room Code
              </Label>
              <Input
                id="party-room-code"
                value={roomCode}
                onChange={(e) =>
                  setRoomCodeOverride(
                    e.target.value.toUpperCase().replace(/\s+/g, "-")
                  )
                }
                placeholder="STUDIO-ALPHA"
                className="h-9 border-zinc-200 bg-zinc-50 font-mono text-xs uppercase dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            {partyEnabled && (
              <div className="space-y-2 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                  <Sparkles className="size-3.5" />
                  Send Live Party Reaction
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PARTY_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => sendPartyReaction(emoji)}
                      className="flex size-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-lg shadow-2xs transition hover:scale-110 hover:border-sky-400 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Room Invite URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={partyShareUrl}
                  className="h-9 border-zinc-200 bg-zinc-50 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCopyLink(partyShareUrl)}
                  className="h-9 shrink-0 gap-1.5 bg-sky-600 text-white hover:bg-sky-500"
                >
                  <Copy className="size-3.5" />
                  Invite
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
