"use client";

import React, { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  Cloud,
  Copy,
  Globe,
  HardDrive,
  Loader2,
  Lock,
  Radio,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GridPresetIcon } from "@/components/GridPresetIcon";
import { StudioAuthForm, type StudioUser } from "@/components/StudioAuthForm";
import { saveLayout } from "@/actions/layouts";
import { useStreamStore } from "@/store/useStreamStore";
import type { SavedLayout } from "@/db/schema";
import { cn } from "@/lib/utils";

interface SaveLayoutDialogProps {
  currentUser: StudioUser | null;
  githubAuthEnabled?: boolean;
  onUserAuthenticated?: (user: StudioUser) => void;
  onLayoutSaved?: (layout: SavedLayout) => void;
}

const emptySubscribe = () => () => {};

export function SaveLayoutDialog({
  currentUser,
  githubAuthEnabled = false,
  onUserAuthenticated,
  onLayoutSaved,
}: SaveLayoutDialogProps) {
  const router = useRouter();
  const streams = useStreamStore((s) => s.streams);
  const gridPreset = useStreamStore((s) => s.gridPreset);
  const guestName = useStreamStore((s) => s.guestName);
  const saveGuestLayout = useStreamStore((s) => s.saveGuestLayout);
  const setGuestProfile = useStreamStore((s) => s.setGuestProfile);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [guestSaveTab, setGuestSaveTab] = useState<"account" | "local">(
    "account"
  );
  const [savedShareUrl, setSavedShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const resolvedGuestName = mounted ? guestName : "Guest Director";

  const quickTitleSuggestions = useMemo(() => {
    const firstLabel = streams[0]?.label?.trim();
    const candidates = [
      firstLabel
        ? `${firstLabel.replace(/\s*\([^)]*\)$/, "").slice(0, 26)} • ${gridPreset}`
        : null,
      "Esports Quad View",
      "Command Center Wall",
      "Live Broadcast Mix",
    ].filter((item): item is string => Boolean(item));

    return Array.from(new Set(candidates)).slice(0, 3);
  }, [streams, gridPreset]);

  const handleReset = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSavedShareUrl(null);
      setCopied(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (streams.length === 0) {
      toast.error("Add at least one stream to your grid before saving.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your layout.");
      return;
    }

    const sanitizedStreams = streams.map((s) => ({
      videoId: s.videoId,
      label: s.label,
    }));

    if (!currentUser) {
      setGuestProfile(resolvedGuestName);
      const saved = saveGuestLayout({
        title: title.trim(),
        gridPreset,
        streams: sanitizedStreams,
      });
      toast.success(
        `Saved "${saved.title}" locally in this browser (Guest: ${resolvedGuestName})`
      );
      setTitle("");
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await saveLayout({
        title: title.trim(),
        gridPreset,
        streams: sanitizedStreams,
        isPublic,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Saved layout "${result.data.title}" to Neon Database!`);
      onLayoutSaved?.(result.data);
      setTitle("");

      if (result.data.isPublic && typeof window !== "undefined") {
        setSavedShareUrl(`${window.location.origin}/watch/${result.data.id}`);
      } else {
        setOpen(false);
      }
    });
  };

  const handleCopyShareUrl = async () => {
    if (!savedShareUrl) return;
    await navigator.clipboard.writeText(savedShareUrl);
    setCopied(true);
    toast.success("Public share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={streams.length === 0}
                  className="h-8 gap-1.5 rounded-lg border-zinc-200/90 bg-zinc-100/80 px-2 text-xs font-medium text-zinc-700 hover:border-emerald-500/40 hover:bg-white hover:text-emerald-700 2xl:px-2.5 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:bg-zinc-800 dark:hover:text-emerald-300"
                />
              }
            >
              <BookmarkPlus className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden 2xl:inline">Save</span>
            </DialogTrigger>
          }
        />
        <TooltipContent>
          Save Current Layout to Cloud or Browser
        </TooltipContent>
      </Tooltip>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-zinc-200/90 bg-white text-zinc-900 shadow-2xl sm:max-w-[470px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
        <DialogHeader className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-zinc-900 dark:text-zinc-100">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <BookmarkPlus className="size-4" />
              </span>
              Save Multi-Stream Layout
            </DialogTitle>

            <Badge
              variant="secondary"
              className={cn(
                "gap-1.5 px-2 py-0.5 text-[10px] font-semibold",
                currentUser
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
              )}
            >
              {currentUser ? (
                <>
                  <Cloud className="size-3" />
                  <span className="max-w-[120px] truncate">
                    Cloud · {currentUser.name}
                  </span>
                </>
              ) : (
                <>
                  <User className="size-3" />
                  <span className="max-w-[120px] truncate">
                    Guest · {resolvedGuestName}
                  </span>
                </>
              )}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Persist your current grid preset and active streams to Neon
            PostgreSQL or save locally in this browser.
          </DialogDescription>
        </DialogHeader>

        {savedShareUrl ? (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 dark:bg-emerald-950/25">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Globe className="size-4" />
                Layout Saved & Publicly Shareable!
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Anyone with this link can watch your multi-stream layout in
                read-only theater mode:
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  readOnly
                  value={savedShareUrl}
                  className="h-9 border-zinc-200 bg-white font-mono text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyShareUrl}
                  className="h-9 shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {copied ? (
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleReset(false)}
                className="border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Storage Mode Selector Cards (Guests / Unauthenticated) */}
            {!currentUser && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGuestSaveTab("account")}
                  className={cn(
                    "group flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                    guestSaveTab === "account"
                      ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30 dark:bg-emerald-950/30"
                      : "border-zinc-200/90 bg-zinc-50/70 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                      guestSaveTab === "account"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-200/80 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    <Cloud className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Cloud Account
                    </div>
                    <div className="mt-0.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                      PostgreSQL sync &amp; /watch links
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGuestSaveTab("local")}
                  className={cn(
                    "group flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                    guestSaveTab === "local"
                      ? "border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30 dark:bg-sky-950/30"
                      : "border-zinc-200/90 bg-zinc-50/70 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                      guestSaveTab === "local"
                        ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                        : "bg-zinc-200/80 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    <HardDrive className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Guest (Local)
                    </div>
                    <div className="mt-0.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                      Instant browser storage
                    </div>
                  </div>
                </button>
              </div>
            )}

            {!currentUser && guestSaveTab === "account" ? (
              <div className="space-y-3.5">
                {/* Compact Layout Telemetry Strip */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <GridPresetIcon
                      preset={gridPreset}
                      className="size-3.5 text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      Grid: {gridPreset}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Radio className="size-3 text-emerald-500" />
                      {streams.length} active stream
                      {streams.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Ready to Save
                  </span>
                </div>

                <StudioAuthForm
                  variant="embedded"
                  showGuestTab={false}
                  title="Sign In to Save to Cloud"
                  description="Sign in to save this layout to Neon PostgreSQL and generate public /watch links."
                  githubAuthEnabled={githubAuthEnabled}
                  onAuthenticated={(user) => {
                    onUserAuthenticated?.(user);
                    router.refresh();
                  }}
                  onContinueAsGuest={() => setGuestSaveTab("local")}
                  guestActionLabel="Use Guest (Local)"
                />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Guest Session Pill Bar */}
                {!currentUser && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[11px] dark:border-sky-500/20 dark:bg-sky-950/30">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-sky-500/20 text-sky-600 dark:text-sky-400">
                        <HardDrive className="size-3" />
                      </span>
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                          Guest: {resolvedGuestName}
                        </span>
                        <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                          Local Browser Storage
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuestSaveTab("account")}
                      className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      <span>Use Cloud Instead</span>
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                )}

                {/* Layout Title + 1-Click Quick Title Chips */}
                <div className="space-y-2">
                  <Label
                    htmlFor="layout-title"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Layout Title
                  </Label>
                  <div className="relative">
                    <Sparkles className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                    <Input
                      id="layout-title"
                      placeholder="e.g., Esports World Finals Quad View"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9.5 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-xs text-zinc-900 focus-visible:border-emerald-500/60 focus-visible:bg-white focus-visible:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:bg-zinc-950"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                      Quick fill:
                    </span>
                    {quickTitleSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTitle(suggestion)}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium transition",
                          title === suggestion
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "border-zinc-200 bg-zinc-100/80 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Refined Grid & Streams Telemetry Card */}
                <div className="space-y-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-3 dark:border-zinc-800/90 dark:bg-zinc-900/50">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950/80">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Grid
                      </span>
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-zinc-100 font-mono text-[11px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <GridPresetIcon
                          preset={gridPreset}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                        {gridPreset}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950/80">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Feeds
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        <Radio className="size-3 text-emerald-500" />
                        {streams.length} stream
                        {streams.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pt-0.5">
                    {streams.map((s, idx) => (
                      <span
                        key={s.videoId}
                        className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-zinc-200/90 bg-white px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                      >
                        <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{s.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Public Share Switch (Cloud Accounts Only) */}
                {currentUser && (
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3.5 dark:border-zinc-800/90 dark:bg-zinc-900/40">
                    <div className="space-y-0.5 pr-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {isPublic ? (
                          <Globe className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Lock className="size-3.5 text-zinc-400" />
                        )}
                        Public Shareable URL
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Allow anyone with the{" "}
                        <code className="font-mono text-zinc-700 dark:text-zinc-300">
                          /watch/[layoutId]
                        </code>{" "}
                        link to view this layout.
                      </p>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
                    />
                  </div>
                )}

                <DialogFooter className="gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleReset(false)}
                    className="h-9 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || streams.length === 0}
                    className={cn(
                      "h-9 gap-1.5 rounded-xl text-xs font-semibold text-white shadow-sm",
                      currentUser
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                        : "bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500"
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Saving to Neon...
                      </>
                    ) : (
                      <>
                        {currentUser ? (
                          <Cloud className="size-3.5" />
                        ) : (
                          <HardDrive className="size-3.5" />
                        )}
                        {currentUser
                          ? "Save Layout to Cloud"
                          : "Save Locally as Guest"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
