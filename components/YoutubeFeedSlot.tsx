"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Search,
  Loader2,
  RefreshCw,
  Radio,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Sparkles,
  LogOut,
  User,
  Tv,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useStreamStore } from "@/store/useStreamStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface VideoResult {
  videoId: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  thumbnail: string;
  views: string;
  published: string;
  duration: string;
  isLive: boolean;
}

interface AuthStatus {
  isLoggedIn: boolean;
  hasGoogleAuth: boolean;
  hasYouTubeScope: boolean;
  isGoogleConfigured: boolean;
  user?: {
    name: string;
    email: string;
    image?: string | null;
  };
}

interface YoutubeFeedSlotProps {
  slotIndex: number;
  className?: string;
  onSelectVideo?: (videoId: string, title: string) => void;
  onClose?: () => void;
}

const DEFAULT_CATEGORIES = [
  "All",
  "Live",
  "Gaming",
  "Music",
  "Esports",
  "Valorant",
  "Mobile Legends",
  "Podcasts",
  "Mixes",
  "News",
  "Lo-Fi",
  "AI",
  "Computer programming",
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function YoutubeFeedSlot({
  slotIndex,
  className,
  onSelectVideo,
  onClose,
}: YoutubeFeedSlotProps) {
  const addStream = useStreamStore((s) => s.addStream);
  const streams = useStreamStore((s) => s.streams);

  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [currentQuery, setCurrentQuery] = useState("All");
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isLoggedIn: false,
    hasGoogleAuth: false,
    hasYouTubeScope: false,
    isGoogleConfigured: false,
  });

  const chipsContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeIds = new Set(streams.map((s) => s.videoId));

  // Fetch videos from route
  const fetchVideos = useCallback(
    async (
      query: string,
      isInitial = true,
      forcePersonal?: boolean
    ) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isInitial) {
        setIsLoading(true);
        setVideos([]);
        setNextToken(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const queryParam = query === "All" ? "All" : query;
        const personalizedParam =
          forcePersonal || query.toLowerCase() === "for you"
            ? "&personalized=true"
            : "";

        const res = await fetch(
          `/api/youtube-feed?q=${encodeURIComponent(
            queryParam
          )}${personalizedParam}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as {
          videos: VideoResult[];
          nextToken: string | null;
          isPersonalized?: boolean;
          authStatus?: AuthStatus;
        };

        setVideos(data.videos || []);
        setNextToken(data.nextToken || null);
        setIsPersonalized(Boolean(data.isPersonalized));

        if (data.authStatus) {
          setAuthStatus(data.authStatus);
          // If user has personal YouTube scope and just loaded "All", switch to "★ For You"
          if (data.authStatus.hasYouTubeScope && isInitial && query === "All" && data.isPersonalized) {
            setActiveCategory("★ For You");
          }
        }

        if (isInitial && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to load YouTube feed:", err);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Pagination for infinite scrolling
  const loadMoreVideos = useCallback(async () => {
    if (!nextToken || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/youtube-feed?continuation=${encodeURIComponent(nextToken)}`
      );
      if (!res.ok) throw new Error("Continuation failed");

      const data = (await res.json()) as {
        videos: VideoResult[];
        nextToken: string | null;
      };

      if (data.videos && data.videos.length > 0) {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.videoId));
          const newUnique = data.videos.filter(
            (v) => !existingIds.has(v.videoId)
          );
          return [...prev, ...newUnique];
        });
      }
      setNextToken(data.nextToken || null);
    } catch (err) {
      console.error("Failed to paginate YouTube feed:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextToken, isLoadingMore, isLoading]);

  // Initial load
  useEffect(() => {
    fetchVideos("All");
  }, [fetchVideos]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          nextToken &&
          !isLoadingMore &&
          !isLoading
        ) {
          loadMoreVideos();
        }
      },
      { root: scrollContainerRef.current, rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextToken, isLoadingMore, isLoading, loadMoreVideos]);

  // Google OAuth Sign-in Handler (Prompt user with YouTube permissions)
  const handleGoogleSignIn = async () => {
    if (!authStatus.isGoogleConfigured) {
      toast.info("Google OAuth Setup Needed", {
        description:
          "To link your personal YouTube account, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file with YouTube scope enabled in Google Cloud Console.",
        duration: 6000,
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });

      if (res?.data?.url) {
        window.location.href = res.data.url;
        return;
      }

      if (res?.error) {
        toast.error(res.error.message || "Failed to start Google authentication");
        setIsSigningIn(false);
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error("Could not start Google sign-in. Please try again.");
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.info("Signed out from Google");
      setAuthStatus({
        isLoggedIn: false,
        hasGoogleAuth: false,
        hasYouTubeScope: false,
        isGoogleConfigured: authStatus.isGoogleConfigured,
      });
      setActiveCategory("All");
      fetchVideos("All");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentQuery(category);
    setSearchInput(
      category === "All" || category === "★ For You" ? "" : category
    );

    if (category === "★ For You") {
      fetchVideos("For You", true, true);
    } else {
      fetchVideos(category);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setActiveCategory("");
    setCurrentQuery(trimmed);
    fetchVideos(trimmed);
  };

  const handleVideoClick = (video: VideoResult) => {
    if (onSelectVideo) {
      onSelectVideo(video.videoId, video.title);
      return;
    }

    if (activeIds.has(video.videoId)) {
      toast.info(`"${video.title}" is already playing in the grid`);
      return;
    }

    const res = addStream(video.videoId, video.title);
    if (res.success) {
      toast.success(`Playing "${video.title}" in Slot 0${slotIndex + 1}`);
    } else {
      toast.error(res.error || "Could not load video");
    }
  };

  const scrollChips = (dir: "left" | "right") => {
    if (chipsContainerRef.current) {
      const offset = dir === "left" ? -220 : 220;
      chipsContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Categories list changes based on Google login status
  const categoriesList = authStatus.hasYouTubeScope
    ? ["★ For You", ...DEFAULT_CATEGORIES]
    : DEFAULT_CATEGORIES;

  return (
    <div
      className={cn(
        "group/yt-feed relative flex h-full w-full flex-col overflow-hidden bg-[#0f0f0f] text-zinc-100",
        className
      )}
    >
      {/* ── YouTube App Bar ── */}
      <div className="flex shrink-0 items-center justify-between gap-2.5 border-b border-zinc-800/80 bg-[#0f0f0f]/95 px-3 py-2.5 backdrop-blur-md">
        {/* Left: YouTube Brand & Slot Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white select-none">
            <span className="flex size-6 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
              <Play className="size-3 fill-current ml-0.5" />
            </span>
            <span className="hidden font-sans text-sm font-bold sm:inline tracking-tighter">
              YouTube
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-400">
            <Radio className="size-2 text-emerald-500 animate-pulse" />
            <span>0{slotIndex + 1}</span>
          </div>
        </div>

        {/* Center: YouTube Search Pill Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 max-w-sm sm:max-w-md items-center"
        >
          <div className="relative flex flex-1 items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search YouTube..."
              className="h-8 w-full rounded-l-full border border-zinc-700/80 bg-zinc-900/90 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            title="Search"
            className="flex h-8 items-center justify-center rounded-r-full border border-l-0 border-zinc-700/80 bg-zinc-800 px-3.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          >
            <Search className="size-3.5" />
          </button>
        </form>

        {/* Right Actions: Google Sign-in / User Profile + Refresh */}
        <div className="flex items-center gap-1.5">
          {/* Optional Google Login / Profile Avatar */}
          {authStatus.isLoggedIn && authStatus.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    title={`Connected as ${authStatus.user.name}`}
                    className="flex size-7 items-center justify-center rounded-full ring-2 ring-emerald-500/70 overflow-hidden bg-zinc-800 transition hover:ring-emerald-400"
                  />
                }
              >
                {authStatus.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authStatus.user.image}
                    alt={authStatus.user.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-4 text-emerald-400" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-100 shadow-xl"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <div className="font-semibold text-xs truncate">
                      {authStatus.user.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {authStatus.user.email}
                    </div>
                    {authStatus.hasYouTubeScope ? (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3" />
                        <span>YouTube Subscriptions Synced</span>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                        <AlertTriangle className="size-3" />
                        <span>YouTube Scope Missing</span>
                      </div>
                    )}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1 bg-zinc-800" />
                <DropdownMenuGroup>
                  {authStatus.hasYouTubeScope ? (
                    <DropdownMenuItem
                      onClick={() => handleSelectCategory("★ For You")}
                      className="cursor-pointer gap-2 rounded-lg text-xs"
                    >
                      <Sparkles className="size-3.5 text-amber-400" />
                      <span>My YouTube Feed</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={handleGoogleSignIn}
                      className="cursor-pointer gap-2 rounded-lg text-xs text-amber-300 focus:bg-amber-500/15"
                    >
                      <RefreshCw className="size-3.5 text-amber-400" />
                      <span>Sync YouTube Subscriptions</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer gap-2 rounded-lg text-xs text-red-400 focus:bg-red-500/15 focus:text-red-300"
                  >
                    <LogOut className="size-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Optional Google Sign-in button */
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              title="Sign in with Google to view your own YouTube subscriptions"
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700/80 hover:text-white transition shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isSigningIn ? (
                <Loader2 className="size-3 animate-spin text-zinc-300" />
              ) : (
                <GoogleIcon className="size-3" />
              )}
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchVideos(currentQuery)}
            disabled={isLoading}
            title="Refresh feed"
            className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-3.5", isLoading && "animate-spin")}
            />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Return to Player"
              className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Chips Bar (Scrollable horizontally) ── */}
      <div className="relative flex shrink-0 items-center border-b border-zinc-800/80 bg-[#0f0f0f] px-2 py-2">
        <button
          type="button"
          onClick={() => scrollChips("left")}
          className="hidden size-6 shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 sm:flex"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <div
          ref={chipsContainerRef}
          className="flex flex-1 items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categoriesList.map((category) => {
            const isActive = activeCategory === category;
            const isForYou = category === "★ For You";
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleSelectCategory(category)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 select-none",
                  isActive
                    ? isForYou
                      ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xs font-semibold"
                      : "bg-white text-zinc-950 shadow-xs"
                    : isForYou
                      ? "border border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50"
                      : "bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700/90 hover:text-white"
                )}
              >
                {category === "Live" ? (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                ) : category === "Trending" || category === "All" ? (
                  <span className="flex items-center gap-1">
                    {category === "All" ? null : (
                      <Flame className="size-3 text-amber-500" />
                    )}
                    {category}
                  </span>
                ) : isForYou ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-300" />
                    For You
                  </span>
                ) : (
                  category
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollChips("right")}
          className="hidden size-6 shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 sm:flex"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* ── Banner: Signed in but missing YouTube permissions ── */}
      {authStatus.isLoggedIn &&
        !authStatus.hasYouTubeScope &&
        !dismissBanner && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-amber-900/60 bg-amber-950/30 px-3 py-1.5 text-[11px] text-amber-200">
            <div className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
              <span className="truncate">
                Signed in with Google, but YouTube account access was not
                granted yet.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/30 transition cursor-pointer disabled:opacity-50"
              >
                {isSigningIn && (
                  <Loader2 className="size-3 animate-spin text-amber-300" />
                )}
                <span>Sync YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

      {/* ── Optional Google Sign-In Banner for Guest / Not Logged In ── */}
      {!authStatus.isLoggedIn && !dismissBanner && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <GoogleIcon className="size-3 shrink-0" />
            <span className="truncate">
              Optional: Sign in with Google to sync your YouTube subscriptions & recommendations.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="font-semibold text-sky-400 hover:text-sky-300 underline"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setDismissBanner(true)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Personalized Feed Indicator ── */}
      {isPersonalized && (
        <div className="flex shrink-0 items-center justify-between border-b border-red-500/20 bg-red-950/20 px-3 py-1 text-[10px] text-red-300 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3 text-amber-400" />
            Personalized Feed: Loaded from your YouTube Subscriptions & Liked Videos
          </span>
          <span className="text-zinc-400">
            {videos.length} videos
          </span>
        </div>
      )}

      {/* ── YouTube Video Grid (Smooth Infinite Scroll) ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.700)_transparent]"
      >
        {isLoading && videos.length === 0 ? (
          /* Initial Loading Skeletons */
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-zinc-800/80" />
                <div className="flex gap-2.5">
                  <div className="size-9 rounded-full bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 w-4/5 rounded bg-zinc-800" />
                    <div className="h-2.5 w-1/2 rounded bg-zinc-800/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          /* Empty State */
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400">
              <Search className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                No YouTube videos found
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Try searching for something else or pick a category above
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectCategory("All")}
              className="mt-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Reset to All
            </button>
          </div>
        ) : (
          /* Real YouTube Cards Grid */
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => {
              const inGrid = activeIds.has(video.videoId);
              return (
                <div
                  key={video.videoId}
                  onClick={() => handleVideoClick(video)}
                  className={cn(
                    "group/card flex flex-col cursor-pointer transition-transform duration-150 select-none",
                    inGrid ? "opacity-60" : "hover:scale-[1.01]"
                  )}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
                      }}
                    />

                    {/* Duration / LIVE Badge */}
                    <div className="absolute bottom-2 right-2 z-10">
                      {video.isLive ? (
                        <span className="flex items-center gap-1 rounded bg-red-600/95 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm">
                          <span className="size-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                      ) : video.duration ? (
                        <span className="rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm">
                          {video.duration}
                        </span>
                      ) : null}
                    </div>

                    {/* Hover Overlay with Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                      <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-lg transform translate-y-1 group-hover/card:translate-y-0 transition-transform">
                        <Play className="size-3.5 fill-current" />
                        <span>{inGrid ? "Already Playing" : "Play in Slot"}</span>
                      </div>
                    </div>

                    {inGrid && (
                      <div className="absolute top-2 left-2 z-10 rounded-md bg-emerald-600/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white uppercase shadow-xs">
                        In Grid
                      </div>
                    )}
                  </div>

                  {/* Metadata Row: Avatar + Details + Menu */}
                  <div className="mt-2.5 flex items-start gap-2.5">
                    {/* Channel Avatar */}
                    <div className="size-9 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-800">
                      {video.channelAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.channelAvatar}
                          alt={video.channelName}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-zinc-400 text-xs">
                          {video.channelName.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Details: Title, Channel, Views, Time */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-100 group-hover/card:text-white transition-colors"
                        title={video.title}
                      >
                        {video.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400 group-hover/card:text-zinc-300">
                        <span className="truncate">{video.channelName}</span>
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-zinc-400">
                        {video.isLive ? (
                          <span className="font-semibold text-red-400">
                            {video.views || "Streaming now"}
                          </span>
                        ) : (
                          <>
                            {video.views && <span>{video.views}</span>}
                            {video.views && video.published && <span>•</span>}
                            {video.published && <span>{video.published}</span>}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(video);
                      }}
                      className="opacity-0 group-hover/card:opacity-100 p-1 text-zinc-400 hover:text-white transition"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel element for infinite scroll observer */}
        <div
          ref={sentinelRef}
          className="h-10 w-full flex items-center justify-center py-4"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="size-4 animate-spin text-red-500" />
              <span>Loading more videos from YouTube...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
