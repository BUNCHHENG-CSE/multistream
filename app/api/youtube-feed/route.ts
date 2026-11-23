import { NextRequest, NextResponse } from "next/server";
import { isGoogleAuthEnabled, getServerSession } from "@/auth";
import { prisma } from "@/db";
import {
  YouTubeAuthError,
  cached,
  fetchLikedVideos,
  fetchSubscriptionFeed,
  localeForRegion,
  mixHomeFeed,
  type FeedVideo,
} from "@/lib/youtube-data-api";

type VideoResult = FeedVideo;

interface VideoRendererItem {
  videoId?: string;
  title?: {
    runs?: Array<{ text: string }>;
    simpleText?: string;
  };
  ownerText?: {
    runs?: Array<{ text: string }>;
  };
  longBylineText?: {
    runs?: Array<{ text: string }>;
  };
  channelThumbnailSupportedRenderers?: {
    channelThumbnailWithLinkRenderer?: {
      thumbnail?: {
        thumbnails?: Array<{ url: string }>;
      };
    };
  };
  thumbnail?: {
    thumbnails?: Array<{ url: string }>;
  };
  viewCountText?: {
    simpleText?: string;
    runs?: Array<{ text: string }>;
  };
  publishedTimeText?: {
    simpleText?: string;
  };
  lengthText?: {
    simpleText?: string;
  };
  badges?: Array<{
    metadataBadgeRenderer?: {
      label?: string;
      style?: string;
    };
  }>;
  thumbnailOverlays?: Array<{
    thumbnailOverlayTimeStatusRenderer?: {
      style?: string;
      text?: {
        simpleText?: string;
      };
    };
  }>;
}

interface ContinuationItem {
  continuationItemRenderer?: {
    continuationEndpoint?: {
      continuationCommand?: {
        token?: string;
      };
    };
  };
  itemSectionRenderer?: {
    contents?: Array<{
      videoRenderer?: VideoRendererItem;
    }>;
  };
}

interface YouTubeSearchApiData {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents?: {
        sectionListRenderer?: {
          contents?: ContinuationItem[];
        };
      };
    };
  };
  onResponseReceivedCommands?: Array<{
    appendContinuationItemsAction?: {
      continuationItems?: ContinuationItem[];
    };
  }>;
}

function processVideoRenderer(v: VideoRendererItem): VideoResult | null {
  if (!v || !v.videoId) return null;

  const isLive = Boolean(
    v.badges?.some(
      (b) =>
        b.metadataBadgeRenderer?.style?.includes("LIVE") ||
        b.metadataBadgeRenderer?.label === "LIVE"
    ) ||
      v.thumbnailOverlays?.some(
        (o) => o.thumbnailOverlayTimeStatusRenderer?.style === "LIVE"
      )
  );

  const thumbs = v.thumbnail?.thumbnails || [];
  const bestThumb =
    thumbs[thumbs.length - 1]?.url ||
    `https://i.ytimg.com/vi/${v.videoId}/hq720.jpg`;

  const avatar =
    v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
      ?.thumbnail?.thumbnails?.[0]?.url || "";

  const title =
    v.title?.runs?.map((r) => r.text).join("") || v.title?.simpleText || "";

  const channelName =
    v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || "";

  const views =
    v.viewCountText?.simpleText ||
    v.viewCountText?.runs?.map((r) => r.text).join("") ||
    (isLive ? "LIVE" : "");

  const published = v.publishedTimeText?.simpleText || "";
  const duration =
    v.lengthText?.simpleText ||
    v.thumbnailOverlays?.find((o) => o.thumbnailOverlayTimeStatusRenderer?.text)
      ?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
    "";

  return {
    videoId: v.videoId,
    title,
    channelName,
    channelAvatar: avatar,
    thumbnail: bestThumb,
    views,
    published,
    duration,
    isLive,
  };
}

// Map user categories to optimal queries
function resolveCategoryQuery(rawQuery: string, region: string): string {
  const isKhmer = region.toUpperCase() === "KH";

  if (isKhmer) {
    switch (rawQuery) {
      case "All":
        return "MPL KH Mobile Legends Cambodia live stream";
      case "Live":
        return "Cambodia live stream";
      case "Gaming":
        return "Khmer gaming live stream MLBB";
      case "Mobile Legends":
      case "Mobile Legends: Bang Bang":
        return "MPL KH Mobile Legends Cambodia live";
      case "Finals":
      case "Esports":
        return "MPL KH Grand Finals Cambodia live";
      case "Music":
        return "Khmer music live trending";
      case "Podcasts":
        return "Khmer podcast";
      case "Ghosts":
        return "រឿងខ្មោច ghost story khmer";
      case "Hip hop":
        return "VannDa Khmer hip hop live";
      default:
        return rawQuery;
    }
  }

  // Default / Global
  switch (rawQuery) {
    case "All":
      return "live streams trending";
    case "Live":
      return "live stream";
    case "Gaming":
      return "gaming live streams";
    case "Music":
      return "music live stream";
    case "Esports":
      return "esports live tournament";
    case "Mobile Legends":
    case "Mobile Legends: Bang Bang":
      return "Mobile Legends live stream";
    case "Valorant":
      return "Valorant live stream";
    case "Lo-Fi":
      return "lo-fi hip hop radio live";
    case "News":
      return "news live stream";
    default:
      return rawQuery;
  }
}

// Execute a single youtubei search request
async function executeYoutubeiSearch(
  query: string,
  continuation: string,
  hl: string,
  gl: string
): Promise<{ videos: VideoResult[]; nextToken: string | null }> {
  const payload: {
    context: {
      client: {
        clientName: string;
        clientVersion: string;
        hl: string;
        gl: string;
      };
    };
    query?: string;
    continuation?: string;
  } = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240101.00.00",
        hl,
        gl,
      },
    },
  };

  if (continuation) {
    payload.continuation = continuation;
  } else {
    payload.query = query;
  }

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return { videos: [], nextToken: null };
  }

  const data = (await response.json()) as YouTubeSearchApiData;
  const videos: VideoResult[] = [];
  let nextToken: string | null = null;

  if (!continuation) {
    const sectionList =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents || [];

    for (const section of sectionList) {
      if (section.continuationItemRenderer) {
        nextToken =
          section.continuationItemRenderer.continuationEndpoint
            ?.continuationCommand?.token || null;
      }

      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (item.videoRenderer) {
          const parsed = processVideoRenderer(item.videoRenderer);
          if (parsed) videos.push(parsed);
        }
      }
    }
  } else {
    const continuationItems =
      data.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction
        ?.continuationItems || [];

    for (const ci of continuationItems) {
      if (ci.continuationItemRenderer) {
        nextToken =
          ci.continuationItemRenderer.continuationEndpoint
            ?.continuationCommand?.token || null;
      }

      const items = ci.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (item.videoRenderer) {
          const parsed = processVideoRenderer(item.videoRenderer);
          if (parsed) videos.push(parsed);
        }
      }
    }
  }

  return { videos, nextToken };
}

// Ensure channel diversity by capping videos per channel (max 2)
function applyChannelDiversity(
  rawVideos: VideoResult[],
  maxPerChannel: number = 2
): VideoResult[] {
  const result: VideoResult[] = [];
  const channelCount = new Map<string, number>();
  const seenIds = new Set<string>();

  for (const v of rawVideos) {
    if (seenIds.has(v.videoId)) continue;
    const count = channelCount.get(v.channelName) || 0;
    if (count >= maxPerChannel) continue;

    channelCount.set(v.channelName, count + 1);
    seenIds.add(v.videoId);
    result.push(v);
  }

  return result;
}

// Fetch public YouTube feed with multi-channel diversity
async function fetchPublicYouTubeFeed(
  query: string,
  continuation: string,
  region: string = "KH"
): Promise<{ videos: VideoResult[]; nextToken: string | null }> {
  const isKhmer = region.toUpperCase() === "KH";
  const hl = isKhmer ? "km" : "en";
  const gl = isKhmer ? "KH" : "US";

  // If continuation token exists, continue pagination
  if (continuation) {
    const res = await executeYoutubeiSearch("", continuation, hl, gl);
    return {
      videos: applyChannelDiversity(res.videos, 2),
      nextToken: res.nextToken,
    };
  }

  // If "All" is requested, fetch across diverse query seeds to provide a rich YouTube Home experience
  if (query === "All") {
    const seeds = isKhmer
      ? [
          "live stream cambodia",
          "trending khmer",
          "khmer music trending",
          "MPL KH Mobile Legends Cambodia live",
          "M.Megamind RavenBlaze cambodia gaming",
        ]
      : [
          "live streams trending",
          "popular gaming music live",
          "trending videos today",
        ];

    const results = await Promise.all(
      seeds.map((s) => executeYoutubeiSearch(s, "", hl, gl))
    );

    const interleaved: VideoResult[] = [];
    const maxLen = Math.max(...results.map((r) => r.videos.length));

    for (let i = 0; i < maxLen; i++) {
      for (const r of results) {
        if (r.videos[i]) {
          interleaved.push(r.videos[i]);
        }
      }
    }

    const diverseVideos = applyChannelDiversity(interleaved, 2);
    const nextToken = results[0]?.nextToken || null;

    return { videos: diverseVideos, nextToken };
  }

  // Specific category or custom search
  const effectiveQuery = resolveCategoryQuery(query, region);
  const res = await executeYoutubeiSearch(effectiveQuery, "", hl, gl);
  return {
    videos: applyChannelDiversity(res.videos, 2),
    nextToken: res.nextToken,
  };
}

type GoogleAccountRow = {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  scope: string | null;
};

const RECONNECT_NOTICE =
  "Your YouTube connection expired. Reconnect to sync again.";
const SCOPE_NOTICE =
  "YouTube permission wasn't granted. Reconnect and allow YouTube access.";

/**
 * Returns a usable Google access token, refreshing it when expired (or when `force`).
 * `revoked` is true when Google says the refresh token is no longer valid.
 */
async function getValidGoogleToken(
  account: GoogleAccountRow,
  force = false
): Promise<{ token: string | null; revoked: boolean }> {
  const isExpired =
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt.getTime() - Date.now() < 60_000;

  if (!force && account.accessToken && !isExpired) {
    return { token: account.accessToken, revoked: false };
  }

  const googleClientId =
    process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
  const googleClientSecret =
    process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

  if (!account.refreshToken || !googleClientId || !googleClientSecret) {
    return { token: force ? null : account.accessToken, revoked: force };
  }

  try {
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });

    const data = (await refreshRes.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
    };

    if (!refreshRes.ok || !data.access_token) {
      return { token: null, revoked: data.error === "invalid_grant" };
    }

    // Google returns space-separated scopes; Better Auth stores them comma-separated
    const nextScope = data.scope
      ? data.scope.split(" ").join(",")
      : account.scope;
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        accessTokenExpiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
        scope: nextScope ?? undefined,
      },
    });
    account.accessToken = data.access_token;
    account.scope = nextScope;
    return { token: data.access_token, revoked: false };
  } catch (err) {
    console.error("Failed to refresh Google token:", err);
    return { token: force ? null : account.accessToken, revoked: false };
  }
}

type FeedKind = "home" | "subscriptions" | "liked" | "public";
const LIKED_TOKEN_PREFIX = "liked:";

function resolveFeedKind(
  searchParams: URLSearchParams,
  query: string,
  continuation: string,
  hasYouTubeScope: boolean
): FeedKind {
  if (continuation) {
    return continuation.startsWith(LIKED_TOKEN_PREFIX) ? "liked" : "public";
  }
  const feed = searchParams.get("feed");
  if (feed === "home" || feed === "subscriptions" || feed === "liked") {
    return feed;
  }
  // Legacy params kept for older clients
  const q = query.toLowerCase();
  if (q === "subscriptions") return "subscriptions";
  if (
    searchParams.get("personalized") === "true" ||
    q === "for you" ||
    q === "my youtube"
  ) {
    return "home";
  }
  if (searchParams.get("initial") === "true" && hasYouTubeScope && q === "all") {
    return "home";
  }
  return "public";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "All";
  const continuation = searchParams.get("continuation")?.trim() || "";
  const region = searchParams.get("region")?.trim() || "KH";
  const fresh = searchParams.get("fresh") === "1";
  const locale = localeForRegion(region);

  let session = null;
  try {
    session = await getServerSession();
  } catch {
    // Session check failure → treat as guest
  }

  let googleAccount: GoogleAccountRow | null = null;
  let googleToken: string | null = null;
  let needsReconnect = false;

  if (session?.user?.id) {
    try {
      googleAccount = await prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "google" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
          accessTokenExpiresAt: true,
          scope: true,
        },
      });
      if (googleAccount) {
        const result = await getValidGoogleToken(googleAccount);
        googleToken = result.token;
        needsReconnect = result.revoked || !result.token;
      }
    } catch (err) {
      console.error("Database account lookup error:", err);
    }
  }

  // Google lets users untick individual permissions, so check the granted scope.
  // Rows without a stored scope (older sign-ins) are verified by the API call itself.
  let hasYouTubeScope = Boolean(
    googleAccount &&
      !needsReconnect &&
      (googleAccount.scope
        ? googleAccount.scope.includes("youtube")
        : Boolean(googleToken))
  );

  const feedKind = resolveFeedKind(
    searchParams,
    query,
    continuation,
    hasYouTubeScope
  );

  let notice: string | undefined;

  const handleAuthFailure = (err: unknown) => {
    if (err instanceof YouTubeAuthError) {
      if (err.kind === "quota") {
        notice = "YouTube daily API quota reached — showing public feed.";
        return;
      }
      hasYouTubeScope = false;
      if (err.kind === "scope") {
        notice = SCOPE_NOTICE;
      } else {
        needsReconnect = true;
        notice = RECONNECT_NOTICE;
      }
      return;
    }
    console.error("YouTube account feed error:", err);
    notice = "Couldn't reach your YouTube account — showing public feed.";
  };

  /** Runs a Data API call, retrying once with a force-refreshed token on 401. */
  const withToken = async <T,>(
    fn: (token: string) => Promise<T>
  ): Promise<T | null> => {
    if (!googleAccount || !googleToken) return null;
    try {
      return await fn(googleToken);
    } catch (err) {
      if (err instanceof YouTubeAuthError && err.kind === "unauthorized") {
        const retry = await getValidGoogleToken(googleAccount, true);
        if (!retry.token) {
          handleAuthFailure(err);
          return null;
        }
        googleToken = retry.token;
        try {
          return await fn(retry.token);
        } catch (retryErr) {
          handleAuthFailure(retryErr);
          return null;
        }
      }
      handleAuthFailure(err);
      return null;
    }
  };

  const respond = (body: {
    videos: VideoResult[];
    nextToken: string | null;
    feed: FeedKind;
    isPersonalized: boolean;
  }) =>
    NextResponse.json(
      {
        ...body,
        region,
        notice,
        authStatus: {
          isLoggedIn: Boolean(session?.user),
          hasGoogleAuth: Boolean(googleAccount),
          hasYouTubeScope,
          needsReconnect,
          isGoogleConfigured: isGoogleAuthEnabled,
          user: session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : undefined,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );

  const userId = session?.user?.id ?? "";

  if (feedKind !== "public" && hasYouTubeScope && googleToken) {
    if (feedKind === "liked") {
      const pageToken = continuation.startsWith(LIKED_TOKEN_PREFIX)
        ? continuation.slice(LIKED_TOKEN_PREFIX.length)
        : undefined;
      const liked = await withToken((t) =>
        cached(`${userId}:liked:${locale}:${pageToken ?? ""}`, fresh, () =>
          fetchLikedVideos(t, locale, pageToken)
        )
      );
      if (liked) {
        return respond({
          videos: liked.videos,
          nextToken: liked.nextPageToken
            ? `${LIKED_TOKEN_PREFIX}${liked.nextPageToken}`
            : null,
          feed: "liked",
          isPersonalized: true,
        });
      }
    } else {
      const [subs, publicFeed] = await Promise.all([
        withToken((t) =>
          cached(`${userId}:subs:${locale}`, fresh, () =>
            fetchSubscriptionFeed(t, locale)
          )
        ),
        feedKind === "home"
          ? fetchPublicYouTubeFeed("All", "", region).catch(() => ({
              videos: [] as VideoResult[],
              nextToken: null,
            }))
          : Promise.resolve(null),
      ]);

      if (subs && feedKind === "subscriptions") {
        return respond({
          videos: subs,
          nextToken: null,
          feed: "subscriptions",
          isPersonalized: true,
        });
      }
      if (subs && publicFeed) {
        return respond({
          videos: mixHomeFeed(subs, publicFeed.videos),
          nextToken: publicFeed.nextToken,
          feed: "home",
          isPersonalized: true,
        });
      }
      if (publicFeed && publicFeed.videos.length > 0) {
        return respond({
          videos: publicFeed.videos,
          nextToken: publicFeed.nextToken,
          feed: "public",
          isPersonalized: false,
        });
      }
    }
  } else if (feedKind !== "public" && googleAccount) {
    notice = needsReconnect ? RECONNECT_NOTICE : SCOPE_NOTICE;
  }

  // Public YouTube feed (guests, categories, search, or personal-feed fallback)
  const { videos, nextToken } = await fetchPublicYouTubeFeed(
    feedKind === "public" ? query : "All",
    feedKind === "liked" ? "" : continuation,
    region
  );

  return respond({ videos, nextToken, feed: "public", isPersonalized: false });
}

