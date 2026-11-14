"use client";

import React, { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Cloud,
  CloudUpload,
  ExternalLink,
  FolderKanban,
  Globe,
  HardDrive,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Play,
  Share2,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { GridPresetIcon } from "@/components/GridPresetIcon";
import { StudioAuthForm, type StudioUser } from "@/components/StudioAuthForm";
import {
  deleteLayout,
  getUserLayouts,
  saveLayout,
  toggleLayoutPublic,
} from "@/actions/layouts";
import { authClient } from "@/lib/auth-client";
import { useStreamStore, type GuestLayout } from "@/store/useStreamStore";
import type { SavedLayout } from "@/db/schema";
import { cn } from "@/lib/utils";

interface SavedLayoutsDrawerProps {
  currentUser: StudioUser | null;
  initialLayouts: SavedLayout[];
  githubAuthEnabled?: boolean;
  onLayoutsChange?: React.Dispatch<React.SetStateAction<SavedLayout[]>>;
  onUserChange?: (user: StudioUser | null) => void;
}

const emptySubscribe = () => () => {};

export function SavedLayoutsDrawer({
  currentUser,
  initialLayouts,
  githubAuthEnabled = false,
  onLayoutsChange,
  onUserChange,
}: SavedLayoutsDrawerProps) {
  const router = useRouter();
  const loadLayoutConfig = useStreamStore((s) => s.loadLayoutConfig);
  const guestLayouts = useStreamStore((s) => s.guestLayouts);
  const guestName = useStreamStore((s) => s.guestName);
  const deleteGuestLayout = useStreamStore((s) => s.deleteGuestLayout);

  const [open, setOpen] = useState(false);
  const [showGuestAuth, setShowGuestAuth] = useState(false);
  const [pendingSyncAfterAuth, setPendingSyncAfterAuth] = useState(false);
  const [isSyncingGuest, setIsSyncingGuest] = useState(false);
  const [localLayouts, setLocalLayouts] =
    useState<SavedLayout[]>(initialLayouts);
  const layouts = onLayoutsChange ? initialLayouts : localLayouts;
  const setLayouts = onLayoutsChange ?? setLocalLayouts;
  const [isPending, startTransition] = useTransition();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const resolvedGuestName = mounted ? guestName : "Guest Director";
  const resolvedGuestLayouts = mounted ? guestLayouts : [];
  const badgeCount = currentUser ? layouts.length : resolvedGuestLayouts.length;

  const refreshLayouts = () => {
    startTransition(async () => {
      const res = await getUserLayouts();
      if (res.success) {
        setLayouts(res.data);
      }
    });
  };

  const syncGuestLayoutsToCloud = async (itemsToSync: GuestLayout[]) => {
    if (itemsToSync.length === 0) return;

    setIsSyncingGuest(true);
    let syncedCount = 0;
    let firstError: string | null = null;

    try {
      for (const item of itemsToSync) {
        const res = await saveLayout({
          title: item.title,
          gridPreset: item.gridPreset,
          streams: item.streams,
          isPublic: false,
        });

        if (res.success) {
          deleteGuestLayout(item.id);
          syncedCount += 1;
        } else if (!firstError) {
          firstError = res.error;
        }
      }

      const layoutsRes = await getUserLayouts();
      if (layoutsRes.success) {
        setLayouts(layoutsRes.data);
      }

      if (syncedCount > 0) {
        toast.success(
          `Synced ${syncedCount} local guest layout${syncedCount === 1 ? "" : "s"} to Cloud!`
        );
      }
      if (firstError) {
        toast.error(firstError);
      }
    } catch (error) {
      console.error("[SavedLayoutsDrawer] Sync error:", error);
      toast.error("Could not sync local guest layouts to the cloud.");
    } finally {
      setIsSyncingGuest(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setShowGuestAuth(false);
      setPendingSyncAfterAuth(false);
    } else if (currentUser) {
      refreshLayouts();
    }
  };

  const handleAuthenticated = async (user: StudioUser) => {
    const shouldSync = pendingSyncAfterAuth && guestLayouts.length > 0;
    const snapshotToSync = [...guestLayouts];

    setShowGuestAuth(false);
    setPendingSyncAfterAuth(false);
    onUserChange?.(user);

    if (shouldSync) {
      await syncGuestLayoutsToCloud(snapshotToSync);
    } else {
      const layoutsRes = await getUserLayouts();
      if (layoutsRes.success) {
        setLayouts(layoutsRes.data);
      }
    }

    router.refresh();
  };

  const handleSignOut = () => {
    startTransition(async () => {
      const result = await authClient.signOut();
      if (result.error) {
        toast.error(result.error.message || "Failed to sign out.");
        return;
      }
      onUserChange?.(null);
      setLayouts([]);
      router.refresh();
      toast.info("Signed out of Studio Account");
    });
  };

  const handleLoadLayout = (layout: SavedLayout | GuestLayout) => {
    loadLayoutConfig({
      gridPreset: layout.gridPreset,
      streams: layout.streams,
    });
    toast.success(`Loaded "${layout.title}" (${layout.gridPreset})`);
    setOpen(false);
  };

  const handleDeleteGuestLayout = (layoutId: string, title: string) => {
    deleteGuestLayout(layoutId);
    toast.info(`Removed local guest layout "${title}"`);
  };

  const handleDeleteLayout = (layoutId: string, title: string) => {
    startTransition(async () => {
      const res = await deleteLayout(layoutId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setLayouts((prev) => prev.filter((item) => item.id !== layoutId));
      toast.success(`Deleted layout "${title}"`);
    });
  };

  const handleToggleShare = (layout: SavedLayout) => {
    startTransition(async () => {
      const nextPublic = !layout.isPublic;
      const res = await toggleLayoutPublic(layout.id, nextPublic);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setLayouts((prev) =>
        prev.map((item) => (item.id === layout.id ? res.data : item))
      );
      if (nextPublic && typeof window !== "undefined") {
        const shareUrl = `${window.location.origin}/watch/${layout.id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Layout made public & share link copied!");
      } else {
        toast.info("Layout set to private");
      }
    });
  };

  const handleCopyLink = async (layout: SavedLayout) => {
    if (typeof window === "undefined") return;
    if (!layout.isPublic) {
      handleToggleShare(layout);
      return;
    }
    const shareUrl = `${window.location.origin}/watch/${layout.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Shareable link copied to clipboard!");
  };

  const openAuthForSync = () => {
    setPendingSyncAfterAuth(true);
    setShowGuestAuth(true);
  };

  const userInitial =
    currentUser?.name?.trim().charAt(0).toUpperCase() || "D";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg border-zinc-200/90 bg-zinc-100/80 px-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-white 2xl:px-2.5 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                />
              }
            >
              <FolderKanban className="size-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden 2xl:inline">
                {currentUser ? "Saved" : "Layouts"}
              </span>
              {badgeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-zinc-200/90 px-1.5 py-0 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {badgeCount}
                </Badge>
              )}
            </SheetTrigger>
          }
        />
        <TooltipContent>
          {currentUser
            ? `Saved Cloud Layouts (${badgeCount})`
            : `Saved Guest Layouts & Account (${badgeCount})`}
        </TooltipContent>
      </Tooltip>

      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-zinc-200 bg-white p-0 text-zinc-900 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <SheetHeader className="border-b border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/90 dark:bg-zinc-900/50">
          <SheetTitle className="flex items-center gap-2 pr-8 text-base font-bold text-zinc-900 dark:text-zinc-100">
            <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <FolderKanban className="size-4" />
            </span>
            {currentUser ? "Cloud Saved Layouts" : "Studio Layouts & Account"}
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Load your multi-stream walls from Neon PostgreSQL or manage local
            Guest browser layouts.
          </SheetDescription>

          {/* Polished Identity Card */}
          {currentUser ? (
            <div className="mt-2.5 flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/25 bg-white p-2.5 shadow-2xs dark:border-emerald-500/20 dark:bg-zinc-950/90">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {currentUser.name}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                      <Cloud className="size-2.5" />
                      Cloud Active
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleSignOut}
                disabled={isPending || isSyncingGuest}
                className="shrink-0 gap-1 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-300"
              >
                <LogOut className="size-3" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="mt-2.5 flex items-center justify-between gap-2.5 rounded-2xl border border-sky-500/25 bg-white p-2.5 shadow-2xs dark:border-sky-500/20 dark:bg-zinc-950/90">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <User className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {resolvedGuestName}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:text-sky-300">
                      <HardDrive className="size-2.5" />
                      Local Guest Pass
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {resolvedGuestLayouts.length > 0
                      ? `${resolvedGuestLayouts.length} local layout${resolvedGuestLayouts.length === 1 ? "" : "s"} in browser`
                      : "Browser storage • Sign in for cloud DB"}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant={showGuestAuth ? "secondary" : "default"}
                size="xs"
                onClick={() => {
                  setPendingSyncAfterAuth(false);
                  setShowGuestAuth((prev) => !prev);
                }}
                className={cn(
                  "shrink-0 gap-1 rounded-lg text-xs font-semibold",
                  !showGuestAuth &&
                    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                )}
              >
                <LogIn className="size-3" />
                {showGuestAuth ? "Back" : "Sign In / Up"}
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {/* 1-Click Sync Banner when Signed In + Local Guest Layouts Exist */}
          {currentUser && resolvedGuestLayouts.length > 0 && (
            <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs dark:border-sky-500/25 dark:bg-sky-950/30">
              <div className="flex min-w-0 items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {resolvedGuestLayouts.length} Local Guest Layout
                    {resolvedGuestLayouts.length === 1 ? "" : "s"} Found
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                    Import your browser drafts directly into Neon PostgreSQL.
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                disabled={isSyncingGuest}
                onClick={() => syncGuestLayoutsToCloud(resolvedGuestLayouts)}
                className="shrink-0 gap-1 rounded-lg bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500"
              >
                {isSyncingGuest ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CloudUpload className="size-3" />
                    Sync to Cloud
                  </>
                )}
              </Button>
            </div>
          )}

          {!currentUser && showGuestAuth ? (
            <div className="space-y-3">
              {pendingSyncAfterAuth && resolvedGuestLayouts.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CloudUpload className="size-3.5 shrink-0" />
                  <span>
                    Sign in or create an account to automatically sync your{" "}
                    <strong>{resolvedGuestLayouts.length}</strong> local guest
                    layout{resolvedGuestLayouts.length === 1 ? "" : "s"} to the
                    cloud.
                  </span>
                </div>
              )}

              <StudioAuthForm
                githubAuthEnabled={githubAuthEnabled}
                onAuthenticated={handleAuthenticated}
                onContinueAsGuest={() => {
                  setPendingSyncAfterAuth(false);
                  setShowGuestAuth(false);
                }}
                guestActionLabel="Continue with Guest Pass"
              />
            </div>
          ) : (currentUser ? layouts : resolvedGuestLayouts).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
              <FolderKanban className="size-8 text-zinc-400 dark:text-zinc-600" />
              <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {currentUser
                  ? "No Cloud Saved Layouts Yet"
                  : "No Local Guest Layouts Yet"}
              </p>
              <p className="mt-1 max-w-xs text-xs text-zinc-500">
                {currentUser ? (
                  <>
                    Add streams to your theater grid and click{" "}
                    <strong className="text-zinc-700 dark:text-zinc-300">
                      Save Layout
                    </strong>{" "}
                    in the top bar to store your setup in Neon PostgreSQL.
                  </>
                ) : (
                  <>
                    Save layouts locally in this browser with your Guest Pass,
                    or sign in to store layouts in the cloud database and share{" "}
                    <code className="font-mono">/watch</code> links.
                  </>
                )}
              </p>
              {!currentUser && (
                <Button
                  type="button"
                  size="xs"
                  onClick={() => {
                    setPendingSyncAfterAuth(false);
                    setShowGuestAuth(true);
                  }}
                  className="mt-4 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500"
                >
                  <LogIn className="size-3" />
                  Sign In, Sign Up, or Edit Guest Pass
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!currentUser && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
                  <span className="inline-flex items-center gap-1.5">
                    <HardDrive className="size-3.5 shrink-0" />
                    Stored locally in this browser.
                  </span>
                  <button
                    type="button"
                    onClick={openAuthForSync}
                    className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 transition hover:opacity-80 dark:text-emerald-300"
                  >
                    <span>Sync to Cloud</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
              {(currentUser ? layouts : resolvedGuestLayouts).map((layout) => {
                const isCloud = currentUser !== null && "isPublic" in layout;
                return (
                  <div
                    key={layout.id}
                    className="group rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-3.5 shadow-2xs transition-all hover:border-emerald-500/40 hover:bg-white hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {layout.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-white px-1.5 py-0 font-mono text-[10px] text-zinc-800 shadow-2xs dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            <GridPresetIcon
                              preset={layout.gridPreset}
                              className="size-3 text-emerald-600 dark:text-emerald-400"
                            />
                            {layout.gridPreset}
                          </Badge>
                          <span>•</span>
                          <span>
                            {layout.streams.length} stream
                            {layout.streams.length !== 1 ? "s" : ""}
                          </span>
                          <span>•</span>
                          {isCloud ? (
                            <button
                              type="button"
                              onClick={() => handleToggleShare(layout)}
                              className="inline-flex items-center gap-1 text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                              title="Click to toggle public/private visibility"
                            >
                              {layout.isPublic ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <Globe className="size-3" />
                                  Public
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-zinc-500">
                                  <Lock className="size-3" />
                                  Private
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                              <HardDrive className="size-3" />
                              Local Guest
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={isPending || isSyncingGuest}
                        onClick={() =>
                          isCloud
                            ? handleDeleteLayout(layout.id, layout.title)
                            : handleDeleteGuestLayout(layout.id, layout.title)
                        }
                        className="text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                        title="Delete saved layout"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* Stream badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {layout.streams.slice(0, 4).map((s, idx) => (
                        <span
                          key={`${layout.id}-${s.videoId}-${idx}`}
                          className="inline-flex max-w-[170px] truncate rounded-md border border-zinc-200/80 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                        >
                          {s.label}
                        </span>
                      ))}
                      {layout.streams.length > 4 && (
                        <span className="rounded-md bg-zinc-200/80 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          +{layout.streams.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1.5 pt-1">
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => handleLoadLayout(layout)}
                        className="flex-1 gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500"
                      >
                        <Play className="size-3 fill-current" />
                        Load into Grid
                      </Button>

                      {isCloud ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => handleCopyLink(layout)}
                            className="gap-1 rounded-lg border-zinc-200 bg-white text-xs text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                            title="Copy public share link"
                          >
                            <Share2 className="size-3" />
                            Share
                          </Button>

                          <Link
                            href={`/watch/${layout.id}`}
                            onClick={() => setOpen(false)}
                            className="inline-flex h-6 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                            title="Open shared layout URL"
                          >
                            <ExternalLink className="size-3" />
                          </Link>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={openAuthForSync}
                          className="gap-1 rounded-lg border-zinc-200 bg-white text-xs text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-emerald-300"
                          title="Sign in or create an account to save to cloud and share"
                        >
                          <CloudUpload className="size-3" />
                          Sync to Cloud
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
