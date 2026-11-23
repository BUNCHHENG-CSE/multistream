/**
 * Non-reactive registry of each player's latest playback position.
 * Players write at ~4Hz from YouTube `infoDelivery`; readers (bookmarks) pull on demand,
 * so nothing re-renders on every tick.
 */
export interface PlayerClock {
  /** Seconds into the video */
  currentTime: number;
  /** Duration in seconds (0 / growing for live) */
  duration: number;
  isLive: boolean;
}

const clocks = new Map<string, PlayerClock>();

export function setPlayerClock(videoId: string, clock: PlayerClock): void {
  clocks.set(videoId, clock);
}

export function getPlayerClock(videoId: string): PlayerClock | undefined {
  return clocks.get(videoId);
}

export function clearPlayerClock(videoId: string): void {
  clocks.delete(videoId);
}
