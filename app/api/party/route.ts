import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { isValidYouTubeVideoId } from "@/lib/youtube";
import { prisma } from "@/db";
import type { GridPreset, SavedStreamItem } from "@/db/schema";

/**
 * Watch Party sync, backed by Postgres so every serverless instance sees the
 * same rooms (the previous in-memory Map only worked on a single server).
 * Clients poll GET every ~2.5s and POST layout / sync / reaction / heartbeat events.
 */

const ROOM_TTL_MS = 1000 * 60 * 60 * 6;
const PEER_ACTIVE_MS = 15_000;
const REACTION_WINDOW_MS = 10_000;
const CLEANUP_PROBABILITY = 0.02;
const CHAT_HISTORY = 50;

type PlaybackMap = Record<
  string,
  { state: "playing" | "paused"; time: number; at: number; by: string }
>;

const gridPresetSchema = z.enum(["1x1", "1x2", "2x2", "1+3", "3x3"]);

const postBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SYNC_LAYOUT"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
    gridPreset: gridPresetSchema,
    streams: z
      .array(
        z.object({
          videoId: z.string().trim().refine(isValidYouTubeVideoId),
          label: z.string().trim().min(1).max(100),
        })
      )
      .max(9),
  }),
  z.object({
    type: z.literal("SYNC_LIVE"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
  }),
  z.object({
    type: z.literal("REACTION"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
    emoji: z.string().trim().min(1).max(8),
    sender: z.string().trim().max(32).optional(),
  }),
  z.object({
    type: z.literal("PLAYBACK"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
    // Playback sync is YouTube-only (regular videos), so require a real 11-char video id
    videoId: z.string().trim().regex(/^[a-zA-Z0-9_-]{11}$/),
    state: z.enum(["playing", "paused"]),
    time: z.number().min(0).max(60 * 60 * 24),
  }),
  z.object({
    type: z.literal("CHAT"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
    sender: z.string().trim().min(1).max(32),
    text: z.string().trim().min(1).max(300),
  }),
  z.object({
    type: z.literal("HEARTBEAT"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
  }),
]);

function normalizeRoomCode(raw: string): string {
  return (
    raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24) ||
    "STUDIO-ALPHA"
  );
}

const ms = (d: Date | null | undefined) => (d ? d.getTime() : 0);

async function touchPeer(roomCode: string, clientId: string, now: Date) {
  await prisma.partyPeer.upsert({
    where: { roomCode_clientId: { roomCode, clientId } },
    create: { roomCode, clientId, lastSeenAt: now },
    update: { lastSeenAt: now },
  });
}

async function countPeers(roomCode: string, now: number): Promise<number> {
  const count = await prisma.partyPeer.count({
    where: { roomCode, lastSeenAt: { gt: new Date(now - PEER_ACTIVE_MS) } },
  });
  return Math.max(1, count);
}

/** Occasional housekeeping instead of a cron: expired rooms cascade-delete peers & reactions. */
async function maybeCleanup(now: number) {
  if (Math.random() > CLEANUP_PROBABILITY) return;
  try {
    await Promise.all([
      prisma.partyRoom.deleteMany({
        where: { lastActiveAt: { lt: new Date(now - ROOM_TTL_MS) } },
      }),
      prisma.partyReaction.deleteMany({
        where: { createdAt: { lt: new Date(now - 60_000) } },
      }),
      prisma.partyPeer.deleteMany({
        where: { lastSeenAt: { lt: new Date(now - 10 * 60_000) } },
      }),
      prisma.partyMessage.deleteMany({
        where: { createdAt: { lt: new Date(now - ROOM_TTL_MS) } },
      }),
    ]);
  } catch (err) {
    console.warn("Watch Party cleanup failed:", err);
  }
}

function dbError(err: unknown) {
  console.error("Watch Party database error:", err);
  return NextResponse.json(
    { error: "Watch Party is temporarily unavailable" },
    { status: 503 }
  );
}

export async function GET(request: Request) {
  await connection();

  const url = new URL(request.url);
  const roomCode = normalizeRoomCode(url.searchParams.get("room") || "STUDIO-ALPHA");
  const clientId = (url.searchParams.get("clientId") || "").slice(0, 64);
  const since = Number(url.searchParams.get("since") || "0") || 0;
  const msgSince = Number(url.searchParams.get("msgSince") || "0") || 0;
  const now = Date.now();

  try {
    const room = await prisma.partyRoom.findUnique({ where: { roomCode } });
    if (!room) {
      return NextResponse.json({
        roomCode,
        exists: false,
        peerCount: clientId ? 1 : 0,
        reactions: [],
      });
    }

    if (clientId) await touchPeer(roomCode, clientId, new Date(now));

    const [peerCount, reactions, messages] = await Promise.all([
      countPeers(roomCode, now),
      prisma.partyReaction.findMany({
        where: {
          roomCode,
          createdAt: { gt: new Date(Math.max(since, now - REACTION_WINDOW_MS)) },
        },
        orderBy: { createdAt: "asc" },
        take: 30,
      }),
      prisma.partyMessage.findMany({
        where: {
          roomCode,
          createdAt: { gt: new Date(Math.max(msgSince, now - ROOM_TTL_MS)) },
        },
        orderBy: { createdAt: "desc" },
        take: CHAT_HISTORY,
      }),
    ]);

    return NextResponse.json({
      roomCode,
      exists: true,
      gridPreset: room.gridPreset as GridPreset,
      streams: room.streams as unknown as SavedStreamItem[],
      updatedAt: ms(room.updatedAt),
      updatedBy: room.updatedBy,
      syncLiveAt: ms(room.syncLiveAt),
      syncLiveBy: room.syncLiveBy,
      peerCount,
      // Server clock lets clients line up playback events despite device clock skew
      serverTime: now,
      playback: (room.playback ?? {}) as PlaybackMap,
      messages: messages.reverse().map((m) => ({
        id: m.id,
        clientId: m.clientId,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt.getTime(),
      })),
      reactions: reactions.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        sender: r.sender ?? undefined,
        clientId: r.clientId,
        createdAt: r.createdAt.getTime(),
      })),
    });
  } catch (err) {
    return dbError(err);
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Watch Party payload" }, { status: 400 });
  }

  const data = parsed.data;
  const roomCode = normalizeRoomCode(data.roomCode);
  const now = Date.now();
  const nowDate = new Date(now);

  try {
    const changes =
      data.type === "SYNC_LAYOUT"
        ? {
            gridPreset: data.gridPreset,
            streams: data.streams,
            updatedAt: nowDate,
            updatedBy: data.clientId,
          }
        : data.type === "SYNC_LIVE"
          ? { syncLiveAt: nowDate, syncLiveBy: data.clientId }
          : {};

    let playbackChange = {};
    if (data.type === "PLAYBACK") {
      const existing = await prisma.partyRoom.findUnique({
        where: { roomCode },
        select: { playback: true },
      });
      const playback = { ...((existing?.playback ?? {}) as PlaybackMap) };
      playback[data.videoId] = {
        state: data.state,
        time: data.time,
        at: now,
        by: data.clientId,
      };
      // Keep only videos touched in the last 6h
      for (const [vid, entry] of Object.entries(playback)) {
        if (now - entry.at > ROOM_TTL_MS) delete playback[vid];
      }
      playbackChange = { playback };
    }

    const room = await prisma.partyRoom.upsert({
      where: { roomCode },
      create: { roomCode, lastActiveAt: nowDate, ...changes, ...playbackChange },
      update: { lastActiveAt: nowDate, ...changes, ...playbackChange },
    });

    await touchPeer(roomCode, data.clientId, nowDate);

    if (data.type === "CHAT") {
      await prisma.partyMessage.create({
        data: {
          roomCode,
          clientId: data.clientId,
          sender: data.sender,
          text: data.text,
          createdAt: nowDate,
        },
      });
    }

    if (data.type === "REACTION") {
      await prisma.partyReaction.create({
        data: {
          roomCode,
          clientId: data.clientId,
          emoji: data.emoji,
          sender: data.sender,
          createdAt: nowDate,
        },
      });
    }

    const peerCount = await countPeers(roomCode, now);
    void maybeCleanup(now);

    return NextResponse.json({
      ok: true,
      roomCode,
      peerCount,
      updatedAt: ms(room.updatedAt),
      syncLiveAt: ms(room.syncLiveAt),
    });
  } catch (err) {
    return dbError(err);
  }
}
