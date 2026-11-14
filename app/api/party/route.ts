import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { isValidYouTubeVideoId } from "@/lib/youtube";
import type { GridPreset, SavedStreamItem } from "@/db/schema";

interface PartyReaction {
  id: string;
  emoji: string;
  sender?: string;
  clientId: string;
  createdAt: number;
}

interface PartyRoomState {
  roomCode: string;
  gridPreset: GridPreset;
  streams: SavedStreamItem[];
  updatedAt: number;
  updatedBy: string;
  syncLiveAt: number;
  syncLiveBy: string;
  reactions: PartyReaction[];
  peers: Record<string, number>;
}

const globalForParty = globalThis as unknown as {
  partyRooms?: Map<string, PartyRoomState>;
};

const partyRooms = globalForParty.partyRooms ?? new Map<string, PartyRoomState>();
if (process.env.NODE_ENV !== "production") {
  globalForParty.partyRooms = partyRooms;
}

const ROOM_TTL_MS = 1000 * 60 * 60 * 6;
const PEER_ACTIVE_MS = 15000;

function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [key, room] of partyRooms.entries()) {
    if (now - room.updatedAt > ROOM_TTL_MS && now - room.syncLiveAt > ROOM_TTL_MS) {
      partyRooms.delete(key);
    }
  }
  if (partyRooms.size > 200) {
    const oldest = Array.from(partyRooms.entries())
      .sort((a, b) => a[1].updatedAt - b[1].updatedAt)
      .slice(0, partyRooms.size - 200);
    for (const [k] of oldest) {
      partyRooms.delete(k);
    }
  }
}

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
    type: z.literal("HEARTBEAT"),
    roomCode: z.string().trim().min(2).max(24),
    clientId: z.string().trim().min(1).max(64),
  }),
]);

function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24) || "STUDIO-ALPHA";
}

export async function GET(request: Request) {
  await connection();
  cleanupExpiredRooms();

  const url = new URL(request.url);
  const rawRoom = url.searchParams.get("room") || "STUDIO-ALPHA";
  const clientId = url.searchParams.get("clientId") || "";
  const since = Number(url.searchParams.get("since") || "0");
  const roomCode = normalizeRoomCode(rawRoom);

  const room = partyRooms.get(roomCode);
  if (!room) {
    return NextResponse.json({
      roomCode,
      exists: false,
      peerCount: clientId ? 1 : 0,
      reactions: [],
    });
  }

  const now = Date.now();
  if (clientId) {
    room.peers[clientId] = now;
  }

  // Prune stale peers & old reactions
  for (const [pid, ts] of Object.entries(room.peers)) {
    if (now - ts > PEER_ACTIVE_MS) {
      delete room.peers[pid];
    }
  }
  room.reactions = room.reactions.filter((r) => now - r.createdAt < 10000);

  return NextResponse.json({
    roomCode,
    exists: true,
    gridPreset: room.gridPreset,
    streams: room.streams,
    updatedAt: room.updatedAt,
    updatedBy: room.updatedBy,
    syncLiveAt: room.syncLiveAt,
    syncLiveBy: room.syncLiveBy,
    peerCount: Math.max(1, Object.keys(room.peers).length),
    reactions: room.reactions.filter((r) => r.createdAt > since),
  });
}

export async function POST(request: Request) {
  cleanupExpiredRooms();

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

  let room = partyRooms.get(roomCode);
  if (!room) {
    room = {
      roomCode,
      gridPreset: "2x2",
      streams: [],
      updatedAt: 0,
      updatedBy: "",
      syncLiveAt: 0,
      syncLiveBy: "",
      reactions: [],
      peers: {},
    };
    partyRooms.set(roomCode, room);
  }

  room.peers[data.clientId] = now;

  if (data.type === "SYNC_LAYOUT") {
    room.gridPreset = data.gridPreset;
    room.streams = data.streams;
    room.updatedAt = now;
    room.updatedBy = data.clientId;
  } else if (data.type === "SYNC_LIVE") {
    room.syncLiveAt = now;
    room.syncLiveBy = data.clientId;
  } else if (data.type === "REACTION") {
    room.reactions.push({
      id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
      emoji: data.emoji,
      sender: data.sender,
      clientId: data.clientId,
      createdAt: now,
    });
    if (room.reactions.length > 30) {
      room.reactions = room.reactions.slice(-30);
    }
  }

  return NextResponse.json({
    ok: true,
    roomCode,
    peerCount: Math.max(1, Object.keys(room.peers).length),
    updatedAt: room.updatedAt,
    syncLiveAt: room.syncLiveAt,
  });
}
