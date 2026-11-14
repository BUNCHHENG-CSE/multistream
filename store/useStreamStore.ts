"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GridPreset, SavedStreamItem } from "@/db/schema";
import {
  extractYouTubeVideoId,
  CURATED_LIVE_STREAMS,
  getStreamPlatform,
  getStreamRawId,
} from "@/lib/youtube";
import type { SoundscapeType } from "@/lib/soundscape";

export interface StreamItem {
  videoId: string;
  label: string;
  addedAt: number;
}

export interface StreamBookmark {
  id: string;
  videoId: string;
  streamLabel: string;
  note: string;
  createdAt: number;
  elapsedLabel: string;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  sender?: string;
  leftPct: number;
  createdAt: number;
}

export interface AddStreamResult {
  success: boolean;
  error?: string;
  videoId?: string;
}

export type AutoCycleInterval = 15 | 30 | 60;

export interface GuestLayout {
  id: string;
  title: string;
  gridPreset: GridPreset;
  streams: SavedStreamItem[];
  createdAt: string;
}

interface StreamState {
  streams: StreamItem[];
  gridPreset: GridPreset;
  /**
   * Video IDs that currently have audio unmuted (multiple streams can play audio simultaneously).
   */
  unmutedVideoIds: string[];
  /**
   * The most recently unmuted video IDs, used when toggling global audio back on.
   */
  lastUnmutedVideoIds: string[];
  /**
   * Focused ("Solo") stream ID. Plays at 100% volume, full quality, and expanded 2x grid size,
   * while other streams drop to 50% volume, Eco video quality, and half grid size.
   */
  focusedVideoId: string | null;
  /**
   * Streams explicitly muted by the user while Solo Focus mode or multi-audio is active.
   */
  manuallyMutedVideoIds: string[];
  /**
   * Monotonic counter incremented on explicit mute-all actions so iframes
   * always receive a "mute" command even if `unmutedVideoIds` was already empty.
   */
  muteSyncVersion: number;
  /**
   * The videoId currently loaded into the Live Chat sidebar.
   */
  activeChatVideoId: string | null;
  /**
   * Whether the collapsible right-hand Live Chat sidebar is open.
   */
  isChatOpen: boolean;

  // Power-user & Audio Mixer states
  masterVolume: number;
  streamVolumes: Record<string, number>;
  audioFollowsHover: boolean;
  audioFollowsChat: boolean;
  syncLiveVersion: number;
  autoCycleEnabled: boolean;
  autoCycleIntervalSec: AutoCycleInterval;
  ecoModeEnabled: boolean;
  isSplitChat: boolean;
  secondaryChatVideoId: string | null;
  isCompactChat: boolean;
  splitChatRatio: number;
  keepChatAlive: boolean;
  hasChatActivated: boolean;
  isAudioMixerOpen: boolean;
  isShortcutsOpen: boolean;

  // Pro Studio Additions: Command Palette, PiP, Splitters, Telemetry, Bookmarks, Ambilight & Soundscapes
  isCommandPaletteOpen: boolean;
  pipVideoId: string | null;
  chatSidebarWidth: number;
  mainStageRatio: number;
  isSplitterDragging: boolean;
  showTelemetryTicker: boolean;
  isBookmarksOpen: boolean;
  sessionStartedAt: number;
  streamQualities: Record<string, string>;
  bookmarks: StreamBookmark[];
  ambilightEnabled: boolean;
  soundscapeType: SoundscapeType;
  soundscapeVolume: number;
  watchPartyCode: string | null;
  floatingReactions: FloatingReaction[];
  guestLayouts: GuestLayout[];
  guestName: string;
  isGuestSessionActive: boolean;

  // Actions
  addStream: (input: string, customLabel?: string) => AddStreamResult;
  removeStream: (videoId: string) => void;
  updateStreamLabel: (videoId: string, label: string) => void;
  setGridPreset: (preset: GridPreset) => void;
  setStreamAudio: (videoId: string, unmuted: boolean) => void;
  toggleStreamAudio: (videoId: string) => boolean;
  toggleSoloFocus: (videoId: string) => boolean;
  toggleGlobalAudio: () => { unmuted: boolean; count: number };
  muteAll: () => void;
  promoteToMain: (videoId: string) => void;
  setActiveChatStream: (videoId: string, openSidebar?: boolean) => void;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  loadLayoutConfig: (config: {
    gridPreset: GridPreset;
    streams: SavedStreamItem[];
  }) => void;
  clearAllStreams: () => void;
  loadStarterStreams: () => void;

  // New Actions
  setMasterVolume: (volume: number) => void;
  setStreamVolume: (videoId: string, volume: number) => void;
  resetAllVolumes: () => void;
  duckBackgroundStreams: () => void;
  setAudioFollowsHover: (enabled: boolean) => void;
  setAudioFollowsChat: (enabled: boolean) => void;
  reorderStreams: (fromIndex: number, toIndex: number) => void;
  replaceStream: (
    oldVideoId: string,
    newInput: string,
    customLabel?: string
  ) => AddStreamResult;
  triggerSyncAllLive: () => void;
  setAutoCycle: (enabled: boolean, intervalSec?: AutoCycleInterval) => void;
  cycleNextStream: () => void;
  setEcoMode: (enabled: boolean) => void;
  setSplitChat: (enabled: boolean) => void;
  setSecondaryChatStream: (videoId: string) => void;
  setCompactChat: (compact: boolean) => void;
  setSplitChatRatio: (ratio: number) => void;
  setKeepChatAlive: (keepAlive: boolean) => void;
  swapSplitChatStreams: () => void;
  cycleChatStream: (direction: 1 | -1) => void;
  setAudioMixerOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  loadWallPack: (
    packStreams: Array<{ videoId: string; label: string }>,
    preset: GridPreset
  ) => void;

  // Pro Studio Actions
  setCommandPaletteOpen: (open: boolean) => void;
  setPipVideoId: (videoId: string | null) => void;
  setChatSidebarWidth: (width: number) => void;
  setMainStageRatio: (ratio: number) => void;
  setSplitterDragging: (dragging: boolean) => void;
  setShowTelemetryTicker: (show: boolean) => void;
  setBookmarksOpen: (open: boolean) => void;
  setStreamQuality: (videoId: string, quality: string) => void;
  addBookmark: (videoId: string, note: string) => StreamBookmark | null;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  setAmbilightEnabled: (enabled: boolean) => void;
  setSoundscapeType: (type: SoundscapeType) => void;
  setSoundscapeVolume: (volume: number) => void;
  setWatchPartyCode: (code: string | null) => void;
  triggerFloatingReaction: (emoji: string, sender?: string) => void;
  pruneFloatingReactions: () => void;
  saveGuestLayout: (input: {
    title: string;
    gridPreset: GridPreset;
    streams: SavedStreamItem[];
  }) => GuestLayout;
  deleteGuestLayout: (id: string) => void;
  setGuestProfile: (name: string) => void;
}

const PRESET_CAPACITY: Record<GridPreset, number> = {
  "1x1": 1,
  "1x2": 2,
  "2x2": 4,
  "1+3": 4,
  "3x3": 9,
};

function getRecommendedPreset(
  currentPreset: GridPreset,
  newCount: number
): GridPreset {
  if (newCount <= PRESET_CAPACITY[currentPreset]) {
    return currentPreset;
  }
  if (newCount === 1) return "1x1";
  if (newCount === 2) return "1x2";
  if (newCount <= 4) return currentPreset === "1+3" ? "1+3" : "2x2";
  return "3x3";
}

function buildDefaultStreamLabel(
  videoId: string,
  customLabel: string | undefined,
  slotNumber: number
): string {
  if (customLabel?.trim()) return customLabel.trim();
  const matchedCurated = CURATED_LIVE_STREAMS.find(
    (c) => c.videoId === videoId
  );
  if (matchedCurated) return matchedCurated.label;

  const platform = getStreamPlatform(videoId);
  const raw = getStreamRawId(videoId);
  if (platform === "twitch") return `Twitch: ${raw}`;
  if (platform === "kick") return `Kick: ${raw}`;
  return `Stream #${slotNumber} (${videoId})`;
}

export const useStreamStore = create<StreamState>()(
  persist(
    (set, get) => ({
      streams: [],
      gridPreset: "2x2",
      unmutedVideoIds: [],
      lastUnmutedVideoIds: [],
      focusedVideoId: null,
      manuallyMutedVideoIds: [],
      muteSyncVersion: 0,
      activeChatVideoId: null,
      isChatOpen: false,

      masterVolume: 100,
      streamVolumes: {},
      audioFollowsHover: false,
      audioFollowsChat: false,
      syncLiveVersion: 0,
      autoCycleEnabled: false,
      autoCycleIntervalSec: 30,
      ecoModeEnabled: false,
      isSplitChat: false,
      secondaryChatVideoId: null,
      isCompactChat: false,
      splitChatRatio: 50,
      keepChatAlive: true,
      hasChatActivated: false,
      isAudioMixerOpen: false,
      isShortcutsOpen: false,

      isCommandPaletteOpen: false,
      pipVideoId: null,
      chatSidebarWidth: 360,
      mainStageRatio: 70,
      isSplitterDragging: false,
      showTelemetryTicker: true,
      isBookmarksOpen: false,
      sessionStartedAt: Date.now(),
      streamQualities: {},
      bookmarks: [],
      ambilightEnabled: true,
      soundscapeType: "off",
      soundscapeVolume: 35,
      watchPartyCode: null,
      floatingReactions: [],
      guestLayouts: [],
      guestName: "Guest Director",
      isGuestSessionActive: false,

      addStream: (input: string, customLabel?: string): AddStreamResult => {
        const videoId = extractYouTubeVideoId(input);

        if (!videoId) {
          return {
            success: false,
            error:
              "Invalid stream URL, handle, or ID. Paste a YouTube, Twitch, Kick link, @handle, or 11-character ID.",
          };
        }

        const currentStreams = get().streams;
        if (currentStreams.some((s) => s.videoId === videoId)) {
          return {
            success: false,
            error: `Stream (${videoId}) is already active in the grid.`,
          };
        }

        if (currentStreams.length >= 9) {
          return {
            success: false,
            error:
              "Maximum of 9 simultaneous streams reached (3x3 Command Center).",
          };
        }

        const label = buildDefaultStreamLabel(
          videoId,
          customLabel,
          currentStreams.length + 1
        );

        const nextStreams: StreamItem[] = [
          ...currentStreams,
          {
            videoId,
            label,
            addedAt: Date.now(),
          },
        ];

        const nextPreset = getRecommendedPreset(
          get().gridPreset,
          nextStreams.length
        );

        set((state) => ({
          streams: nextStreams,
          gridPreset: nextPreset,
          activeChatVideoId: state.activeChatVideoId ?? videoId,
          secondaryChatVideoId:
            state.secondaryChatVideoId ??
            (nextStreams.length > 1 ? nextStreams[1].videoId : null),
          streamVolumes: {
            ...state.streamVolumes,
            [videoId]: state.streamVolumes[videoId] ?? 100,
          },
        }));

        return {
          success: true,
          videoId,
        };
      },

      removeStream: (videoId: string) => {
        set((state) => {
          const nextStreams = state.streams.filter(
            (s) => s.videoId !== videoId
          );
          const nextUnmuted = state.unmutedVideoIds.filter(
            (id) => id !== videoId
          );
          const nextLastUnmuted = state.lastUnmutedVideoIds.filter(
            (id) => id !== videoId
          );
          const nextManuallyMuted = state.manuallyMutedVideoIds.filter(
            (id) => id !== videoId
          );
          const nextFocused =
            state.focusedVideoId === videoId ? null : state.focusedVideoId;
          const nextChat =
            state.activeChatVideoId === videoId
              ? (nextStreams[0]?.videoId ?? null)
              : state.activeChatVideoId;
          const nextSecondaryChat =
            state.secondaryChatVideoId === videoId
              ? (nextStreams[1]?.videoId ?? nextStreams[0]?.videoId ?? null)
              : state.secondaryChatVideoId;

          const nextVolumes = { ...state.streamVolumes };
          delete nextVolumes[videoId];
          const nextQualities = { ...state.streamQualities };
          delete nextQualities[videoId];

          return {
            streams: nextStreams,
            unmutedVideoIds: nextUnmuted,
            lastUnmutedVideoIds: nextLastUnmuted,
            manuallyMutedVideoIds: nextManuallyMuted,
            focusedVideoId: nextFocused,
            activeChatVideoId: nextChat,
            secondaryChatVideoId: nextSecondaryChat,
            pipVideoId: state.pipVideoId === videoId ? null : state.pipVideoId,
            streamVolumes: nextVolumes,
            streamQualities: nextQualities,
            isChatOpen: nextStreams.length === 0 ? false : state.isChatOpen,
            autoCycleEnabled:
              nextStreams.length <= 1 ? false : state.autoCycleEnabled,
          };
        });
      },

      updateStreamLabel: (videoId: string, label: string) => {
        set((state) => ({
          streams: state.streams.map((s) =>
            s.videoId === videoId
              ? { ...s, label: label.trim() || s.videoId }
              : s
          ),
        }));
      },

      setGridPreset: (preset: GridPreset) => {
        set({ gridPreset: preset });
      },

      setStreamAudio: (videoId: string, unmuted: boolean) => {
        set((state) => {
          if (unmuted) {
            const nextManuallyMuted = state.manuallyMutedVideoIds.filter(
              (id) => id !== videoId
            );
            if (state.unmutedVideoIds.includes(videoId)) {
              return nextManuallyMuted.length !==
                state.manuallyMutedVideoIds.length
                ? { manuallyMutedVideoIds: nextManuallyMuted }
                : state;
            }
            const next = [...state.unmutedVideoIds, videoId];
            return {
              unmutedVideoIds: next,
              lastUnmutedVideoIds: next,
              manuallyMutedVideoIds: nextManuallyMuted,
            };
          }

          const nextManuallyMuted = state.manuallyMutedVideoIds.includes(
            videoId
          )
            ? state.manuallyMutedVideoIds
            : [...state.manuallyMutedVideoIds, videoId];
          const nextFocused =
            state.focusedVideoId === videoId ? null : state.focusedVideoId;

          if (!state.unmutedVideoIds.includes(videoId)) {
            return {
              manuallyMutedVideoIds: nextManuallyMuted,
              focusedVideoId: nextFocused,
            };
          }

          return {
            unmutedVideoIds: state.unmutedVideoIds.filter(
              (id) => id !== videoId
            ),
            manuallyMutedVideoIds: nextManuallyMuted,
            focusedVideoId: nextFocused,
          };
        });
      },

      toggleStreamAudio: (videoId: string) => {
        const state = get();
        if (state.unmutedVideoIds.includes(videoId)) {
          const nextManuallyMuted = state.manuallyMutedVideoIds.includes(
            videoId
          )
            ? state.manuallyMutedVideoIds
            : [...state.manuallyMutedVideoIds, videoId];
          set({
            unmutedVideoIds: state.unmutedVideoIds.filter(
              (id) => id !== videoId
            ),
            manuallyMutedVideoIds: nextManuallyMuted,
            focusedVideoId:
              state.focusedVideoId === videoId ? null : state.focusedVideoId,
          });
          return false;
        }

        const next = [...state.unmutedVideoIds, videoId];
        set({
          unmutedVideoIds: next,
          lastUnmutedVideoIds: next,
          manuallyMutedVideoIds: state.manuallyMutedVideoIds.filter(
            (id) => id !== videoId
          ),
        });
        return true;
      },

      toggleSoloFocus: (videoId: string) => {
        const state = get();
        if (state.focusedVideoId === videoId) {
          set({ focusedVideoId: null });
          return false;
        }

        const nextManuallyMuted = state.manuallyMutedVideoIds.filter(
          (id) => id !== videoId
        );
        const nextUnmuted = state.streams
          .map((s) => s.videoId)
          .filter((id) => id === videoId || !nextManuallyMuted.includes(id));

        set({
          focusedVideoId: videoId,
          manuallyMutedVideoIds: nextManuallyMuted,
          unmutedVideoIds: nextUnmuted,
          lastUnmutedVideoIds: nextUnmuted,
        });
        return true;
      },

      toggleGlobalAudio: () => {
        const state = get();
        if (state.unmutedVideoIds.length > 0) {
          set({
            lastUnmutedVideoIds: state.unmutedVideoIds,
            unmutedVideoIds: [],
            focusedVideoId: null,
            muteSyncVersion: state.muteSyncVersion + 1,
          });
          return { unmuted: false, count: 0 };
        }

        const activeIds = new Set(state.streams.map((s) => s.videoId));
        const restoredIds = state.lastUnmutedVideoIds.filter((id) =>
          activeIds.has(id)
        );
        const targetIds =
          restoredIds.length > 0
            ? restoredIds
            : state.streams.map((s) => s.videoId);

        if (targetIds.length === 0) {
          return { unmuted: false, count: 0 };
        }

        set({
          unmutedVideoIds: targetIds,
          lastUnmutedVideoIds: targetIds,
          manuallyMutedVideoIds: [],
        });
        return { unmuted: true, count: targetIds.length };
      },

      muteAll: () => {
        set((state) => ({
          lastUnmutedVideoIds:
            state.unmutedVideoIds.length > 0
              ? state.unmutedVideoIds
              : state.lastUnmutedVideoIds,
          unmutedVideoIds: [],
          focusedVideoId: null,
          muteSyncVersion: state.muteSyncVersion + 1,
        }));
      },

      promoteToMain: (videoId: string) => {
        set((state) => {
          const index = state.streams.findIndex((s) => s.videoId === videoId);
          if (index <= 0) return state;

          const nextStreams = [...state.streams];
          const [target] = nextStreams.splice(index, 1);
          nextStreams.unshift(target);

          return { streams: nextStreams };
        });
      },

      setActiveChatStream: (videoId: string, openSidebar = true) => {
        set((state) => {
          const nextState: Partial<StreamState> = {
            activeChatVideoId: videoId,
            isChatOpen: openSidebar ? true : state.isChatOpen,
            hasChatActivated: openSidebar ? true : state.hasChatActivated,
          };

          if (state.audioFollowsChat) {
            nextState.unmutedVideoIds = [videoId];
            nextState.lastUnmutedVideoIds = [videoId];
            nextState.manuallyMutedVideoIds = state.streams
              .map((s) => s.videoId)
              .filter((id) => id !== videoId);
            nextState.focusedVideoId = videoId;
          }

          return nextState;
        });
      },

      setChatOpen: (open: boolean) => {
        set((state) => ({
          isChatOpen: open,
          hasChatActivated: open ? true : state.hasChatActivated,
          activeChatVideoId:
            open && !state.activeChatVideoId
              ? (state.streams[0]?.videoId ?? null)
              : state.activeChatVideoId,
          secondaryChatVideoId:
            open && !state.secondaryChatVideoId
              ? (state.streams[1]?.videoId ?? state.streams[0]?.videoId ?? null)
              : state.secondaryChatVideoId,
        }));
      },

      toggleChat: () => {
        set((state) => {
          const nextOpen = !state.isChatOpen;
          return {
            isChatOpen: nextOpen,
            hasChatActivated: nextOpen ? true : state.hasChatActivated,
            activeChatVideoId:
              nextOpen && !state.activeChatVideoId
                ? (state.streams[0]?.videoId ?? null)
                : state.activeChatVideoId,
            secondaryChatVideoId:
              nextOpen && !state.secondaryChatVideoId
                ? (state.streams[1]?.videoId ??
                  state.streams[0]?.videoId ??
                  null)
                : state.secondaryChatVideoId,
          };
        });
      },

      loadLayoutConfig: ({ gridPreset, streams }) => {
        const now = Date.now();
        const mappedStreams: StreamItem[] = streams.slice(0, 9).map((s, idx) => ({
          videoId: s.videoId,
          label: buildDefaultStreamLabel(s.videoId, s.label, idx + 1),
          addedAt: now + idx,
        }));

        const nextVolumes: Record<string, number> = {};
        mappedStreams.forEach((s) => {
          nextVolumes[s.videoId] = 100;
        });

        set({
          gridPreset,
          streams: mappedStreams,
          unmutedVideoIds: [],
          lastUnmutedVideoIds: [],
          focusedVideoId: null,
          manuallyMutedVideoIds: [],
          pipVideoId: null,
          streamVolumes: nextVolumes,
          streamQualities: {},
          activeChatVideoId: mappedStreams[0]?.videoId ?? null,
          secondaryChatVideoId:
            mappedStreams[1]?.videoId ?? mappedStreams[0]?.videoId ?? null,
        });
      },

      clearAllStreams: () => {
        set({
          streams: [],
          unmutedVideoIds: [],
          lastUnmutedVideoIds: [],
          focusedVideoId: null,
          manuallyMutedVideoIds: [],
          pipVideoId: null,
          streamVolumes: {},
          streamQualities: {},
          activeChatVideoId: null,
          secondaryChatVideoId: null,
          isChatOpen: false,
          autoCycleEnabled: false,
        });
      },

      loadStarterStreams: () => {
        const now = Date.now();
        const starter: StreamItem[] = CURATED_LIVE_STREAMS.slice(0, 4).map(
          (item, idx) => ({
            videoId: item.videoId,
            label: item.label,
            addedAt: now + idx,
          })
        );

        const nextVolumes: Record<string, number> = {};
        starter.forEach((s) => {
          nextVolumes[s.videoId] = 100;
        });

        set({
          streams: starter,
          gridPreset: "1+3",
          unmutedVideoIds: [],
          lastUnmutedVideoIds: [],
          focusedVideoId: null,
          manuallyMutedVideoIds: [],
          streamVolumes: nextVolumes,
          activeChatVideoId: starter[0]?.videoId ?? null,
          secondaryChatVideoId: starter[1]?.videoId ?? null,
        });
      },

      setMasterVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(100, Math.round(volume)));
        set({ masterVolume: clamped });
      },

      setStreamVolume: (videoId: string, volume: number) => {
        const clamped = Math.max(5, Math.min(100, Math.round(volume)));
        set((state) => ({
          streamVolumes: {
            ...state.streamVolumes,
            [videoId]: clamped,
          },
        }));
      },

      resetAllVolumes: () => {
        set((state) => {
          const resetMap: Record<string, number> = {};
          state.streams.forEach((s) => {
            resetMap[s.videoId] = 100;
          });
          return {
            masterVolume: 100,
            streamVolumes: resetMap,
          };
        });
      },

      duckBackgroundStreams: () => {
        set((state) => {
          if (state.streams.length === 0) return state;
          const leadId = state.focusedVideoId ?? state.streams[0]?.videoId;
          const nextMap: Record<string, number> = {};
          const nextUnmuted = new Set(state.unmutedVideoIds);

          state.streams.forEach((s) => {
            if (s.videoId === leadId) {
              nextMap[s.videoId] = 100;
              nextUnmuted.add(s.videoId);
            } else {
              nextMap[s.videoId] = 30;
            }
          });

          const unmutedArr = Array.from(nextUnmuted);
          return {
            streamVolumes: nextMap,
            unmutedVideoIds: unmutedArr,
            lastUnmutedVideoIds: unmutedArr,
          };
        });
      },

      setAudioFollowsHover: (enabled: boolean) => {
        set({ audioFollowsHover: enabled });
      },

      setAudioFollowsChat: (enabled: boolean) => {
        set((state) => {
          if (enabled && state.activeChatVideoId) {
            return {
              audioFollowsChat: true,
              unmutedVideoIds: [state.activeChatVideoId],
              lastUnmutedVideoIds: [state.activeChatVideoId],
              manuallyMutedVideoIds: state.streams
                .map((s) => s.videoId)
                .filter((id) => id !== state.activeChatVideoId),
              focusedVideoId: state.activeChatVideoId,
            };
          }
          return { audioFollowsChat: enabled };
        });
      },

      reorderStreams: (fromIndex: number, toIndex: number) => {
        set((state) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.streams.length ||
            toIndex >= state.streams.length
          ) {
            return state;
          }
          const nextStreams = [...state.streams];
          const [moved] = nextStreams.splice(fromIndex, 1);
          nextStreams.splice(toIndex, 0, moved);
          return { streams: nextStreams };
        });
      },

      replaceStream: (
        oldVideoId: string,
        newInput: string,
        customLabel?: string
      ): AddStreamResult => {
        const nextId = extractYouTubeVideoId(newInput);
        if (!nextId) {
          return {
            success: false,
            error: "Invalid replacement stream URL or ID.",
          };
        }

        const state = get();
        const targetIndex = state.streams.findIndex(
          (s) => s.videoId === oldVideoId
        );
        if (targetIndex === -1) {
          return { success: false, error: "Target stream not found." };
        }

        if (
          nextId !== oldVideoId &&
          state.streams.some((s) => s.videoId === nextId)
        ) {
          return {
            success: false,
            error: `Stream (${nextId}) is already active in the grid.`,
          };
        }

        const nextLabel = buildDefaultStreamLabel(
          nextId,
          customLabel,
          targetIndex + 1
        );

        const nextStreams = [...state.streams];
        nextStreams[targetIndex] = {
          videoId: nextId,
          label: nextLabel,
          addedAt: Date.now(),
        };

        const nextVolumes = { ...state.streamVolumes };
        const prevVol = nextVolumes[oldVideoId] ?? 100;
        delete nextVolumes[oldVideoId];
        nextVolumes[nextId] = prevVol;

        set({
          streams: nextStreams,
          streamVolumes: nextVolumes,
          unmutedVideoIds: state.unmutedVideoIds.map((id) =>
            id === oldVideoId ? nextId : id
          ),
          lastUnmutedVideoIds: state.lastUnmutedVideoIds.map((id) =>
            id === oldVideoId ? nextId : id
          ),
          manuallyMutedVideoIds: state.manuallyMutedVideoIds.map((id) =>
            id === oldVideoId ? nextId : id
          ),
          focusedVideoId:
            state.focusedVideoId === oldVideoId ? nextId : state.focusedVideoId,
          activeChatVideoId:
            state.activeChatVideoId === oldVideoId
              ? nextId
              : state.activeChatVideoId,
          secondaryChatVideoId:
            state.secondaryChatVideoId === oldVideoId
              ? nextId
              : state.secondaryChatVideoId,
        });

        return { success: true, videoId: nextId };
      },

      triggerSyncAllLive: () => {
        set((state) => ({
          syncLiveVersion: state.syncLiveVersion + 1,
        }));
      },

      setAutoCycle: (enabled: boolean, intervalSec?: AutoCycleInterval) => {
        set((state) => ({
          autoCycleEnabled: enabled,
          autoCycleIntervalSec: intervalSec ?? state.autoCycleIntervalSec,
        }));
      },

      cycleNextStream: () => {
        set((state) => {
          if (state.streams.length <= 1) return state;

          // If Solo Focus is active, advance focus along the stream list
          if (state.focusedVideoId) {
            const currentIdx = state.streams.findIndex(
              (s) => s.videoId === state.focusedVideoId
            );
            const nextIdx = (currentIdx + 1) % state.streams.length;
            const nextId = state.streams[nextIdx].videoId;
            return {
              focusedVideoId: nextId,
              unmutedVideoIds: [nextId],
              lastUnmutedVideoIds: [nextId],
              manuallyMutedVideoIds: state.streams
                .map((s) => s.videoId)
                .filter((id) => id !== nextId),
            };
          }

          // Otherwise rotate streams so the next feed moves into Slot #01
          const [first, ...rest] = state.streams;
          return {
            streams: [...rest, first],
          };
        });
      },

      setEcoMode: (enabled: boolean) => {
        set({ ecoModeEnabled: enabled });
      },

      setSplitChat: (enabled: boolean) => {
        set((state) => ({
          isSplitChat: enabled,
          secondaryChatVideoId:
            state.secondaryChatVideoId ??
            state.streams.find((s) => s.videoId !== state.activeChatVideoId)
              ?.videoId ??
            state.streams[0]?.videoId ??
            null,
        }));
      },

      setSecondaryChatStream: (videoId: string) => {
        set({ secondaryChatVideoId: videoId });
      },

      setCompactChat: (compact: boolean) => {
        set({ isCompactChat: compact });
      },

      setSplitChatRatio: (ratio: number) => {
        const clamped = Math.max(25, Math.min(75, Math.round(ratio)));
        set({ splitChatRatio: clamped });
      },

      setKeepChatAlive: (keepAlive: boolean) => {
        set({ keepChatAlive: keepAlive });
      },

      swapSplitChatStreams: () => {
        set((state) => {
          if (state.streams.length <= 1) return state;
          const primary =
            state.streams.find((s) => s.videoId === state.activeChatVideoId)
              ?.videoId ??
            state.streams[0]?.videoId ??
            null;
          const secondary =
            state.streams.find((s) => s.videoId === state.secondaryChatVideoId)
              ?.videoId ??
            state.streams[1]?.videoId ??
            state.streams[0]?.videoId ??
            null;
          if (!primary || !secondary || primary === secondary) return state;

          const nextState: Partial<StreamState> = {
            activeChatVideoId: secondary,
            secondaryChatVideoId: primary,
          };

          if (state.audioFollowsChat) {
            nextState.unmutedVideoIds = [secondary];
            nextState.lastUnmutedVideoIds = [secondary];
            nextState.manuallyMutedVideoIds = state.streams
              .map((s) => s.videoId)
              .filter((id) => id !== secondary);
            nextState.focusedVideoId = secondary;
          }

          return nextState;
        });
      },

      cycleChatStream: (direction: 1 | -1) => {
        set((state) => {
          if (state.streams.length <= 1) return state;
          const currentIdx = state.streams.findIndex(
            (s) => s.videoId === state.activeChatVideoId
          );
          const safeIdx = currentIdx === -1 ? 0 : currentIdx;
          const nextIdx =
            (safeIdx + direction + state.streams.length) % state.streams.length;
          const nextId = state.streams[nextIdx].videoId;

          const nextState: Partial<StreamState> = {
            activeChatVideoId: nextId,
            isChatOpen: true,
            hasChatActivated: true,
          };

          if (state.audioFollowsChat) {
            nextState.unmutedVideoIds = [nextId];
            nextState.lastUnmutedVideoIds = [nextId];
            nextState.manuallyMutedVideoIds = state.streams
              .map((s) => s.videoId)
              .filter((id) => id !== nextId);
            nextState.focusedVideoId = nextId;
          }

          return nextState;
        });
      },

      setAudioMixerOpen: (open: boolean) => {
        set({ isAudioMixerOpen: open });
      },

      setShortcutsOpen: (open: boolean) => {
        set({ isShortcutsOpen: open });
      },

      loadWallPack: (packStreams, preset) => {
        const now = Date.now();
        const mappedStreams: StreamItem[] = packStreams
          .slice(0, 9)
          .map((s, idx) => ({
            videoId: s.videoId,
            label: s.label,
            addedAt: now + idx,
          }));

        const nextVolumes: Record<string, number> = {};
        mappedStreams.forEach((s) => {
          nextVolumes[s.videoId] = 100;
        });

        set({
          streams: mappedStreams,
          gridPreset: preset,
          unmutedVideoIds: [],
          lastUnmutedVideoIds: [],
          focusedVideoId: null,
          manuallyMutedVideoIds: [],
          pipVideoId: null,
          streamVolumes: nextVolumes,
          streamQualities: {},
          activeChatVideoId: mappedStreams[0]?.videoId ?? null,
          secondaryChatVideoId: mappedStreams[1]?.videoId ?? null,
        });
      },

      setCommandPaletteOpen: (open: boolean) => {
        set({ isCommandPaletteOpen: open });
      },

      setPipVideoId: (videoId: string | null) => {
        set({ pipVideoId: videoId });
      },

      setChatSidebarWidth: (width: number) => {
        const clamped = Math.max(280, Math.min(680, Math.round(width)));
        set({ chatSidebarWidth: clamped });
      },

      setMainStageRatio: (ratio: number) => {
        const clamped = Math.max(45, Math.min(82, Math.round(ratio)));
        set({ mainStageRatio: clamped });
      },

      setSplitterDragging: (dragging: boolean) => {
        set({ isSplitterDragging: dragging });
      },

      setShowTelemetryTicker: (show: boolean) => {
        set({ showTelemetryTicker: show });
      },

      setBookmarksOpen: (open: boolean) => {
        set({ isBookmarksOpen: open });
      },

      setStreamQuality: (videoId: string, quality: string) => {
        set((state) => {
          if (state.streamQualities[videoId] === quality) return state;
          return {
            streamQualities: {
              ...state.streamQualities,
              [videoId]: quality,
            },
          };
        });
      },

      addBookmark: (videoId: string, note: string) => {
        const state = get();
        const stream = state.streams.find((s) => s.videoId === videoId);
        if (!stream) return null;

        const elapsedSec = Math.max(
          0,
          Math.floor((Date.now() - state.sessionStartedAt) / 1000)
        );
        const mins = Math.floor(elapsedSec / 60);
        const secs = elapsedSec % 60;
        const hrs = Math.floor(mins / 60);
        const elapsedLabel =
          hrs > 0
            ? `${String(hrs).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
            : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        const bookmark: StreamBookmark = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          videoId,
          streamLabel: stream.label,
          note: note.trim() || `Key moment on ${stream.label}`,
          createdAt: Date.now(),
          elapsedLabel,
        };

        set((s) => ({
          bookmarks: [bookmark, ...s.bookmarks].slice(0, 100),
        }));
        return bookmark;
      },

      removeBookmark: (id: string) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      clearBookmarks: () => {
        set({ bookmarks: [] });
      },

      setAmbilightEnabled: (enabled: boolean) => {
        set({ ambilightEnabled: enabled });
      },

      setSoundscapeType: (type: SoundscapeType) => {
        set({ soundscapeType: type });
      },

      setSoundscapeVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(100, Math.round(volume)));
        set({ soundscapeVolume: clamped });
      },

      setWatchPartyCode: (code: string | null) => {
        set({ watchPartyCode: code });
      },

      triggerFloatingReaction: (emoji: string, sender?: string) => {
        const reaction: FloatingReaction = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          emoji,
          sender,
          leftPct: 12 + Math.floor(Math.random() * 76),
          createdAt: Date.now(),
        };
        set((state) => ({
          floatingReactions: [...state.floatingReactions.slice(-18), reaction],
        }));
      },

      pruneFloatingReactions: () => {
        const cutoff = Date.now() - 3200;
        set((state) => ({
          floatingReactions: state.floatingReactions.filter(
            (r) => r.createdAt > cutoff
          ),
        }));
      },

      saveGuestLayout: (input) => {
        const guestLayout: GuestLayout = {
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: input.title.trim(),
          gridPreset: input.gridPreset,
          streams: input.streams,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          guestLayouts: [guestLayout, ...state.guestLayouts].slice(0, 25),
        }));
        return guestLayout;
      },

      deleteGuestLayout: (id: string) => {
        set((state) => ({
          guestLayouts: state.guestLayouts.filter((item) => item.id !== id),
        }));
      },

      setGuestProfile: (name: string) => {
        const trimmed = name.trim();
        set({
          guestName: trimmed || "Guest Director",
          isGuestSessionActive: true,
        });
      },
    }),
    {
      name: "tct-multi-youtube-stream-storage",
      storage: createJSONStorage(() => localStorage),
      // Persist layout & stream list locally, but always start muted on page reload
      // to comply with browser autoplay policies.
      partialize: (state) => ({
        streams: state.streams,
        gridPreset: state.gridPreset,
        activeChatVideoId: state.activeChatVideoId,
        secondaryChatVideoId: state.secondaryChatVideoId,
        isChatOpen: state.isChatOpen,
        isSplitChat: state.isSplitChat,
        isCompactChat: state.isCompactChat,
        splitChatRatio: state.splitChatRatio,
        keepChatAlive: state.keepChatAlive,
        masterVolume: state.masterVolume,
        streamVolumes: state.streamVolumes,
        audioFollowsHover: state.audioFollowsHover,
        audioFollowsChat: state.audioFollowsChat,
        ecoModeEnabled: state.ecoModeEnabled,
        autoCycleIntervalSec: state.autoCycleIntervalSec,
        chatSidebarWidth: state.chatSidebarWidth,
        mainStageRatio: state.mainStageRatio,
        showTelemetryTicker: state.showTelemetryTicker,
        bookmarks: state.bookmarks,
        ambilightEnabled: state.ambilightEnabled,
        soundscapeVolume: state.soundscapeVolume,
        guestLayouts: state.guestLayouts,
        guestName: state.guestName,
        isGuestSessionActive: state.isGuestSessionActive,
      }),
    }
  )
);
