import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth, isGoogleAuthEnabled, getServerSession } from "@/auth";
import { prisma } from "@/db";

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

interface YouTubeSearchResponse {
  videos: VideoResult[];
  nextToken: string | null;
  isPersonalized?: boolean;
  region?: string;
  authStatus: {
    isLoggedIn: boolean;
    hasGoogleAuth: boolean;
    hasYouTubeScope: boolean;
    isGoogleConfigured: boolean;
    user?: {
      name: string;
      email: string;
      image?: string | null;
    };
  };
}

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
  region: string = "GLOBAL"
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

// Refresh Google OAuth token if expired
async function getValidGoogleToken(account: {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
}): Promise<string | null> {
  const isExpired =
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt.getTime() - Date.now() < 60000;

  if (account.accessToken && !isExpired) {
    return account.accessToken;
  }

  if (!account.refreshToken) {
    return account.accessToken || null;
  }

  const googleClientId =
    process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
  const googleClientSecret =
    process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

  if (!googleClientId || !googleClientSecret) {
    return account.accessToken || null;
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
    });

    if (!refreshRes.ok) return account.accessToken || null;
    const data = (await refreshRes.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (data.access_token) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          accessToken: data.access_token,
          accessTokenExpiresAt: data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000)
            : undefined,
        },
      });
      return data.access_token;
    }
  } catch (err) {
    console.error("Failed to refresh Google token:", err);
  }

  return account.accessToken || null;
}

// Fetch personalized YouTube feed for authenticated user (Subscriptions + Liked Videos)
async function fetchUserPersonalizedFeed(
  googleToken: string
): Promise<VideoResult[]> {
  const liveVideos: VideoResult[] = [];
  const uploadVideos: VideoResult[] = [];
  const likedVideos: VideoResult[] = [];

  try {
    // 1. Fetch user's subscriptions (up to 50 channels)
    const subRes = await fetch(
      "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50",
      {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      }
    );

    if (subRes.ok) {
      const subData = (await subRes.json()) as {
        items?: Array<{
          snippet?: {
            title?: string;
            resourceId?: { channelId?: string };
            thumbnails?: { default?: { url?: string } };
          };
        }>;
      };

      const subscribedChannels = subData.items || [];
      const targetChannels = subscribedChannels.slice(0, 15);

      // Fetch latest videos from top subscribed channels in parallel
      const channelVideoPromises = targetChannels.map(async (channel) => {
        const channelId = channel.snippet?.resourceId?.channelId;
        const channelName = channel.snippet?.title || "Subscribed Channel";
        const channelAvatar = channel.snippet?.thumbnails?.default?.url || "";
        if (!channelId) return [];

        const uploadsPlaylistId = channelId.startsWith("UC")
          ? "UU" + channelId.slice(2)
          : channelId;

        try {
          const plRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
              uploadsPlaylistId
            )}&maxResults=3`,
            {
              headers: { Authorization: `Bearer ${googleToken}` },
            }
          );

          if (!plRes.ok) return [];
          const plData = (await plRes.json()) as {
            items?: Array<{
              snippet?: {
                title?: string;
                publishedAt?: string;
                resourceId?: { videoId?: string };
                thumbnails?: {
                  high?: { url?: string };
                  medium?: { url?: string };
                };
              };
            }>;
          };

          return (plData.items || [])
            .map((item) => {
              const videoId = item.snippet?.resourceId?.videoId;
              if (!videoId) return null;
              const thumb =
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

              const publishedDate = item.snippet?.publishedAt
                ? new Date(item.snippet.publishedAt).toLocaleDateString()
                : "";

              return {
                videoId,
                title: item.snippet?.title || "Video",
                channelName,
                channelAvatar,
                thumbnail: thumb,
                views: "From subscriptions",
                published: publishedDate,
                duration: "",
                isLive: false,
              } as VideoResult;
            })
            .filter((v): v is VideoResult => Boolean(v));
        } catch {
          return [];
        }
      });

      const channelResults = await Promise.all(channelVideoPromises);
      const allUploads = channelResults.flat();
      const videoIds = allUploads.map((v) => v.videoId).slice(0, 50);

      if (videoIds.length > 0) {
        try {
          const vDetailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${videoIds.join(
              ","
            )}`,
            {
              headers: { Authorization: `Bearer ${googleToken}` },
            }
          );

          if (vDetailsRes.ok) {
            const vData = (await vDetailsRes.json()) as {
              items?: Array<{
                id?: string;
                snippet?: {
                  liveBroadcastContent?: string;
                };
                liveStreamingDetails?: {
                  concurrentViewers?: string;
                };
                statistics?: {
                  viewCount?: string;
                };
              }>;
            };

            const detailsMap = new Map(
              (vData.items || []).map((it) => [it.id, it])
            );

            for (const item of allUploads) {
              const detail = detailsMap.get(item.videoId);
              if (detail) {
                const isCurrentlyLive =
                  detail.snippet?.liveBroadcastContent === "live";
                if (isCurrentlyLive) {
                  item.isLive = true;
                  const viewers =
                    detail.liveStreamingDetails?.concurrentViewers;
                  item.views = viewers
                    ? `${Number(viewers).toLocaleString()} watching`
                    : "🔴 LIVE";
                  liveVideos.push(item);
                } else {
                  const rawViews = Number(detail.statistics?.viewCount || 0);
                  if (rawViews > 1000) {
                    item.views =
                      rawViews > 1_000_000
                        ? `${(rawViews / 1_000_000).toFixed(1)}M views`
                        : `${Math.round(rawViews / 1000)}K views`;
                  }
                  uploadVideos.push(item);
                }
              } else {
                uploadVideos.push(item);
              }
            }
          } else {
            uploadVideos.push(...allUploads);
          }
        } catch {
          uploadVideos.push(...allUploads);
        }
      }
    }

    // 2. Fetch user's liked videos as part of recommended feed
    try {
      const likedRes = await fetch(
        "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&myRating=like&maxResults=10",
        {
          headers: { Authorization: `Bearer ${googleToken}` },
        }
      );

      if (likedRes.ok) {
        const likedData = (await likedRes.json()) as {
          items?: Array<{
            id?: string;
            snippet?: {
              title?: string;
              channelTitle?: string;
              publishedAt?: string;
              thumbnails?: {
                high?: { url?: string };
                medium?: { url?: string };
              };
            };
            statistics?: {
              viewCount?: string;
            };
          }>;
        };

        const likedList = (likedData.items || []).map((item) => {
          const videoId = item.id;
          if (!videoId) return null;
          const thumb =
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const rawViews = Number(item.statistics?.viewCount || 0);
          const viewsLabel =
            rawViews > 1_000_000
              ? `${(rawViews / 1_000_000).toFixed(1)}M views`
              : rawViews > 1_000
                ? `${Math.round(rawViews / 1000)}K views`
                : rawViews > 0
                  ? `${rawViews} views`
                  : "Liked video";

          return {
            videoId,
            title: item.snippet?.title || "Liked Video",
            channelName: item.snippet?.channelTitle || "YouTube",
            channelAvatar: "",
            thumbnail: thumb,
            views: `Liked • ${viewsLabel}`,
            published: item.snippet?.publishedAt
              ? new Date(item.snippet.publishedAt).toLocaleDateString()
              : "",
            duration: "",
            isLive: false,
          } as VideoResult;
        });

        likedVideos.push(
          ...likedList.filter((v): v is VideoResult => Boolean(v))
        );
      }
    } catch (err) {
      console.warn("Could not fetch liked videos:", err);
    }
  } catch (err) {
    console.error("Personalized YouTube feed error:", err);
  }

  return [...liveVideos, ...uploadVideos, ...likedVideos];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "All";
  const continuation = searchParams.get("continuation")?.trim() || "";
  const forcePersonalized = searchParams.get("personalized") === "true";
  const region = searchParams.get("region")?.trim() || "GLOBAL";

  // Check auth session
  let session = null;
  try {
    session = await getServerSession();
  } catch {
    // Session check failure
  }

  let googleToken: string | null = null;
  let googleAccount = null;

  if (session?.user?.id) {
    try {
      googleAccount = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          providerId: "google",
        },
      });

      if (googleAccount) {
        googleToken = await getValidGoogleToken(googleAccount);
      }
    } catch (err) {
      console.error("Database account lookup error:", err);
    }
  }

  const hasYouTubeScope = Boolean(
    googleAccount?.scope &&
      (googleAccount.scope.includes("youtube.readonly") ||
        googleAccount.scope.includes("youtube"))
  );

  const authStatus = {
    isLoggedIn: Boolean(session?.user),
    hasGoogleAuth: Boolean(googleAccount),
    hasYouTubeScope,
    isGoogleConfigured: isGoogleAuthEnabled,
    user: session?.user
      ? {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }
      : undefined,
  };

  // Determine if we should show personalized user feed:
  // - User has logged in with Google AND
  // - Account has granted YouTube scopes AND
  // - Either query is "For You" / "Subscriptions" OR user requested personalized feed without specific search
  const shouldServePersonalized =
    Boolean(googleToken) &&
    hasYouTubeScope &&
    !continuation &&
    (forcePersonalized ||
      query === "All" ||
      query.toLowerCase() === "for you" ||
      query.toLowerCase() === "subscriptions" ||
      query.toLowerCase() === "my youtube");

  if (shouldServePersonalized && googleToken) {
    try {
      const personalVideos = await fetchUserPersonalizedFeed(googleToken);
      if (personalVideos.length > 0) {
        return NextResponse.json({
          videos: personalVideos,
          nextToken: null,
          isPersonalized: true,
          region,
          authStatus,
        } as YouTubeSearchResponse);
      }
    } catch (err) {
      console.error("Failed to serve personalized feed, falling back:", err);
    }
  }

  // Fallback to real YouTube search/trending feed (works for unauthenticated, random, or category searches)
  const { videos, nextToken } = await fetchPublicYouTubeFeed(
    query,
    continuation,
    region
  );

  return NextResponse.json({
    videos,
    nextToken,
    isPersonalized: false,
    region,
    authStatus,
  } as YouTubeSearchResponse);
}
