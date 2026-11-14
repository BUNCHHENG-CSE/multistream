export type StreamPlatform = "youtube" | "twitch" | "kick";

export type YouTubePlayerCommand =
  | "mute"
  | "unMute"
  | "playVideo"
  | "pauseVideo"
  | "stopVideo"
  | "setVolume"
  | "setPlaybackQuality"
  | "setPlaybackQualityRange"
  | "setPlaybackRate"
  | "seekTo";

export type YouTubeQualityLevel =
  | "auto"
  | "hd1080"
  | "hd720"
  | "large"
  | "medium"
  | "small"
  | "tiny";

export const YOUTUBE_QUALITY_OPTIONS: Array<{
  value: YouTubeQualityLevel;
  label: string;
  badge: string;
}> = [
  { value: "auto", label: "Auto", badge: "Auto" },
  { value: "hd1080", label: "1080p60 HD", badge: "1080p60" },
  { value: "hd720", label: "720p60 HD", badge: "720p60" },
  { value: "large", label: "480p", badge: "480p" },
  { value: "medium", label: "360p (Half)", badge: "360p" },
  { value: "small", label: "240p (Eco)", badge: "240p" },
  { value: "tiny", label: "144p (Low)", badge: "144p" },
];

export const YOUTUBE_PLAYBACK_SPEEDS: Array<{
  value: number;
  label: string;
}> = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x (Half)" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "Normal" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" },
];

export function formatYouTubeQualityLabel(quality?: string | null): string {
  switch (quality) {
    case "highres":
    case "hd2160":
      return "4K";
    case "hd1440":
      return "1440p60";
    case "hd1080":
      return "1080p60";
    case "hd720":
      return "720p60";
    case "large":
      return "480p";
    case "medium":
      return "360p";
    case "small":
      return "240p";
    case "tiny":
      return "144p";
    default:
      return "720p60";
  }
}

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const MULTI_PLATFORM_ID_REGEX = /^(tw|kk):[a-zA-Z0-9_-]{2,50}$/;
const CHANNEL_HANDLE_REGEX = /^[a-zA-Z0-9_-]{2,50}$/;

const YOUTUBE_URL_PATTERNS: RegExp[] = [
  // Standard watch URLs: youtube.com/watch?v=VIDEO_ID (handles v= anywhere in query string)
  /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:&|$|#)/i,
  // Live URLs: youtube.com/live/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})(?:\?|\/|$|#)/i,
  // Shortened URLs: youtu.be/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|\/|$|#)/i,
  // Embed URLs: youtube.com/embed/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|\/|$|#)/i,
  // Shorts URLs: youtube.com/shorts/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|\/|$|#)/i,
  // Legacy /v/ URLs: youtube.com/v/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?|\/|$|#)/i,
];

export interface CuratedLiveStream {
  videoId: string;
  label: string;
  category: string;
  handle: string;
  platform: StreamPlatform;
}

export interface CuratedWallPack {
  id: string;
  title: string;
  subtitle: string;
  preset: "1x1" | "1x2" | "2x2" | "1+3" | "3x3";
  badge: string;
  streams: Array<{ videoId: string; label: string }>;
}

/**
 * Curated 24/7 YouTube & Twitch live streams for quick one-click testing in the UI.
 */
export const CURATED_LIVE_STREAMS: CuratedLiveStream[] = [
  {
    videoId: "jfKfPfyJRdk",
    label: "Lofi Girl — beats to relax/study to",
    category: "Music",
    handle: "@lofigirl",
    platform: "youtube",
  },
  {
    videoId: "4xDzrJKXOOY",
    label: "Synthwave Radio — chill/retro beats",
    category: "Music",
    handle: "@synthwave",
    platform: "youtube",
  },
  {
    videoId: "21X5lGlDOfg",
    label: "NASA Live — Official Stream",
    category: "Space",
    handle: "@nasa",
    platform: "youtube",
  },
  {
    videoId: "DjdUEyjx8GM",
    label: "Kabukicho Shinjuku Tokyo Live Cam",
    category: "World Cam",
    handle: "@tokyo",
    platform: "youtube",
  },
  {
    videoId: "xRPjKQtRXR8",
    label: "ISS HD Earth Viewing Experiment",
    category: "Space",
    handle: "@iss",
    platform: "youtube",
  },
  {
    videoId: "9Auq9mYxFEE",
    label: "Sky News — Live International Broadcast",
    category: "News",
    handle: "@skynews",
    platform: "youtube",
  },
  {
    videoId: "tw:monstercat",
    label: "Monstercat — 24/7 Electronic Music (Twitch)",
    category: "Twitch",
    handle: "@monstercat",
    platform: "twitch",
  },
  {
    videoId: "tw:nasa",
    label: "NASA Official Twitch Broadcast",
    category: "Twitch",
    handle: "@nasatwitch",
    platform: "twitch",
  },
];

export const CURATED_WALL_PACKS: CuratedWallPack[] = [
  {
    id: "lofi-chill",
    title: "Lo-Fi & Chill Studio",
    subtitle: "Ambient study beats + Tokyo skyline cam",
    preset: "1+3",
    badge: "Music & Ambience",
    streams: [
      { videoId: "jfKfPfyJRdk", label: "Lofi Girl — beats to relax/study to" },
      { videoId: "4xDzrJKXOOY", label: "Synthwave Radio — chill/retro beats" },
      { videoId: "DjdUEyjx8GM", label: "Kabukicho Shinjuku Tokyo Live Cam" },
      { videoId: "tw:monstercat", label: "Monstercat — 24/7 Electronic Music (Twitch)" },
    ],
  },
  {
    id: "space-command",
    title: "Space & Earth Command",
    subtitle: "NASA TV, ISS orbital feed & Twitch mission stream",
    preset: "2x2",
    badge: "Aerospace",
    streams: [
      { videoId: "21X5lGlDOfg", label: "NASA Live — Official Stream" },
      { videoId: "xRPjKQtRXR8", label: "ISS HD Earth Viewing Experiment" },
      { videoId: "tw:nasa", label: "NASA Official Twitch Broadcast" },
      { videoId: "4xDzrJKXOOY", label: "Synthwave Radio — chill/retro beats" },
    ],
  },
  {
    id: "global-desk",
    title: "Global News & World Cams",
    subtitle: "Live international desk + orbital & street feeds",
    preset: "1+3",
    badge: "Newsroom",
    streams: [
      { videoId: "9Auq9mYxFEE", label: "Sky News — Live International Broadcast" },
      { videoId: "DjdUEyjx8GM", label: "Kabukicho Shinjuku Tokyo Live Cam" },
      { videoId: "21X5lGlDOfg", label: "NASA Live — Official Stream" },
      { videoId: "xRPjKQtRXR8", label: "ISS HD Earth Viewing Experiment" },
    ],
  },
];

export const EXPLORE_SHOWCASE_WALLS: Array<
  CuratedWallPack & { author: string; tags: string[] }
> = [
  ...CURATED_WALL_PACKS.map((p) => ({
    ...p,
    author: "TCT Studio Curators",
    tags: [p.badge, p.preset, "24/7 Live"],
  })),
  {
    id: "deep-work-quad",
    title: "Deep Work & Night Ambience",
    subtitle: "Triple beats + Tokyo night street cam for late-night coding",
    preset: "2x2",
    badge: "Productivity",
    author: "Studio Director",
    tags: ["Focus", "Music", "2x2"],
    streams: [
      { videoId: "jfKfPfyJRdk", label: "Lofi Girl — beats to relax/study to" },
      { videoId: "4xDzrJKXOOY", label: "Synthwave Radio — chill/retro beats" },
      { videoId: "DjdUEyjx8GM", label: "Kabukicho Shinjuku Tokyo Live Cam" },
      { videoId: "xRPjKQtRXR8", label: "ISS HD Earth Viewing Experiment" },
    ],
  },
  {
    id: "mission-control-6",
    title: "Mission Control 6-Feed Matrix",
    subtitle: "Full 3x3 Command Center combining Space, World Cams, News & Twitch",
    preset: "3x3",
    badge: "Command Center",
    author: "Mission Ops",
    tags: ["3x3", "Multi-Platform", "All Feeds"],
    streams: [
      { videoId: "21X5lGlDOfg", label: "NASA Live — Official Stream" },
      { videoId: "xRPjKQtRXR8", label: "ISS HD Earth Viewing Experiment" },
      { videoId: "9Auq9mYxFEE", label: "Sky News — Live International Broadcast" },
      { videoId: "DjdUEyjx8GM", label: "Kabukicho Shinjuku Tokyo Live Cam" },
      { videoId: "jfKfPfyJRdk", label: "Lofi Girl — beats to relax/study to" },
      { videoId: "tw:monstercat", label: "Monstercat — 24/7 Electronic Music (Twitch)" },
    ],
  },
  {
    id: "dual-audio-lounge",
    title: "Dual Electronic & Synth Lounge",
    subtitle: "Side-by-side Twitch Monstercat & YouTube Synthwave Radio",
    preset: "1x2",
    badge: "Music Duo",
    author: "Audio Lab",
    tags: ["1x2", "Twitch + YT", "Electronic"],
    streams: [
      { videoId: "tw:monstercat", label: "Monstercat — 24/7 Electronic Music (Twitch)" },
      { videoId: "4xDzrJKXOOY", label: "Synthwave Radio — chill/retro beats" },
    ],
  },
];

/**
 * Returns an Ambilight color palette tuned to a stream's category or platform.
 */
export function getAmbilightPalette(videoId: string): {
  primary: string;
  secondary: string;
  label: string;
} {
  const curated = CURATED_LIVE_STREAMS.find((c) => c.videoId === videoId);
  const platform = getStreamPlatform(videoId);

  if (curated) {
    switch (curated.category.toLowerCase()) {
      case "space":
        return {
          primary: "rgba(56, 189, 248, 0.24)",
          secondary: "rgba(99, 102, 241, 0.20)",
          label: "Orbital Cyan",
        };
      case "world cam":
        return {
          primary: "rgba(245, 158, 11, 0.22)",
          secondary: "rgba(244, 63, 94, 0.18)",
          label: "City Amber",
        };
      case "news":
        return {
          primary: "rgba(239, 68, 68, 0.22)",
          secondary: "rgba(59, 130, 246, 0.18)",
          label: "Broadcast Red",
        };
      case "music":
        return {
          primary: "rgba(16, 185, 129, 0.24)",
          secondary: "rgba(168, 85, 247, 0.18)",
          label: "Lo-Fi Emerald",
        };
    }
  }

  if (platform === "twitch") {
    return {
      primary: "rgba(168, 85, 247, 0.24)",
      secondary: "rgba(236, 72, 153, 0.18)",
      label: "Twitch Violet",
    };
  }
  if (platform === "kick") {
    return {
      primary: "rgba(132, 204, 22, 0.22)",
      secondary: "rgba(16, 185, 129, 0.18)",
      label: "Kick Neon",
    };
  }

  return {
    primary: "rgba(16, 185, 129, 0.2)",
    secondary: "rgba(14, 165, 233, 0.16)",
    label: "Studio Emerald",
  };
}

/**
 * Estimates downstream video bitrate in Mbps for telemetry display.
 */
export function estimateQualityMbps(quality?: string | null): number {
  switch (quality) {
    case "highres":
    case "hd2160":
      return 14.0;
    case "hd1440":
      return 8.5;
    case "hd1080":
      return 4.8;
    case "hd720":
    case "auto":
      return 2.6;
    case "large":
      return 1.2;
    case "medium":
      return 0.7;
    case "small":
      return 0.35;
    case "tiny":
      return 0.18;
    default:
      return 2.4;
  }
}

/**
 * Determines the platform from a stored stream ID.
 */
export function getStreamPlatform(videoId: string): StreamPlatform {
  if (videoId.startsWith("tw:")) return "twitch";
  if (videoId.startsWith("kk:")) return "kick";
  return "youtube";
}

/**
 * Strips any platform prefix (`tw:` / `kk:`) to return the raw channel or video ID.
 */
export function getStreamRawId(videoId: string): string {
  if (videoId.startsWith("tw:") || videoId.startsWith("kk:")) {
    return videoId.slice(3);
  }
  return videoId;
}

/**
 * UI metadata for each supported streaming platform.
 */
export function getStreamPlatformMeta(videoId: string): {
  platform: StreamPlatform;
  label: string;
  shortLabel: string;
  badgeClass: string;
} {
  const platform = getStreamPlatform(videoId);
  switch (platform) {
    case "twitch":
      return {
        platform: "twitch",
        label: "Twitch",
        shortLabel: "TW",
        badgeClass:
          "border-purple-500/40 bg-purple-500/15 text-purple-300 dark:text-purple-300",
      };
    case "kick":
      return {
        platform: "kick",
        label: "Kick",
        shortLabel: "KICK",
        badgeClass:
          "border-lime-500/40 bg-lime-500/15 text-lime-300 dark:text-lime-300",
      };
    case "youtube":
    default:
      return {
        platform: "youtube",
        label: "YouTube",
        shortLabel: "YT",
        badgeClass:
          "border-red-500/40 bg-red-500/15 text-red-300 dark:text-red-300",
      };
  }
}

/**
 * Validates whether a string is a strict 11-character YouTube Video ID
 * OR a valid multi-platform stream identifier (`tw:<channel>` or `kk:<channel>`).
 */
export function isValidYouTubeVideoId(id: string): boolean {
  const trimmed = id.trim();
  return (
    YOUTUBE_VIDEO_ID_REGEX.test(trimmed) ||
    MULTI_PLATFORM_ID_REGEX.test(trimmed)
  );
}

export const isValidStreamId = isValidYouTubeVideoId;

const HANDLE_ALIAS_MAP: Record<string, string> = {
  "@lofigirl": "jfKfPfyJRdk",
  lofigirl: "jfKfPfyJRdk",
  "@synthwave": "4xDzrJKXOOY",
  synthwave: "4xDzrJKXOOY",
  "@nasa": "21X5lGlDOfg",
  nasa: "21X5lGlDOfg",
  "@tokyo": "DjdUEyjx8GM",
  tokyo: "DjdUEyjx8GM",
  "@iss": "xRPjKQtRXR8",
  iss: "xRPjKQtRXR8",
  "@skynews": "9Auq9mYxFEE",
  skynews: "9Auq9mYxFEE",
  "@dwnews": "9Auq9mYxFEE",
  "@monstercat": "tw:monstercat",
  monstercat: "tw:monstercat",
  "@nasatwitch": "tw:nasa",
};

/**
 * Extracts and validates a stream ID from:
 * - YouTube URLs (`watch?v=`, `youtu.be/`, `live/`, `embed/`, `shorts/`, `/v/`) or 11-char ID
 * - Twitch URLs (`twitch.tv/<channel>`, `player.twitch.tv/?channel=<channel>`, `twitch:<channel>`, `tw:<channel>`)
 * - Kick URLs (`kick.com/<channel>`, `player.kick.com/<channel>`, `kick:<channel>`, `kk:<channel>`)
 * - Curated `@handle` aliases (`@nasa`, `@lofigirl`, `@monstercat`, etc.)
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 0. Check @handle / keyword aliases
  const lower = trimmed.toLowerCase();
  if (HANDLE_ALIAS_MAP[lower]) {
    return HANDLE_ALIAS_MAP[lower];
  }

  // 1. Check if raw valid ID (`jfKfPfyJRdk`, `tw:monstercat`, `kk:gmhikaru`)
  if (isValidYouTubeVideoId(trimmed)) {
    return trimmed.startsWith("tw:") || trimmed.startsWith("kk:")
      ? trimmed.toLowerCase()
      : trimmed;
  }

  // 1b. Explicit shorthand prefixes `twitch:<channel>` or `kick:<channel>`
  const shorthandMatch = trimmed.match(/^(twitch|kick):([a-zA-Z0-9_-]{2,50})$/i);
  if (shorthandMatch) {
    const prefix = shorthandMatch[1].toLowerCase() === "twitch" ? "tw" : "kk";
    return `${prefix}:${shorthandMatch[2].toLowerCase()}`;
  }

  // 2. Match against known YouTube URL patterns
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1] && YOUTUBE_VIDEO_ID_REGEX.test(match[1])) {
      return match[1];
    }
  }

  // 3. Fallback URL parser for YouTube, Twitch, and Kick URLs
  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "").toLowerCase();

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const vParam = url.searchParams.get("v");
      if (vParam && YOUTUBE_VIDEO_ID_REGEX.test(vParam)) {
        return vParam;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      if (
        segments.length >= 2 &&
        ["live", "embed", "shorts", "v"].includes(segments[0]) &&
        YOUTUBE_VIDEO_ID_REGEX.test(segments[1])
      ) {
        return segments[1];
      }

      if (segments.length === 1 && segments[0].startsWith("@")) {
        const mapped = HANDLE_ALIAS_MAP[segments[0].toLowerCase()];
        if (mapped) return mapped;
      }
    }

    if (host === "youtu.be") {
      const idSegment = url.pathname.split("/").filter(Boolean)[0];
      if (idSegment && YOUTUBE_VIDEO_ID_REGEX.test(idSegment)) {
        return idSegment;
      }
    }

    if (host === "twitch.tv" || host === "player.twitch.tv") {
      const channelParam = url.searchParams.get("channel");
      if (channelParam && CHANNEL_HANDLE_REGEX.test(channelParam)) {
        return `tw:${channelParam.toLowerCase()}`;
      }
      const segments = url.pathname.split("/").filter(Boolean);
      const candidate = segments[0];
      if (
        candidate &&
        !["videos", "directory", "downloads", "jobs"].includes(
          candidate.toLowerCase()
        ) &&
        CHANNEL_HANDLE_REGEX.test(candidate)
      ) {
        return `tw:${candidate.toLowerCase()}`;
      }
    }

    if (host === "kick.com" || host === "player.kick.com") {
      const segments = url.pathname.split("/").filter(Boolean);
      const candidate = segments[0];
      if (
        candidate &&
        !["categories", "browse", "video"].includes(candidate.toLowerCase()) &&
        CHANNEL_HANDLE_REGEX.test(candidate)
      ) {
        return `kk:${candidate.toLowerCase()}`;
      }
    }
  } catch {
    // Ignore invalid URL parse errors
  }

  return null;
}

/**
 * Builds the player embed URL for YouTube, Twitch, or Kick.
 * YouTube always starts with `enablejsapi=1&autoplay=1&mute=1` so browsers permit
 * autoplay and allow subsequent instant mute/unMute postMessage commands.
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    mute?: boolean;
    origin?: string;
    domain?: string;
  }
): string {
  const autoplay = options?.autoplay ?? true;
  const mute = options?.mute ?? true;
  const platform = getStreamPlatform(videoId);
  const rawId = getStreamRawId(videoId);
  const cleanDomain = (options?.domain || "localhost").replace(/:\d+$/, "");

  if (platform === "twitch") {
    const params = new URLSearchParams({
      channel: rawId,
      parent: cleanDomain,
      autoplay: autoplay ? "true" : "false",
      muted: mute ? "true" : "false",
    });
    return `https://player.twitch.tv/?${params.toString()}`;
  }

  if (platform === "kick") {
    const params = new URLSearchParams({
      autoplay: autoplay ? "true" : "false",
      muted: mute ? "true" : "false",
    });
    return `https://player.kick.com/${encodeURIComponent(rawId)}?${params.toString()}`;
  }

  const params = new URLSearchParams({
    enablejsapi: "1",
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });

  if (options?.origin) {
    params.set("origin", options.origin);
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(
    rawId
  )}?${params.toString()}`;
}

/**
 * Builds the official Live Chat embed URL for YouTube, Twitch, or Kick.
 */
export function getYouTubeLiveChatUrl(
  videoId: string,
  domain: string,
  isDark: boolean = true
): string {
  const cleanDomain = (domain || "localhost").replace(/:\d+$/, "");
  const platform = getStreamPlatform(videoId);
  const rawId = getStreamRawId(videoId);

  if (platform === "twitch") {
    return `https://www.twitch.tv/embed/${encodeURIComponent(rawId)}/chat?parent=${encodeURIComponent(cleanDomain)}${
      isDark ? "&darkpopout" : ""
    }`;
  }

  if (platform === "kick") {
    return `https://kick.com/${encodeURIComponent(rawId)}/chatroom`;
  }

  const params = new URLSearchParams({
    v: rawId,
    embed_domain: cleanDomain,
    dark_theme: isDark ? "1" : "0",
  });
  return `https://www.youtube.com/live_chat?${params.toString()}`;
}

/**
 * Returns the external watch page URL for a stream on its native platform.
 */
export function getStreamExternalUrl(videoId: string): string {
  const platform = getStreamPlatform(videoId);
  const rawId = getStreamRawId(videoId);

  if (platform === "twitch") {
    return `https://www.twitch.tv/${encodeURIComponent(rawId)}`;
  }
  if (platform === "kick") {
    return `https://kick.com/${encodeURIComponent(rawId)}`;
  }
  return `https://www.youtube.com/watch?v=${encodeURIComponent(rawId)}`;
}

/**
 * Registers the iframe for YouTube IFrame Player API events (`onReady`, `infoDelivery`)
 * via `window.postMessage`.
 */
export function sendYouTubeListening(
  iframe: HTMLIFrameElement | null | undefined,
  widgetId: string
): void {
  if (!iframe?.contentWindow) return;

  const message = JSON.stringify({
    event: "listening",
    id: widgetId,
    channel: "widget",
  });

  iframe.contentWindow.postMessage(message, "*");
}

/**
 * Sends a YouTube IFrame Player API command via `window.postMessage`
 * so audio/playback changes take effect immediately without reloading the iframe.
 */
export function sendYouTubeCommand(
  iframe: HTMLIFrameElement | null | undefined,
  command: YouTubePlayerCommand,
  args: unknown[] = []
): void {
  if (!iframe?.contentWindow) return;

  const message = JSON.stringify({
    event: "command",
    func: command,
    args,
    channel: "widget",
  });

  iframe.contentWindow.postMessage(message, "*");
}
