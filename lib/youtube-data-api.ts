/**
 * Server-side helpers for the signed-in user's YouTube account (YouTube Data API v3).
 * Builds YouTube-web-like feeds: Subscriptions (newest first, live on top),
 * Liked videos, and a Home mix — with durations, relative dates and compact views.
 */

export const YOUTUBE_READONLY_SCOPE =
  "https://www.googleapis.com/auth/youtube.readonly";

const API_BASE = "https://www.googleapis.com/youtube/v3";

export interface FeedVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  thumbnail: string;
  views: string;
  published: string;
  duration: string;
  isLive: boolean;
  /** Scheduled live stream / premiere that hasn't started yet */
  isUpcoming?: boolean;
  /** Scheduled start time (ms since epoch) for upcoming streams */
  scheduledAt?: number;
}

/** Thrown when Google rejects the token (revoked / expired) or the scope is missing. */
export class YouTubeAuthError extends Error {
  readonly kind: "unauthorized" | "scope" | "quota";

  constructor(kind: "unauthorized" | "scope" | "quota", message: string) {
    super(message);
    this.name = "YouTubeAuthError";
    this.kind = kind;
  }
}

interface ApiErrorBody {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string }>;
    details?: Array<{ reason?: string }>;
  };
}

async function ytApi<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  token: string
): Promise<T> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }

  const res = await fetch(`${API_BASE}/${path}?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (res.ok) return (await res.json()) as T;

  let body: ApiErrorBody = {};
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // ignore non-JSON bodies
  }
  const reasons = [
    ...(body.error?.errors ?? []).map((e) => e.reason),
    ...(body.error?.details ?? []).map((d) => d.reason),
  ].filter(Boolean) as string[];

  if (res.status === 401) {
    throw new YouTubeAuthError("unauthorized", "Google token rejected");
  }
  if (res.status === 403) {
    if (reasons.some((r) => /quota|rateLimit/i.test(r))) {
      throw new YouTubeAuthError("quota", "YouTube API quota exceeded");
    }
    if (
      reasons.some((r) =>
        /insufficientPermissions|SCOPE_INSUFFICIENT|forbidden/i.test(r)
      )
    ) {
      throw new YouTubeAuthError("scope", "YouTube permission not granted");
    }
  }
  throw new Error(
    `YouTube API ${path} failed (${res.status}): ${body.error?.message ?? ""}`
  );
}

/** Runs async work over items with a concurrency cap (keeps Google happy). */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ─────────────────────────── Formatting ─────────────────────────── */

export function localeForRegion(region: string): string {
  return region.toUpperCase() === "KH" ? "km" : "en";
}

/** ISO-8601 duration (PT1H2M3S) → "1:02:03" / "4:51". */
export function formatIsoDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return "";
  const days = Number(m[1] || 0);
  const h = Number(m[2] || 0) + days * 24;
  const min = Number(m[3] || 0);
  const s = Number(m[4] || 0);
  if (h + min + s === 0) return "";
  const ss = String(s).padStart(2, "0");
  return h > 0
    ? `${h}:${String(min).padStart(2, "0")}:${ss}`
    : `${min}:${ss}`;
}

export function formatRelativeTime(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return "";
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    for (const [unit, secs] of units) {
      if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit);
    }
    return rtf.format(0, "minute");
  } catch {
    return new Date(isoDate).toLocaleDateString();
  }
}

function formatCompact(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function formatViewCount(raw: string | undefined, locale: string): string {
  const n = Number(raw);
  if (!raw || Number.isNaN(n)) return "";
  const compact = formatCompact(n, locale);
  return locale === "km" ? `ចំនួនមើល ${compact}` : `${compact} views`;
}

function formatWatching(raw: string | undefined, locale: string): string {
  const n = Number(raw);
  if (!raw || Number.isNaN(n)) return locale === "km" ? "កំពុងផ្សាយផ្ទាល់" : "Live now";
  const compact = formatCompact(n, locale);
  return locale === "km" ? `${compact} នាក់កំពុងមើល` : `${compact} watching`;
}

/* ─────────────────────────── API wrappers ─────────────────────────── */

interface Thumbs {
  maxres?: { url?: string };
  standard?: { url?: string };
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}

interface ApiVideo {
  id?: string;
  snippet?: {
    title?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    liveBroadcastContent?: "live" | "upcoming" | "none";
    thumbnails?: Thumbs;
    localized?: { title?: string };
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
  liveStreamingDetails?: {
    concurrentViewers?: string;
    scheduledStartTime?: string;
    actualStartTime?: string;
  };
}

interface SubscribedChannel {
  channelId: string;
  title: string;
  avatar: string;
}

function bestThumb(videoId: string, t?: Thumbs): string {
  return (
    t?.maxres?.url ||
    t?.high?.url ||
    t?.medium?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
}

async function fetchSubscribedChannels(
  token: string,
  maxChannels: number
): Promise<SubscribedChannel[]> {
  const channels: SubscribedChannel[] = [];
  let pageToken: string | undefined;

  do {
    const data = await ytApi<{
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          resourceId?: { channelId?: string };
          thumbnails?: Thumbs;
        };
      }>;
    }>(
      "subscriptions",
      {
        part: "snippet",
        mine: "true",
        maxResults: 50,
        // "relevance" mirrors how YouTube ranks the channels you watch most
        order: "relevance",
        pageToken,
      },
      token
    );

    for (const item of data.items ?? []) {
      const id = item.snippet?.resourceId?.channelId;
      if (!id) continue;
      channels.push({
        channelId: id,
        title: item.snippet?.title || "Channel",
        avatar:
          item.snippet?.thumbnails?.default?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          "",
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken && channels.length < maxChannels);

  return channels.slice(0, maxChannels);
}

async function fetchVideoDetails(
  token: string,
  ids: string[],
  locale: string
): Promise<Map<string, ApiVideo>> {
  const map = new Map<string, ApiVideo>();
  const batches = chunk(Array.from(new Set(ids)), 50);
  const results = await mapLimit(batches, 4, (batch) =>
    ytApi<{ items?: ApiVideo[] }>(
      "videos",
      {
        part: "snippet,contentDetails,statistics,liveStreamingDetails",
        id: batch.join(","),
        hl: locale,
        maxResults: 50,
      },
      token
    ).catch((err) => {
      if (err instanceof YouTubeAuthError) throw err;
      return { items: [] as ApiVideo[] };
    })
  );
  for (const r of results) {
    for (const v of r.items ?? []) if (v.id) map.set(v.id, v);
  }
  return map;
}

async function fetchChannelAvatars(
  token: string,
  channelIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const batches = chunk(Array.from(new Set(channelIds)), 50);
  await mapLimit(batches, 4, async (batch) => {
    try {
      const data = await ytApi<{
        items?: Array<{ id?: string; snippet?: { thumbnails?: Thumbs } }>;
      }>("channels", { part: "snippet", id: batch.join(","), maxResults: 50 }, token);
      for (const c of data.items ?? []) {
        const url = c.snippet?.thumbnails?.default?.url;
        if (c.id && url) map.set(c.id, url);
      }
    } catch (err) {
      if (err instanceof YouTubeAuthError) throw err;
    }
  });
  return map;
}

function toFeedVideo(
  v: ApiVideo,
  locale: string,
  avatar: string,
  fallbackChannel?: string
): FeedVideo | null {
  if (!v.id) return null;
  const live = v.snippet?.liveBroadcastContent;
  const isLive = live === "live";
  const isUpcoming = live === "upcoming";

  let views: string;
  let published: string;
  if (isLive) {
    views = formatWatching(v.liveStreamingDetails?.concurrentViewers, locale);
    published = "";
  } else if (isUpcoming) {
    views = locale === "km" ? "នឹងចាក់ផ្សាយ" : "Upcoming";
    published = v.liveStreamingDetails?.scheduledStartTime
      ? new Date(v.liveStreamingDetails.scheduledStartTime).toLocaleString(
          locale === "km" ? "km-KH" : "en-US",
          { dateStyle: "medium", timeStyle: "short" }
        )
      : "";
  } else {
    views = formatViewCount(v.statistics?.viewCount, locale);
    published = formatRelativeTime(v.snippet?.publishedAt, locale);
  }

  return {
    videoId: v.id,
    title: v.snippet?.localized?.title || v.snippet?.title || "Video",
    channelName: v.snippet?.channelTitle || fallbackChannel || "YouTube",
    channelAvatar: avatar,
    thumbnail: bestThumb(v.id, v.snippet?.thumbnails),
    views,
    published,
    duration: isLive || isUpcoming ? "" : formatIsoDuration(v.contentDetails?.duration),
    isLive,
    ...(isUpcoming
      ? {
          isUpcoming: true,
          scheduledAt: v.liveStreamingDetails?.scheduledStartTime
            ? new Date(v.liveStreamingDetails.scheduledStartTime).getTime()
            : undefined,
        }
      : {}),
  };
}

/* ─────────────────────────── Feeds ─────────────────────────── */

const SUBSCRIPTION_CHANNELS = 40;
const UPLOADS_PER_CHANNEL = 5;

/**
 * Like youtube.com/feed/subscriptions: latest uploads from your channels,
 * live streams pinned on top, then newest first.
 */
export async function fetchSubscriptionFeed(
  token: string,
  locale: string
): Promise<FeedVideo[]> {
  const channels = await fetchSubscribedChannels(token, SUBSCRIPTION_CHANNELS);
  if (channels.length === 0) return [];

  const avatarByChannel = new Map(channels.map((c) => [c.channelId, c.avatar]));

  // Uploads playlist = "UU" + channel id suffix (1 quota unit each)
  const perChannel = await mapLimit(channels, 8, async (c) => {
    if (!c.channelId.startsWith("UC")) return [] as string[];
    try {
      const data = await ytApi<{
        items?: Array<{ contentDetails?: { videoId?: string } }>;
      }>(
        "playlistItems",
        {
          part: "contentDetails",
          playlistId: `UU${c.channelId.slice(2)}`,
          maxResults: UPLOADS_PER_CHANNEL,
        },
        token
      );
      return (data.items ?? [])
        .map((i) => i.contentDetails?.videoId)
        .filter((id): id is string => Boolean(id));
    } catch (err) {
      if (err instanceof YouTubeAuthError && err.kind !== "scope") throw err;
      return [] as string[]; // channel with hidden/removed uploads
    }
  });

  const details = await fetchVideoDetails(token, perChannel.flat(), locale);

  const items: Array<{ video: FeedVideo; ts: number; rank: number }> = [];
  for (const v of details.values()) {
    const avatar = avatarByChannel.get(v.snippet?.channelId || "") || "";
    const fv = toFeedVideo(v, locale, avatar);
    if (!fv) continue;
    const live = v.snippet?.liveBroadcastContent;
    const ts = new Date(
      v.liveStreamingDetails?.actualStartTime || v.snippet?.publishedAt || 0
    ).getTime();
    items.push({ video: fv, ts, rank: live === "live" ? 0 : live === "upcoming" ? 2 : 1 });
  }

  items.sort((a, b) => a.rank - b.rank || b.ts - a.ts);
  return items.map((i) => i.video);
}

/** Like youtube.com/playlist?list=LL — paged with the API's pageToken. */
export async function fetchLikedVideos(
  token: string,
  locale: string,
  pageToken?: string
): Promise<{ videos: FeedVideo[]; nextPageToken: string | null }> {
  const data = await ytApi<{ nextPageToken?: string; items?: ApiVideo[] }>(
    "videos",
    {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      myRating: "like",
      maxResults: 30,
      hl: locale,
      pageToken,
    },
    token
  );

  const items = data.items ?? [];
  const avatars = await fetchChannelAvatars(
    token,
    items.map((v) => v.snippet?.channelId).filter((id): id is string => Boolean(id))
  );

  const videos = items
    .map((v) => toFeedVideo(v, locale, avatars.get(v.snippet?.channelId || "") || ""))
    .filter((v): v is FeedVideo => Boolean(v));

  return { videos, nextPageToken: data.nextPageToken ?? null };
}

/**
 * Home mix: live-now from subscriptions first, then fresh subscription uploads
 * interleaved with recommendations (2 subs : 1 recommendation), like YouTube's Home.
 */
export function mixHomeFeed(
  subscriptionVideos: FeedVideo[],
  recommendations: FeedVideo[]
): FeedVideo[] {
  const seen = new Set<string>();
  const out: FeedVideo[] = [];
  const push = (v: FeedVideo | undefined) => {
    if (v && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      out.push(v);
    }
  };

  const live = subscriptionVideos.filter((v) => v.isLive);
  const recent = subscriptionVideos.filter((v) => !v.isLive);
  live.forEach(push);

  let si = 0;
  let ri = 0;
  while (si < recent.length || ri < recommendations.length) {
    push(recent[si++]);
    push(recent[si++]);
    push(recommendations[ri++]);
  }
  return out;
}

/* ─────────────────────────── Tiny per-user cache ─────────────────────────── */

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; value: unknown }>();

export async function cached<T>(
  key: string,
  fresh: boolean,
  load: () => Promise<T>
): Promise<T> {
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.value as T;
  }
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return value;
}

export function invalidateUserCache(userId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) cache.delete(key);
  }
}
