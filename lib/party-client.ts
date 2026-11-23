"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Client-side Watch Party plumbing shared by the sync controller (ShareExportDialog),
 * the party bar (WatchPartyReactions) and every video tile (StreamPlayer):
 *  - one stable client id per tab (so our own events are never echoed back to us)
 *  - chat messages + display name
 *  - a tiny playback event bus between tiles and the sync controller
 */

/* ───────────── Client identity ───────────── */

let clientId: string | null = null;
export function getPartyClientId(): string {
  if (!clientId) {
    clientId = `peer-${Math.random().toString(36).slice(2, 10)}`;
  }
  return clientId;
}

/* ───────────── Chat + identity store ───────────── */

export interface PartyChatMessage {
  id: string;
  clientId: string;
  sender: string;
  text: string;
  createdAt: number;
}

interface PartyState {
  displayName: string;
  messages: PartyChatMessage[];
  unread: number;
  isChatOpen: boolean;
  setDisplayName: (name: string) => void;
  addMessages: (msgs: PartyChatMessage[]) => void;
  setChatOpen: (open: boolean) => void;
  resetChat: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set) => ({
      displayName: "",
      messages: [],
      unread: 0,
      isChatOpen: false,
      setDisplayName: (name) => set({ displayName: name.trim().slice(0, 32) }),
      addMessages: (msgs) =>
        set((state) => {
          const known = new Set(state.messages.map((m) => m.id));
          const fresh = msgs.filter((m) => !known.has(m.id));
          if (!fresh.length) return state;
          const fromOthers = fresh.filter((m) => m.clientId !== getPartyClientId()).length;
          // Confirmed copies replace our optimistic "local-" messages
          const confirmed = new Set(
            fresh
              .filter((m) => !m.id.startsWith("local-"))
              .map((m) => `${m.clientId}|${m.text}`)
          );
          const kept = state.messages.filter(
            (m) => !(m.id.startsWith("local-") && confirmed.has(`${m.clientId}|${m.text}`))
          );
          return {
            messages: [...kept, ...fresh]
              .sort((a, b) => a.createdAt - b.createdAt)
              .slice(-100),
            unread: state.isChatOpen ? 0 : state.unread + fromOthers,
          };
        }),
      setChatOpen: (open) => set({ isChatOpen: open, ...(open ? { unread: 0 } : {}) }),
      resetChat: () => set({ messages: [], unread: 0 }),
    }),
    {
      name: "tct-party-identity",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ displayName: s.displayName }),
    }
  )
);

export function getPartyDisplayName(): string {
  return usePartyStore.getState().displayName || `Guest-${getPartyClientId().slice(5, 9)}`;
}

/* ───────────── Playback event bus ───────────── */

export interface PartyPlaybackEvent {
  videoId: string;
  state: "playing" | "paused";
  /** Seconds into the video when the event happened */
  time: number;
  /** When it happened (ms) — receivers add elapsed time while playing */
  at: number;
}

type Listener<T> = (event: T) => void;
const localListeners = new Set<Listener<PartyPlaybackEvent>>();
const remoteListeners = new Map<string, Set<Listener<PartyPlaybackEvent>>>();
/** Ignore a tile's own player events briefly after we applied a remote command to it */
const suppressUntil = new Map<string, number>();

/** Tiles call this when the *user* plays/pauses/seeks a regular video. */
export function emitLocalPlayback(event: PartyPlaybackEvent): void {
  if ((suppressUntil.get(event.videoId) ?? 0) > Date.now()) return;
  localListeners.forEach((l) => l(event));
}

/** The sync controller listens for local events to POST them to the room. */
export function onLocalPlayback(listener: Listener<PartyPlaybackEvent>): () => void {
  localListeners.add(listener);
  return () => localListeners.delete(listener);
}

/** The sync controller forwards remote events here; the matching tile applies them. */
export function dispatchRemotePlayback(event: PartyPlaybackEvent): void {
  suppressUntil.set(event.videoId, Date.now() + 2500);
  remoteListeners.get(event.videoId)?.forEach((l) => l(event));
}

/** Tiles subscribe to remote playback for their own video. */
export function onRemotePlayback(
  videoId: string,
  listener: Listener<PartyPlaybackEvent>
): () => void {
  let set = remoteListeners.get(videoId);
  if (!set) {
    set = new Set();
    remoteListeners.set(videoId, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) remoteListeners.delete(videoId);
  };
}

/** Suppress outgoing events for a tile (e.g. sleep-timer pause, resume seek, reconnect). */
export function suppressLocalPlayback(videoId: string, ms = 2500): void {
  suppressUntil.set(videoId, Date.now() + ms);
}
