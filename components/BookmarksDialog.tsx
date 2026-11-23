"use client";

import React, { useState } from "react";
import {
  Bookmark,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Tv,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStreamStore } from "@/store/useStreamStore";
import { getStreamPlatform } from "@/lib/youtube";

export function BookmarksDialog() {
  const isOpen = useStreamStore((s) => s.isBookmarksOpen);
  const setOpen = useStreamStore((s) => s.setBookmarksOpen);
  const streams = useStreamStore((s) => s.streams);
  const focusedVideoId = useStreamStore((s) => s.focusedVideoId);
  const bookmarks = useStreamStore((s) => s.bookmarks);
  const addBookmark = useStreamStore((s) => s.addBookmark);
  const removeBookmark = useStreamStore((s) => s.removeBookmark);
  const clearBookmarks = useStreamStore((s) => s.clearBookmarks);

  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const resolvedVideoId =
    streams.find((s) => s.videoId === selectedVideoId)?.videoId ??
    focusedVideoId ??
    streams[0]?.videoId ??
    "";

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedVideoId) {
      toast.error("Add a stream first before logging a timestamp bookmark.");
      return;
    }
    const created = addBookmark(resolvedVideoId, note);
    if (created) {
      toast.success(`Logged [${created.elapsedLabel}] ${created.note}`);
      setNote("");
    }
  };

  const handleCopyMarkdown = async () => {
    if (bookmarks.length === 0) return;
    const lines = [
      `# TCT MultiStream Broadcast Notes`,
      "",
      ...bookmarks.map(
        (b) =>
          b.videoTimeSec !== undefined && getStreamPlatform(b.videoId) === "youtube"
            ? `- **[${b.elapsedLabel}](https://www.youtube.com/watch?v=${b.videoId}&t=${b.videoTimeSec}s)** (${b.streamLabel}) — ${b.note}`
            : `- **[${b.elapsedLabel}]** (${b.streamLabel}) — ${b.note}`
      ),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Copied all broadcast notes as Markdown!");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="rounded-2xl border-zinc-200/90 bg-white text-zinc-900 shadow-2xl sm:max-w-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Bookmark className="size-4" />
            </span>
            Broadcast Notes & Timestamp Bookmarks
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Capture timestamped moments across active feeds and export them as
            clean Markdown production logs.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Log Form */}
        <form
          onSubmit={handleAddBookmark}
          className="space-y-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/75 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="flex items-center gap-2">
            <Select
              value={resolvedVideoId}
              onValueChange={(val) => {
                if (val) setSelectedVideoId(val);
              }}
              disabled={streams.length === 0}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-full rounded-lg border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950"
              >
                <SelectValue placeholder="Select stream feed" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-900">
                {streams.map((s, idx) => (
                  <SelectItem key={s.videoId} value={s.videoId}>
                    #0{idx + 1} • {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Falcon 9 Stage 1 landing burn / Key goal..."
              disabled={streams.length === 0}
              className="h-8.5 flex-1 border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950"
            />
            <Button
              type="submit"
              size="sm"
              disabled={streams.length === 0}
              className="h-8.5 shrink-0 gap-1.5 rounded-lg bg-amber-600 text-xs font-semibold text-white hover:bg-amber-500"
            >
              <Plus className="size-3.5" />
              Log
            </Button>
          </div>
        </form>

        {/* Bookmark List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Logged Moments ({bookmarks.length})
            </span>
            {bookmarks.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleCopyMarkdown}
                  className="gap-1 rounded-md text-[11px]"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  Copy Markdown
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    clearBookmarks();
                    toast.info("Cleared all broadcast notes");
                  }}
                  className="gap-1 rounded-md text-[11px] text-zinc-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="size-3" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/25">
              <Clock className="mb-2 size-5 text-zinc-400" />
              No timestamped notes yet. Click{" "}
              <strong className="mx-1 text-zinc-700 dark:text-zinc-300">
                Log
              </strong>{" "}
              above or the bookmark button on any video tile.
            </div>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {bookmarks.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.videoTimeSec !== undefined &&
                      getStreamPlatform(item.videoId) === "youtube" ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${encodeURIComponent(
                            item.videoId
                          )}&t=${item.videoTimeSec}s`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open on YouTube at this moment"
                          className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0 font-mono text-[10px] font-bold text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
                        >
                          ▶ {item.elapsedLabel}
                        </a>
                      ) : (
                        <Badge
                          variant="secondary"
                          title="Session time (live stream)"
                          className="bg-amber-500/15 px-1.5 py-0 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300"
                        >
                          {item.elapsedLabel}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1 truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        <Tv className="size-3 shrink-0" />
                        <span className="truncate">{item.streamLabel}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {item.note}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBookmark(item.id)}
                    aria-label="Remove bookmark"
                    className="rounded-md p-1 text-zinc-400 opacity-70 transition hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
