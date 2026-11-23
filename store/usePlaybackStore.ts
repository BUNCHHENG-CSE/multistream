"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Playback-level features kept separate from the main grid store:
 * resume positions, per-tile "Up next" queues, sleep timer, auto-replace & live alerts.
 */

export interface QueueItem {
  videoId: string;
  title: string;
}

interface SavedProgress {
  /** Seconds into the video */
  t: number;
  /** Video duration in seconds (for "finished?" checks) */
  d: number;
  /** Last update (ms) — used to prune old entries */
  at: number;
}

export interface WatchHistoryItem {
  videoId: string;
  title: string;
  watchedAt: number;
}

export interface StreamReminder {
  videoId: string;
  title: string;
  channelName: string;
  /** Scheduled start (ms) */
  scheduledAt: number;
}

const MAX_PROGRESS_ENTRIES = 300;
const MAX_HISTORY = 100;
const MAX_QUEUE_LENGTH = 50;

interface PlaybackState {
  progress: Record<string, SavedProgress>;
  queues: Record<string, QueueItem[]>;
  sleepTimerEndsAt: number | null;
  /** The duration that was picked (for highlighting the menu option) */
  sleepTimerMinutes: number | null;
  /** Bumped when every player should pause (sleep timer) */
  pauseAllVersion: number;
  autoReplaceEnded: boolean;
  liveAlertsEnabled: boolean;
  /** Most recent first; YouTube videos played in this app (YouTube's own history isn't available via API) */
  history: WatchHistoryItem[];
  reminders: Record<string, StreamReminder>;

  recordWatch: (videoId: string, title: string) => void;
  removeFromHistory: (videoId: string) => void;
  clearHistory: () => void;
  toggleReminder: (reminder: StreamReminder) => boolean;
  removeReminder: (videoId: string) => void;

  saveProgress: (videoId: string, t: number, d: number) => void;
  clearProgress: (videoId: string) => void;
  getResumeTime: (videoId: string) => number | null;

  enqueue: (tileVideoId: string, item: QueueItem) => boolean;
  dequeueAt: (tileVideoId: string, index: number) => void;
  clearQueue: (tileVideoId: string) => void;
  /** Removes and returns the next item; the remaining queue moves to that video's id */
  takeNext: (
    tileVideoId: string,
    isAvailable?: (videoId: string) => boolean
  ) => QueueItem | null;
  /** Keeps a tile's queue attached when its video is swapped */
  moveQueue: (fromVideoId: string, toVideoId: string) => void;

  setSleepTimer: (minutes: number | null) => void;
  triggerPauseAll: () => void;
  setAutoReplaceEnded: (enabled: boolean) => void;
  setLiveAlertsEnabled: (enabled: boolean) => void;
}

export const usePlaybackStore = create<PlaybackState>()(
  persist(
    (set, get) => ({
      progress: {},
      queues: {},
      sleepTimerEndsAt: null,
      sleepTimerMinutes: null,
      pauseAllVersion: 0,
      autoReplaceEnded: true,
      liveAlertsEnabled: false,
      history: [],
      reminders: {},

      recordWatch: (videoId, title) => {
        set((state) => ({
          history: [
            { videoId, title, watchedAt: Date.now() },
            ...state.history.filter((h) => h.videoId !== videoId),
          ].slice(0, MAX_HISTORY),
        }));
      },

      removeFromHistory: (videoId) => {
        set((state) => ({
          history: state.history.filter((h) => h.videoId !== videoId),
        }));
      },

      clearHistory: () => set({ history: [] }),

      /** Returns true when the reminder is now set, false when it was removed */
      toggleReminder: (reminder) => {
        const exists = Boolean(get().reminders[reminder.videoId]);
        set((state) => {
          const reminders = { ...state.reminders };
          if (exists) delete reminders[reminder.videoId];
          else reminders[reminder.videoId] = reminder;
          return { reminders };
        });
        return !exists;
      },

      removeReminder: (videoId) => {
        set((state) => {
          if (!state.reminders[videoId]) return state;
          const reminders = { ...state.reminders };
          delete reminders[videoId];
          return { reminders };
        });
      },

      saveProgress: (videoId, t, d) => {
        set((state) => {
          const next = { ...state.progress, [videoId]: { t, d, at: Date.now() } };
          const keys = Object.keys(next);
          if (keys.length > MAX_PROGRESS_ENTRIES) {
            keys
              .sort((a, b) => next[a].at - next[b].at)
              .slice(0, keys.length - MAX_PROGRESS_ENTRIES)
              .forEach((k) => delete next[k]);
          }
          return { progress: next };
        });
      },

      clearProgress: (videoId) => {
        if (!get().progress[videoId]) return;
        set((state) => {
          const next = { ...state.progress };
          delete next[videoId];
          return { progress: next };
        });
      },

      getResumeTime: (videoId) => {
        const p = get().progress[videoId];
        if (!p) return null;
        // Skip near-start and near-end positions, like YouTube does
        if (p.t < 15 || (p.d > 0 && p.d - p.t < 20)) return null;
        return p.t;
      },

      enqueue: (tileVideoId, item) => {
        const current = get().queues[tileVideoId] ?? [];
        if (
          item.videoId === tileVideoId ||
          current.some((q) => q.videoId === item.videoId) ||
          current.length >= MAX_QUEUE_LENGTH
        ) {
          return false;
        }
        set((state) => ({
          queues: { ...state.queues, [tileVideoId]: [...current, item] },
        }));
        return true;
      },

      dequeueAt: (tileVideoId, index) => {
        set((state) => {
          const current = state.queues[tileVideoId] ?? [];
          const nextQueue = current.filter((_, i) => i !== index);
          const queues = { ...state.queues };
          if (nextQueue.length) queues[tileVideoId] = nextQueue;
          else delete queues[tileVideoId];
          return { queues };
        });
      },

      clearQueue: (tileVideoId) => {
        set((state) => {
          const queues = { ...state.queues };
          delete queues[tileVideoId];
          return { queues };
        });
      },

      takeNext: (tileVideoId, isAvailable) => {
        const current = get().queues[tileVideoId] ?? [];
        // Skip (and drop) items that are already playing in another tile
        const idx = isAvailable
          ? current.findIndex((q) => isAvailable(q.videoId))
          : 0;
        const next = idx >= 0 ? current[idx] : undefined;
        const rest = idx >= 0 ? current.slice(idx + 1) : [];
        if (!next) {
          if (current.length) get().clearQueue(tileVideoId);
          return null;
        }
        set((state) => {
          const queues = { ...state.queues };
          delete queues[tileVideoId];
          if (rest.length) queues[next.videoId] = rest;
          return { queues };
        });
        return next;
      },

      moveQueue: (fromVideoId, toVideoId) => {
        if (fromVideoId === toVideoId) return;
        set((state) => {
          const q = state.queues[fromVideoId];
          if (!q) return state;
          const queues = { ...state.queues };
          delete queues[fromVideoId];
          queues[toVideoId] = q.filter((i) => i.videoId !== toVideoId);
          if (!queues[toVideoId].length) delete queues[toVideoId];
          return { queues };
        });
      },

      setSleepTimer: (minutes) => {
        set({
          sleepTimerEndsAt: minutes ? Date.now() + minutes * 60_000 : null,
          sleepTimerMinutes: minutes || null,
        });
      },

      triggerPauseAll: () => {
        set((state) => ({ pauseAllVersion: state.pauseAllVersion + 1 }));
      },

      setAutoReplaceEnded: (enabled) => set({ autoReplaceEnded: enabled }),
      setLiveAlertsEnabled: (enabled) => set({ liveAlertsEnabled: enabled }),
    }),
    {
      name: "tct-playback-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        progress: state.progress,
        queues: state.queues,
        sleepTimerEndsAt: state.sleepTimerEndsAt,
        sleepTimerMinutes: state.sleepTimerMinutes,
        autoReplaceEnded: state.autoReplaceEnded,
        liveAlertsEnabled: state.liveAlertsEnabled,
        history: state.history,
        reminders: state.reminders,
      }),
    }
  )
);

/** "1:02:03" / "4:51" from seconds */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
